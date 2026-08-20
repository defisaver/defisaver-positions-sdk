import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import {
  calcLeverageLiqPrice, getAssetsTotal, getExposure, isLeveragedPos,
} from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import {
  LeverageType, MMAssetsData, MMUsedAsset, MMUsedAssets, NetworkNumber,
} from '../../types/common';
import {
  MorphoMidnightAggregatedPositionData,
  MorphoMidnightAssetsData,
  MorphoMidnightBookOffer,
  MorphoMidnightBookSide,
  MorphoMidnightMarketData,
  MorphoMidnightMarketInfo,
  MorphoMidnightParsedBook,
} from '../../types';
import { WAD } from '../../constants';
import { LONGER_TIMEOUT } from '../../services/utils';
import { isTenorMidnightMarket } from '../../markets/morphoMidnight';
import {
  buildMidnightParsedBook, midnightApyFromPrice, midnightBoundPrice, midnightTimeToMaturityDays,
} from './rate';
import {
  getTenorBorrowQuote, getTenorMarketBook, getTenorPaybackQuote, getTenorPaybackUnitsQuote,
} from './tenor';

export {
  buildMidnightParsedBook,
  midnightApyFromPrice,
  midnightBookBestFirst,
  midnightBoundPrice,
  midnightPriceFromApy,
  midnightTimeToMaturityDays,
  MIDNIGHT_DEFAULT_RATE_SLIPPAGE,
} from './rate';
export {
  tenorBookKeyFor,
  tenorBookRateToApyPercent,
  tenorOfferFillToApiFill,
  tenorOfferToApiOffer,
} from './tenor';

/**
 * Aggregate a Morpho Midnight position. Midnight markets are multi-collateral, so the borrow limit is
 * the sum of each collateral's USD value times its own lltv (Aave-v4 style), rather than a single pair.
 *
 * Note on amounts: `borrowedUsd` is derived from the position's `debt`, which is the face value owed at
 * maturity (principal + fixed interest). Health is therefore measured against the full maturity debt,
 * matching how MidnightView computes `ratio`. Fixed-rate APY is not derived on-chain in MVP, so
 * `netApy` reflects the `'0'` rates in `assetsData` (see the module getter).
 */
export const getMorphoMidnightAggregatedPositionData = ({
  usedAssets,
  assetsData,
  marketInfo,
}: {
  usedAssets: MMUsedAssets,
  assetsData: MorphoMidnightAssetsData,
  marketInfo: MorphoMidnightMarketInfo,
}): MorphoMidnightAggregatedPositionData => {
  const payload = {} as MorphoMidnightAggregatedPositionData;

  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);

  // borrowLimit = Σ collateralUsd_i * lltv_i (per-collateral lltv carried on assetsData)
  payload.borrowLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[symbol]?.lltv || 0),
  );
  payload.liquidationLimitUsd = payload.borrowLimitUsd;

  // Same subtraction every other money market uses, but it does NOT mean the same thing here. Elsewhere
  // `borrowedUsd` is debt at present value, so the remainder is what a borrow would pay out. Midnight
  // records debt at its face value at maturity, so this is face-value headroom: borrowing it would add
  // more debt than the number says, by the market's discount. Anything surfacing this as "what you can
  // borrow" has to scale it by the loan-per-unit price first (`midnightPriceFromApy` off a book rate) —
  // a correction that grows with the term, past 7% on a one-year market.
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();

  const loanTokenPrice = assetsData[marketInfo.loanToken]?.price || '0';
  payload.leftToBorrow = new Dec(loanTokenPrice).eq(0) ? '0' : new Dec(payload.leftToBorrowUsd).div(loanTokenPrice).toString();

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData: assetsData as unknown as MMAssetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  payload.ltv = new Dec(payload.suppliedCollateralUsd).eq(0) ? '0' : new Dec(payload.borrowedUsd).div(payload.suppliedCollateralUsd).toString();
  payload.ratio = new Dec(payload.borrowedUsd).eq(0) ? '0' : new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString();
  payload.healthRatio = new Dec(payload.borrowedUsd).eq(0) ? 'Infinity' : new Dec(payload.liquidationLimitUsd).div(payload.borrowedUsd).toDP(4).toString();

  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  payload.liquidationPrice = '';
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedAsset].price;
    if (leveragedType === LeverageType.VolatilePair) {
      const borrowedAsset = (Object.values(usedAssets) as MMUsedAsset[]).find(({ borrowedUsd }: { borrowedUsd: string }) => +borrowedUsd > 0);
      const borrowedAssetPrice = assetsData[borrowedAsset!.symbol].price;
      const leveragedAssetPrice = assetsData[leveragedAsset].price;
      const isReverse = new Dec(leveragedAssetPrice).lt(borrowedAssetPrice);
      if (isReverse) {
        payload.leveragedType = LeverageType.VolatilePairReverse;
        payload.currentVolatilePairRatio = new Dec(borrowedAssetPrice).div(leveragedAssetPrice).toDP(18).toString();
        assetPrice = new Dec(borrowedAssetPrice).div(assetPrice).toString();
      } else {
        assetPrice = new Dec(assetPrice).div(borrowedAssetPrice).toString();
        payload.currentVolatilePairRatio = new Dec(leveragedAssetPrice).div(borrowedAssetPrice).toDP(18).toString();
      }
    }
    payload.liquidationPrice = calcLeverageLiqPrice(payload.leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }

  payload.minCollRatio = new Dec(payload.borrowLimitUsd).eq(0) ? '0' : new Dec(payload.suppliedCollateralUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.liquidationLimitUsd).eq(0) ? '0' : new Dec(payload.suppliedCollateralUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  payload.exposure = getExposure(payload.borrowedUsd, payload.suppliedUsd);

  return payload;
};

