import Dec from 'decimal.js';
import { assetAmountInEth } from '@defisaver/tokens';
import {
  calcLeverageLiqPrice, getAssetsTotal, getExposure, isLeveragedPos,
} from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import {
  LeverageType, MMAssetsData, MMUsedAsset, MMUsedAssets,
} from '../../types/common';
import { MorphoMidnightAggregatedPositionData, MorphoMidnightAssetsData, MorphoMidnightMarketInfo } from '../../types';
import { SECONDS_PER_DAY, WAD } from '../../constants';
import { LONGER_TIMEOUT } from '../../services/utils';

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
const nowInSeconds = () => Math.floor(Date.now() / 1000);

interface MidnightTransaction {
  event_type: string,
  market_id: string,
  created_at: number,
  data: { seller_assets?: string, units?: string },
}

export interface MorphoMidnightBorrowInfo {
  borrowRate: string, // weighted-average borrow APY as a percent
  debtBase: string, // base borrowed (Σ seller_assets), loan-token units
  debtInterest: string, // debtTotal − debtBase (interest owed at maturity), loan-token units
  debtTotal: string, // Σ units = on-chain debt at maturity, loan-token units
}

export interface MorphoMidnightBorrowQuote {
  bestPrice: string, // average_best_price, loan-per-unit
  worstPrice: string, // average_worst_price, slippage-adjusted
  estBorrowRate: string, // estimated borrow APY as a percent
  maxRate: string, // estBorrowRate + slippage (display only, not sent on-chain)
  newUnits: string, // debt added at best price, raw loan-token base units
  maxUnits: string, // slippage-capped debt (on-chain cap), raw loan-token base units
  availableAssets: string,
  availableUnits: string,
  takeableOffers: any[], // opaque orderbook offers, forwarded verbatim to on-chain execution
}

// Days remaining until maturity, optionally measured at a past timestamp (for historical fills).
export const midnightTimeToMaturityDays = (maturity: number, atSeconds: number = nowInSeconds()): number => new Dec(maturity).sub(atSeconds).div(SECONDS_PER_DAY).toNumber();

// Annualize a fixed-term discount price into an APY percent: (1 / price)^(365 / ttmDays) − 1.
// `price` is loan-per-unit (assets received / units owed), so 1/price ≥ 1.
export const midnightApyFromPrice = (price: Dec.Value, ttmDays: Dec.Value): string => {
  const p = new Dec(price);
  const ttm = new Dec(ttmDays);
  if (p.lte(0) || ttm.lte(0)) return '0';
  return new Dec(1).div(p).pow(new Dec(365).div(ttm)).sub(1)
    .mul(100)
    .toString();
};

/**
 * Current borrower rate + debt breakdown from the Midnight transactions API. On-chain we can only read the
 * total debt at maturity (`units`); the base-vs-interest split and the effective borrow rate require the
 * fill history. Per fill the rate is (units / seller_assets)^(365 / ttmAtFill) − 1, weighted by base amount.
 * The caller swallows errors — a missing rate must never block position rendering.
 */
export const getMorphoMidnightUserBorrowInfo = async (
  account: string,
  marketId: string,
  maturity: number,
  loanTokenSymbol: string,
): Promise<MorphoMidnightBorrowInfo> => {
  const res = await fetch(`${MIDNIGHT_API_BASE}/users/${account}/transactions`, { signal: AbortSignal.timeout(LONGER_TIMEOUT) });
  const json: { data?: MidnightTransaction[] } = await res.json();
  const borrows = (json?.data || []).filter((t) => t.event_type === 'borrow' && t.market_id?.toLowerCase() === marketId.toLowerCase());

  let sumSeller = new Dec(0); // Σ seller_assets (base), raw
  let sumUnits = new Dec(0); // Σ units (debt at maturity), raw
  let weightedApy = new Dec(0); // Σ seller_assets × APYᵢ

  borrows.forEach((t) => {
    const sellerAssets = new Dec(t.data?.seller_assets || 0);
    const units = new Dec(t.data?.units || 0);
    if (sellerAssets.lte(0) || units.lte(0)) return;
    const ttmDays = midnightTimeToMaturityDays(maturity, t.created_at);
    const apy = midnightApyFromPrice(sellerAssets.div(units), ttmDays); // price = seller_assets / units
    sumSeller = sumSeller.add(sellerAssets);
    sumUnits = sumUnits.add(units);
    weightedApy = weightedApy.add(sellerAssets.mul(apy));
  });

  const borrowRate = sumSeller.lte(0) ? '0' : weightedApy.div(sumSeller).toString();
  const debtBase = assetAmountInEth(sumSeller.toFixed(0), loanTokenSymbol);
  const debtTotal = assetAmountInEth(sumUnits.toFixed(0), loanTokenSymbol);
  const debtInterest = Dec.max(new Dec(debtTotal).sub(debtBase), 0).toString();

  return {
    borrowRate, debtBase, debtInterest, debtTotal,
  };
};

/**
 * Estimate the borrow rate + slippage cap for a prospective borrow by quoting the Midnight order book.
 * `assetsRaw` (and the returned `newUnits`/`maxUnits`) are raw loan-token base units — callers convert to/from
 * human amounts. `maxUnits` (from the slippage-adjusted worst price) is the cap sent on-chain to protect the
 * user if better offers get filled first. Throws if the book can't fill the amount (caller handles).
 */
export const getMorphoMidnightBorrowQuote = async (
  marketId: string,
  assetsRaw: string,
  slippagePercent: Dec.Value,
  maturity: number,
): Promise<MorphoMidnightBorrowQuote> => {
  const url = `${MIDNIGHT_API_BASE}/books/${marketId}/bids/quote?assets=${assetsRaw}&slippage=${slippagePercent}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(LONGER_TIMEOUT) });
  const json: { data?: any } = await res.json();
  const d = json?.data;
  if (!d?.average_best_price) throw new Error('Morpho Midnight quote unavailable');

  const bestPrice = new Dec(d.average_best_price).div(WAD).toString();
  const worstPrice = new Dec(d.average_worst_price).div(WAD).toString();
  const ttmDays = midnightTimeToMaturityDays(maturity);
  const estBorrowRate = midnightApyFromPrice(bestPrice, ttmDays);
  const maxRate = new Dec(estBorrowRate).add(slippagePercent).toString();
  const newUnits = new Dec(bestPrice).lte(0) ? '0' : new Dec(assetsRaw).div(bestPrice).toFixed(0);
  const maxUnits = new Dec(worstPrice).lte(0) ? '0' : new Dec(assetsRaw).div(worstPrice).toFixed(0);

  return {
    bestPrice,
    worstPrice,
    estBorrowRate,
    maxRate,
    newUnits,
    maxUnits,
    availableAssets: d.available_assets,
    availableUnits: d.available_units,
    takeableOffers: d.takeable_offers || [],
  };
};