// ── Off-chain order-book rate helpers ──────────────────────────────────────────────────────────────
// notion: https://app.notion.com/p/defisaver/Estimate-borrow-rate-and-slippage-before-execution-3a70be682adc80c783c8c11fdb761dd2
// the borrow rate is not exposed on-chain (MidnightView only stores total debt at maturity in `units`).
// derive the rate + interest from Morpho's public keyless Midnight API
// Quote prices are WAD-scaled
// loan-per-unit ratios (< 1 for a discounted fixed-term borrow); annualizing them yields the borrow APY.

const MIDNIGHT_API_BASE = 'https://api.morpho.org/v0/midnight';

// The book endpoint is markedly slower than the rest of the API — `LONGER_TIMEOUT` (5s) aborts it often
// enough that markets drop out of the list for no reason.
const MIDNIGHT_BOOK_TIMEOUT = 30000;

// The quote endpoint's `slippage` query param is validated as a string: 0.1–100, at most one decimal
// place (`0.50` is rejected even though `0.5` passes). See `midnightSlippageParam`.
const MIDNIGHT_SLIPPAGE_MIN = 0.1;
const MIDNIGHT_SLIPPAGE_MAX = 100;

interface MidnightPosition {
  market_id: string,
  type: string, // 'borrow' | 'lend'
  debt: string, // raw loan-token base units — matches MidnightView.getPositionInfo exactly
  cost_basis: string, // WAD-scaled raw base units — outstanding principal, net of exits/liquidations
  effective_rate_wad: string, // WAD-scaled borrow APY, e.g. 0.05e18 = 5%
}

interface MidnightApiError {
  code?: string,
  message?: string,
  details?: ({ field?: string, issue?: string })[] | null,
}

interface MidnightRawOffer {
  price: string, // WAD-scaled loan-per-unit
  assets: string, // loan-token base units available at this offer
}

interface MidnightQuoteResponse {
  average_best_price?: string,
  average_worst_price?: string,
  available_assets?: string,
  available_units?: string,
  takeable_offers?: unknown[],
}

export interface MorphoMidnightBorrowInfo {
  borrowRate: string, // effective borrow APY as a percent
  debtBase: string, // outstanding principal (cost_basis), loan-token units
  debtInterest: string, // debtTotal − debtBase (interest owed at maturity), loan-token units
  debtTotal: string, // on-chain debt at maturity, loan-token units
}

export interface MorphoMidnightBorrowQuote {
  bestPrice: string, // average_best_price, loan-per-unit
  worstPrice: string, // average_worst_price, slippage-adjusted
  estBorrowRate: string, // estimated borrow APY as a percent
  maxRate: string, // borrow APY the on-chain cap permits, i.e. `maxUnits` annualized (display only)
  newUnits: string, // debt added at best price, raw loan-token base units
  maxUnits: string, // capped debt (on-chain cap), raw loan-token base units
  availableAssets: string,
  availableUnits: string,
  takeableOffers: any[], // opaque orderbook offers, forwarded verbatim to on-chain execution
}

export interface MorphoMidnightPaybackQuote {
  bestPrice: string, // average_best_price, loan-per-unit — the cheapest units on the ask side
  worstPrice: string, // average_worst_price, slippage-adjusted (ABOVE best: a dearer unit)
  estPaybackRate: string, // APY the repayment retires debt at, as a percent
  minRate: string, // APY the on-chain floor permits, i.e. `minUnits` annualized (display only)
  newUnits: string, // debt retired at best price, raw loan-token base units
  minUnits: string, // floor on debt retired (on-chain guard), raw loan-token base units
  availableAssets: string,
  availableUnits: string,
  takeableOffers: any[], // opaque orderbook offers, forwarded verbatim to on-chain execution
}

// Payback quoted the other way round: the caller names the debt units to retire, and the quote prices
// what buying them costs. Same rate guard as the assets-target quote, expressed as a spend ceiling.
export interface MorphoMidnightPaybackUnitsQuote {
  bestPrice: string, // average_best_price, loan-per-unit — the cheapest units on the ask side
  worstPrice: string, // average_worst_price, slippage-adjusted (ABOVE best: a dearer unit)
  estPaybackRate: string, // APY the repayment retires debt at, as a percent
  minRate: string, // APY the on-chain ceiling permits, i.e. `maxAssets` annualized (display only)
  newAssets: string, // assets the target units cost at best price, raw loan-token base units
  maxAssets: string, // ceiling on assets spent (on-chain guard), raw loan-token base units
  availableAssets: string,
  availableUnits: string,
  takeableOffers: any[], // opaque orderbook offers, forwarded verbatim to on-chain execution
}

/**
 * Coerce a slippage into what the quote endpoint accepts: 0.1–100 with at most one decimal place. The
 * validation is lexical, so a computed value (`4.15066671050631467`) is rejected outright — without this
 * the request 400s and the quote looks unavailable.
 *
 * Rounded **down**, since a wider slippage is a looser cap than the caller asked for.
 */
export const midnightSlippageParam = (slippagePercent: Dec.Value): string => Dec.min(
  Dec.max(new Dec(slippagePercent), MIDNIGHT_SLIPPAGE_MIN),
  MIDNIGHT_SLIPPAGE_MAX,
).toDP(1, Dec.ROUND_DOWN).toString();

export const morphoMidnightMarketReportsBorrowInfo = (market: Pick<MorphoMidnightMarketData, 'curator'> | string): boolean => (
  !isTenorMidnightMarket(market)
);

/**
 * Current borrower rate + debt breakdown from the Midnight positions API. Reconstructing this from the raw
 * `/transactions` fill history only sums `borrow` fills, so it overstates debt for any position with an
 * early exit or partial liquidation (`exit_borrow_primary`, `partial_liquidation`, ... — the fill history
 * has no exhaustive list of debt-reducing event types). `/positions` instead reports the already-netted
 * `debt`, matching `MidnightView.getPositionInfo` exactly, plus `cost_basis` (outstanding principal,
 * WAD-scaled raw base units) and `effective_rate_wad` (borrow APY, WAD-scaled) for the base/interest split.
 * The caller swallows errors — a missing rate must never block position rendering.
 */
export const getMorphoMidnightUserBorrowInfo = async (
  account: string,
  marketId: string,
  loanTokenSymbol: string,
): Promise<MorphoMidnightBorrowInfo> => {
  const res = await fetch(`${MIDNIGHT_API_BASE}/users/${account}/positions`, { signal: AbortSignal.timeout(LONGER_TIMEOUT) });
  const json: { data?: MidnightPosition[] } = await res.json();
  const position = (json?.data || []).find((p) => p.type === 'borrow' && p.market_id?.toLowerCase() === marketId.toLowerCase());

  const debtTotal = assetAmountInEth(position?.debt || '0', loanTokenSymbol);
  const costBasisRaw = new Dec(position?.cost_basis || 0).div(WAD); // WAD-scaled → raw base units
  const debtBase = Dec.min(assetAmountInEth(costBasisRaw.toString(), loanTokenSymbol), debtTotal).toString();
  const debtInterest = Dec.max(new Dec(debtTotal).sub(debtBase), 0).toString();
  const borrowRate = new Dec(position?.effective_rate_wad || 0).div(WAD).mul(100).toString();

  return {
    borrowRate, debtBase, debtInterest, debtTotal,
  };
};

/**
 * The inverse of the split above: where `getMorphoMidnightUserBorrowInfo` reads a position's principal and
 * interest off the indexer, this carries that same split forward through a payback, from a debt of
 * `borrowedBefore` down to one of `borrowedAfter`. Retiring units retires principal and interest pro rata,
 * so both scale by the same fraction.
 *
 * Deriving the interest as `borrowedAfter − debtBase` instead reads it off two different sources —
 * `borrowed` is the chain's debt, `debtBase` the indexer's principal — so the entire gap between them lands
 * in the interest whenever they disagree, which they do until the indexer catches up with a fresh borrow or
 * payback: behind a borrow it inflates the interest by the debt the indexer has not seen yet, behind a
 * payback it goes negative on a position that still owes. Callers detect that window as
 * `debtBase + debtInterest !== debt`.
 *
 * Pro rata is also what keeps the answer sane when a payback retires debt at a different rate than the one
 * it was opened at. Mirroring a borrow instead — principal growing by the assets received, interest by the
 * rest — hands back a negative interest as soon as the book sells units back cheaper than they were bought.
 */
export const scaleMorphoMidnightDebtSplit = (
  { debtBase, debtInterest }: Pick<MorphoMidnightBorrowInfo, 'debtBase' | 'debtInterest'>,
  borrowedBefore: Dec.Value,
  borrowedAfter: Dec.Value,
): Pick<MorphoMidnightBorrowInfo, 'debtBase' | 'debtInterest'> => {
  const fractionRemaining = new Dec(borrowedBefore).lte(0)
    ? new Dec(0)
    : Dec.max(0, new Dec(borrowedAfter)).div(borrowedBefore);

  return {
    debtBase: new Dec(debtBase).mul(fractionRemaining).toString(),
    debtInterest: new Dec(debtInterest).mul(fractionRemaining).toString(),
  };
};

/**
 * One side of a market's resting order book, as rates rather than the API's WAD-scaled loan-per-unit
 * prices. Annualizing each price against time-to-maturity gives the rate a taker filling that offer gets
 * — verified against Morpho's fixed-market UI, where per-offer rates match to the cent.
 *
 * `bids` are the lend offers a borrower fills, so the best of them is the *lowest* rate; `asks` are the
 * sell offers a repayer buys debt units from, where a lower price buys more units, so the best is the
 * *highest* rate. Either way `offers` comes back best-first and `bestRate` is `offers[0].rate`.
 *
 * Returns `null` for an empty side: there is nothing to take, so a market listing should skip the market
 * rather than advertise it at a 0% rate. Throws when the request fails — an error response is rarely
 * JSON, so without the `res.ok` check it parses as an empty book and the market silently vanishes.
 */
export const getMorphoMidnightMarketBook = async (
  market: MorphoMidnightMarketData,
  network: NetworkNumber,
  side: MorphoMidnightBookSide = 'bids',
): Promise<MorphoMidnightParsedBook | null> => {
  if (isTenorMidnightMarket(market)) {
    return getTenorMarketBook(market, network, side);
  }

  const loanSymbol = getAssetInfoByAddress(market.loanToken, network).symbol;
  const res = await fetch(`${MIDNIGHT_API_BASE}/books/${market.marketId}`, { signal: AbortSignal.timeout(MIDNIGHT_BOOK_TIMEOUT) });
  if (!res.ok) throw new Error(`Midnight book request failed for ${market.value} (${res.status})`);

  const json: { data?: Partial<Record<MorphoMidnightBookSide, MidnightRawOffer[]>> } = await res.json();
  const ttmDays = midnightTimeToMaturityDays(market.maturity);

  const offers: MorphoMidnightBookOffer[] = (json?.data?.[side] || []).map((offer) => ({
    rate: midnightApyFromPrice(new Dec(offer.price).div(WAD), ttmDays),
    liquidity: assetAmountInEth(offer.assets, loanSymbol),
  }));

  return buildMidnightParsedBook(offers, side);
};

// The API says why a quote failed — NOT_FOUND (market matured or not open yet), INSUFFICIENT_LIQUIDITY
// (book can't fill the size), VALIDATION_ERROR (bad param, with the offending field in `details`).
// Callers surface this to the user, so keep the reason rather than collapsing everything into one string.
const midnightQuoteError = (error?: MidnightApiError): string => {
  const detail = (error?.details || []).map(({ issue }) => issue).filter(Boolean).join('; ');
  const reason = detail || error?.message || error?.code;
  return reason ? `Morpho Midnight quote unavailable: ${reason}` : 'Morpho Midnight quote unavailable';
};

interface MidnightParsedQuote {
  bestPrice: string, // loan-per-unit
  worstPrice: string, // slippage-adjusted; below best on `bids`, above it on `asks`
  availableAssets: string,
  availableUnits: string,
  takeableOffers: any[],
}

/**
 * How much of the book to quote. The endpoint takes exactly one of the two — it rejects a request with
 * neither ("Either assets or units must be provided") — and answers the same `takeable_offers` list either
 * way, since that list is the whole in-band depth rather than the slice this size consumes.
 */
type MidnightQuoteSize = { assets: string } | { units: string };

// The raw quote both sides share: prices descaled from WAD, everything else forwarded verbatim.
const fetchMorphoMidnightQuote = async (
  marketId: string,
  side: MorphoMidnightBookSide,
  size: MidnightQuoteSize,
  slippagePercent: Dec.Value,
): Promise<MidnightParsedQuote> => {
  const [sizeParam, sizeValue] = 'assets' in size ? ['assets', size.assets] : ['units', size.units];
  const url = `${MIDNIGHT_API_BASE}/books/${marketId}/${side}/quote?${sizeParam}=${sizeValue}&slippage=${midnightSlippageParam(slippagePercent)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(LONGER_TIMEOUT) });
  const json: { data?: MidnightQuoteResponse, error?: MidnightApiError } = await res.json();
  const d = json?.data;
  if (!d?.average_best_price) throw new Error(midnightQuoteError(json?.error));

  return {
    bestPrice: new Dec(d.average_best_price).div(WAD).toString(),
    worstPrice: new Dec(d.average_worst_price || 0).div(WAD).toString(),
    availableAssets: d.available_assets || '0',
    availableUnits: d.available_units || '0',
    takeableOffers: d.takeable_offers || [],
  };
};

export const getMorphoMidnightBorrowQuote = async (
  marketId: string,
  assetsRaw: string,
  slippagePercent: Dec.Value,
  maturity: number,
  maxBorrowRate?: Dec.Value,
  taker?: string,
  rateSlippagePercent?: Dec.Value,
): Promise<MorphoMidnightBorrowQuote> => {
  if (isTenorMidnightMarket(marketId)) {
    return getTenorBorrowQuote(marketId, assetsRaw, slippagePercent, maturity, maxBorrowRate, taker, rateSlippagePercent);
  }

  const quote = await fetchMorphoMidnightQuote(marketId, 'bids', { assets: assetsRaw }, slippagePercent);
  const { bestPrice } = quote;
  const ttmDays = midnightTimeToMaturityDays(maturity);
  const estBorrowRate = midnightApyFromPrice(bestPrice, ttmDays);

  // Price the cap sits at, and the rate that price represents — one derivation, so `maxRate` and
  // `maxUnits` can never disagree about what the user is protected at.
  const capPrice = midnightBoundPrice(estBorrowRate, ttmDays, 'ceiling', maxBorrowRate, rateSlippagePercent);
  const maxRate = midnightApyFromPrice(capPrice, ttmDays);
  const newUnits = new Dec(bestPrice).lte(0) ? '0' : new Dec(assetsRaw).div(bestPrice).toFixed(0);
  const maxUnits = new Dec(capPrice).lte(0) ? '0' : new Dec(assetsRaw).div(capPrice).toFixed(0);

  return {
    ...quote,
    estBorrowRate,
    maxRate,
    newUnits,
    maxUnits,
  };
};

export const getMorphoMidnightPaybackQuote = async (
  marketId: string,
  assetsRaw: string,
  slippagePercent: Dec.Value,
  maturity: number,
  minPaybackRate?: Dec.Value,
  taker?: string,
  rateSlippagePercent?: Dec.Value,
): Promise<MorphoMidnightPaybackQuote> => {
  if (isTenorMidnightMarket(marketId)) {
    return getTenorPaybackQuote(marketId, assetsRaw, slippagePercent, maturity, minPaybackRate, taker, rateSlippagePercent);
  }

  const quote = await fetchMorphoMidnightQuote(marketId, 'asks', { assets: assetsRaw }, slippagePercent);
  const { bestPrice } = quote;
  const ttmDays = midnightTimeToMaturityDays(maturity);
  const estPaybackRate = midnightApyFromPrice(bestPrice, ttmDays);

  const capPrice = midnightBoundPrice(estPaybackRate, ttmDays, 'floor', minPaybackRate, rateSlippagePercent);
  const minRate = midnightApyFromPrice(capPrice, ttmDays);
  // Rounded down on both counts: `newUnits` must not overstate the debt the user sees retired, and a
  // `minUnits` rounded up would be a stricter floor than asked for and revert a payback that was fine.
  const newUnits = new Dec(bestPrice).lte(0) ? '0' : new Dec(assetsRaw).div(bestPrice).toFixed(0, Dec.ROUND_DOWN);
  const minUnits = new Dec(capPrice).lte(0) ? '0' : new Dec(assetsRaw).div(capPrice).toFixed(0, Dec.ROUND_DOWN);

  return {
    ...quote,
    estPaybackRate,
    minRate,
    newUnits,
    minUnits,
  };
};


export const getMorphoMidnightPaybackUnitsQuote = async (
  marketId: string,
  unitsRaw: string,
  slippagePercent: Dec.Value,
  maturity: number,
  minPaybackRate?: Dec.Value,
  taker?: string,
  rateSlippagePercent?: Dec.Value,
): Promise<MorphoMidnightPaybackUnitsQuote> => {
  if (isTenorMidnightMarket(marketId)) {
    return getTenorPaybackUnitsQuote(marketId, unitsRaw, slippagePercent, maturity, minPaybackRate, taker, rateSlippagePercent);
  }

  const quote = await fetchMorphoMidnightQuote(marketId, 'asks', { units: unitsRaw }, slippagePercent);
  const { bestPrice } = quote;
  const ttmDays = midnightTimeToMaturityDays(maturity);
  const estPaybackRate = midnightApyFromPrice(bestPrice, ttmDays);

  const capPrice = midnightBoundPrice(estPaybackRate, ttmDays, 'floor', minPaybackRate, rateSlippagePercent);
  const minRate = midnightApyFromPrice(capPrice, ttmDays);
  // Rounded UP on both counts — the mirror of the assets-target quote's ROUND_DOWN. Here the figures are
  // what the taker SPENDS, so a value rounded down understates the cost by a base unit and would leave the
  // buy short of the units it was asked for.
  const newAssets = new Dec(unitsRaw).mul(bestPrice).toFixed(0, Dec.ROUND_UP);
  const maxAssets = new Dec(unitsRaw).mul(capPrice).toFixed(0, Dec.ROUND_UP);

  return {
    ...quote,
    estPaybackRate,
    minRate,
    newAssets,
    maxAssets,
  };
};
