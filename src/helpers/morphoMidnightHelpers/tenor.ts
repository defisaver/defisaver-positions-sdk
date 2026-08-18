import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { ZERO_ADDRESS, ZERO_BYTES32 } from '../../constants';
import {
  MorphoMidnightBookOffer,
  MorphoMidnightBookSide,
  MorphoMidnightMarketData,
  MorphoMidnightParsedBook,
  NetworkNumber,
} from '../../types';
import { isTenorMidnightMarket, MIDNIGHT_BASE } from '../../markets/morphoMidnight';
import type {
  MorphoMidnightBorrowQuote,
  MorphoMidnightPaybackQuote,
  MorphoMidnightPaybackUnitsQuote,
} from './index';
import {
  buildMidnightParsedBook,
  midnightApyFromPrice,
  midnightBoundPrice,
  midnightTimeToMaturityDays,
} from './rate';


// Notion doc by Rajko: https://app.notion.com/p/defisaver/Tenor-API-3ba0be682adc80dfad35c81a9a4cb442

const TENOR_QUOTES_URL = 'https://router.tenor.finance/v1/quotes';
const TENOR_ORDERBOOK_URL = 'https://router.tenor.finance/v1/orderbook';
const TENOR_TIMEOUT_MS = 15000;
const TENOR_ALGORITHM = 'branch_and_bound';

const tenorQuoteError = (reason?: string): string => (
  reason ? `Morpho Midnight quote unavailable: ${reason}` : 'Morpho Midnight quote unavailable'
);

type TenorBookKey = 'asks' | 'bids';
export const tenorBookKeyFor = (side: MorphoMidnightBookSide): TenorBookKey => (side === 'bids' ? 'asks' : 'bids');

// Tenor order-book levels are annualized APR in basis points: 25 → 0.25%, 700 → 7%.
export const tenorBookRateToApyPercent = (rate: Dec.Value): string => new Dec(rate || 0).div(100).toString();

const tenorFillPrice = (assets: Dec.Value, units: Dec.Value): string => (
  new Dec(units).lte(0) ? '0' : new Dec(assets).div(units).toString()
);

interface TenorOfferCollateral {
  token: string;
  lltv: string | number;
  liquidation_cursor: string | number;
  oracle: string;
}

interface TenorOffer {
  start: string | number;
  group?: string;
  callback?: string;
  tick: string | number;
  chain_id: string | number;
  maturity: string | number;
  buy: boolean;
  maker: string;
  loan_token_address: string;
  callback_data?: string;
  expiry: string | number;
  ratifier?: string;
  collaterals: TenorOfferCollateral[];
  continuous_fee_cap: string | number;
  enter_gate: string;
  liquidator_gate: string;
  max_assets: string | number;
  max_units: string | number;
  ratifier_data?: string;
  rcf_threshold: string | number;
  receiver_if_maker_is_seller?: string;
  reduce_only: boolean;
}

interface TenorOfferFill {
  units: string | number;
  offer: TenorOffer;
}

/**
 * Tenor's offer JSON is flat (market fields live on the offer). Morpho's is nested, and that nested
 * shape is what the app encodes for `Midnight.take`. Map Tenor into that shape so recipes stay on one encoder.
 */
export const tenorOfferToApiOffer = (offer: TenorOffer) => ({
  market: {
    chain_id: offer.chain_id,
    midnight: MIDNIGHT_BASE,
    loan_token: offer.loan_token_address,
    collaterals: offer.collaterals || [],
    maturity: offer.maturity,
    rcf_threshold: offer.rcf_threshold,
    enter_gate: offer.enter_gate,
    liquidator_gate: offer.liquidator_gate,
  },
  buy: offer.buy,
  maker: offer.maker,
  start: offer.start,
  expiry: offer.expiry,
  tick: offer.tick,
  group: offer.group || ZERO_BYTES32,
  callback: offer.callback || ZERO_ADDRESS,
  callback_data: offer.callback_data || '0x',
  receiver_if_maker_is_seller: offer.receiver_if_maker_is_seller || ZERO_ADDRESS,
  ratifier: offer.ratifier || ZERO_ADDRESS,
  reduce_only: offer.reduce_only,
  max_units: offer.max_units,
  max_assets: offer.max_assets,
  continuous_fee_cap: offer.continuous_fee_cap,
});

export const tenorOfferFillToApiFill = (fill: TenorOfferFill) => ({
  units: fill.units,
  offer: tenorOfferToApiOffer(fill.offer),
  ratifier_data: fill.offer.ratifier_data || '0x',
  market_id: '',
});

interface TenorBookBucket {
  rate: number | string;
  liquidity: number | string;
  cumulative_liquidity?: number | string;
}

interface TenorBookSidePayload {
  buckets?: TenorBookBucket[];
}

interface TenorBookResponse {
  asks?: TenorBookSidePayload | TenorBookBucket[];
  bids?: TenorBookSidePayload | TenorBookBucket[];
}

const tenorBookBuckets = (side?: TenorBookSidePayload | TenorBookBucket[]): TenorBookBucket[] => {
  if (!side) return [];
  if (Array.isArray(side)) return side;
  return side.buckets || [];
};

/** The levels resting on the Tenor side a taker of `side` fills, in raw loan-token base units. */
export const parseTenorBookSide = (
  json: TenorBookResponse,
  side: MorphoMidnightBookSide,
) => tenorBookBuckets(json[tenorBookKeyFor(side)])
  .map((bucket) => ({
    rate: tenorBookRateToApyPercent(bucket.rate),
    liquidityRaw: new Dec(bucket.liquidity || 0).toFixed(0),
  }))
  .filter((offer) => new Dec(offer.liquidityRaw).gt(0));

export const parseTenorOrderBook = (
  json: TenorBookResponse,
  side: MorphoMidnightBookSide,
  loanSymbol: string,
): MorphoMidnightParsedBook | null => {
  const offers: MorphoMidnightBookOffer[] = parseTenorBookSide(json, side).map((offer) => ({
    rate: offer.rate,
    liquidity: assetAmountInEth(offer.liquidityRaw, loanSymbol),
  }));

  return buildMidnightParsedBook(offers, side);
};

const fetchTenorBook = async (marketId: string, network: NetworkNumber): Promise<TenorBookResponse> => {
  const res = await fetch(
    `${TENOR_ORDERBOOK_URL}/${marketId}?chain_id=${network}`,
    { signal: AbortSignal.timeout(TENOR_TIMEOUT_MS) },
  );
  if (!res.ok) throw new Error(`Midnight book request failed for ${marketId} (${res.status})`);
  return res.json();
};

export const getTenorMarketBook = async (
  market: MorphoMidnightMarketData,
  network: NetworkNumber,
  side: MorphoMidnightBookSide = 'bids',
): Promise<MorphoMidnightParsedBook | null> => {
  const loanSymbol = getAssetInfoByAddress(market.loanToken, network).symbol;
  return parseTenorOrderBook(await fetchTenorBook(market.marketId, network), side, loanSymbol);
};

const tenorBookAvailableAssetsRaw = async (
  marketId: string,
  network: NetworkNumber,
  side: MorphoMidnightBookSide,
): Promise<string> => {
  try {
    const json = await fetchTenorBook(marketId, network);
    return parseTenorBookSide(json, side).reduce((sum, offer) => sum.add(offer.liquidityRaw), new Dec(0)).toFixed(0);
  } catch {
    return '0';
  }
};

interface TenorQuotePayload {
  units?: string;
  rate?: string;
  buyer_assets?: string;
  seller_assets?: string;
  offers?: TenorOfferFill[];
}

interface TenorQuoteResponse extends TenorQuotePayload {
  quotes?: TenorQuotePayload[];
  error?: string;
  message?: string;
}

const fetchTenorQuote = async ({
  marketId,
  side,
  assets,
  units,
  taker,
  network = NetworkNumber.Base,
}: {
  marketId: string,
  side: MorphoMidnightBookSide,
  assets?: string,
  units?: string,
  taker?: string,
  network?: NetworkNumber,
}) => {
  const hasAssets = assets !== undefined && assets !== null;
  const hasUnits = units !== undefined && units !== null;
  if (hasAssets === hasUnits) {
    throw new Error(tenorQuoteError('Either assets or units must be provided'));
  }
  if (side !== 'asks' && side !== 'bids') {
    throw new Error(tenorQuoteError(`Unsupported Tenor quote side: ${side}`));
  }

  const isBuy = side === 'asks';
  const amount = (hasAssets ? assets : units) as string;
  const res = await fetch(TENOR_QUOTES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      market_hashes: [marketId],
      amount,
      chain_id: network,
      is_buy: isBuy,
      is_exact_in: hasAssets ? isBuy : !isBuy,
      limit_rate: null,
      valid_for: null,
      algorithm: TENOR_ALGORITHM,
      allow_partial: false,
      taker: taker || ZERO_ADDRESS,
    }),
    signal: AbortSignal.timeout(TENOR_TIMEOUT_MS),
  });

  const result: TenorQuoteResponse = await res.json().catch(() => ({} as TenorQuoteResponse));
  if (!res.ok) {
    throw new Error(tenorQuoteError(result.error || result.message || `Tenor quote request failed with status ${res.status}`));
  }

  const payload: TenorQuotePayload = result.quotes?.[0] || result;
  const quotedUnits = new Dec(payload.units || result.units || 0);
  const offers = payload.offers || result.offers || [];
  // A book that can't fill the size comes back 200 with everything zeroed rather than as an error.
  if (quotedUnits.lte(0) || offers.length === 0) {
    throw new Error(tenorQuoteError('INSUFFICIENT_LIQUIDITY'));
  }

  return {
    units: quotedUnits.toFixed(0),
    buyerAssets: (payload.buyer_assets || result.buyer_assets || '0').toString(),
    offerFills: offers.map(tenorOfferFillToApiFill),
  };
};

const TENOR_NO_AVAILABLE_UNITS = '0';

/**
 * Tenor's router takes no slippage of its own — it prices the fill and hands back the offers. `slippagePercent`
 * is therefore accepted only to keep the signature aligned with the Morpho-hosted quote that `index.ts`
 * forwards to positionally; the guard comes from `rateSlippagePercent` via `midnightBoundPrice`.
 */
export const getTenorBorrowQuote = async (
  marketId: string,
  assetsRaw: string,
  slippagePercent: Dec.Value,
  maturity: number,
  maxBorrowRate?: Dec.Value,
  taker?: string,
  rateSlippagePercent?: Dec.Value,
  network: NetworkNumber = NetworkNumber.Base,
): Promise<MorphoMidnightBorrowQuote> => {
  if (!isTenorMidnightMarket(marketId)) {
    throw new Error(tenorQuoteError(`Not a Tenor Midnight market: ${marketId}`));
  }

  const [quote, availableAssets] = await Promise.all([
    fetchTenorQuote({
      marketId, side: 'bids', assets: assetsRaw, taker, network,
    }),
    tenorBookAvailableAssetsRaw(marketId, network, 'bids'),
  ]);

  const ttmDays = midnightTimeToMaturityDays(maturity);
  const bestPrice = tenorFillPrice(assetsRaw, quote.units);
  const estBorrowRate = midnightApyFromPrice(bestPrice, ttmDays);

  const capPrice = midnightBoundPrice(estBorrowRate, ttmDays, 'ceiling', maxBorrowRate, rateSlippagePercent);
  const maxRate = midnightApyFromPrice(capPrice, ttmDays);
  const maxUnits = new Dec(capPrice).lte(0) ? '0' : new Dec(assetsRaw).div(capPrice).toFixed(0);

  return {
    bestPrice,
    worstPrice: capPrice,
    estBorrowRate,
    maxRate,
    newUnits: quote.units,
    maxUnits,
    availableAssets,
    availableUnits: TENOR_NO_AVAILABLE_UNITS,
    takeableOffers: quote.offerFills,
  };
};

export const getTenorPaybackQuote = async (
  marketId: string,
  assetsRaw: string,
  slippagePercent: Dec.Value,
  maturity: number,
  minPaybackRate?: Dec.Value,
  taker?: string,
  rateSlippagePercent?: Dec.Value,
  network: NetworkNumber = NetworkNumber.Base,
): Promise<MorphoMidnightPaybackQuote> => {
  if (!isTenorMidnightMarket(marketId)) {
    throw new Error(tenorQuoteError(`Not a Tenor Midnight market: ${marketId}`));
  }

  const [quote, availableAssets] = await Promise.all([
    fetchTenorQuote({
      marketId, side: 'asks', assets: assetsRaw, taker, network,
    }),
    tenorBookAvailableAssetsRaw(marketId, network, 'asks'),
  ]);

  const ttmDays = midnightTimeToMaturityDays(maturity);
  const bestPrice = tenorFillPrice(assetsRaw, quote.units);
  const estPaybackRate = midnightApyFromPrice(bestPrice, ttmDays);

  const capPrice = midnightBoundPrice(estPaybackRate, ttmDays, 'floor', minPaybackRate, rateSlippagePercent);
  const minRate = midnightApyFromPrice(capPrice, ttmDays);
  const minUnits = new Dec(capPrice).lte(0) ? '0' : new Dec(assetsRaw).div(capPrice).toFixed(0, Dec.ROUND_DOWN);

  return {
    bestPrice,
    worstPrice: capPrice,
    estPaybackRate,
    minRate,
    newUnits: quote.units,
    minUnits,
    availableAssets,
    availableUnits: TENOR_NO_AVAILABLE_UNITS,
    takeableOffers: quote.offerFills,
  };
};

export const getTenorPaybackUnitsQuote = async (
  marketId: string,
  unitsRaw: string,
  slippagePercent: Dec.Value,
  maturity: number,
  minPaybackRate?: Dec.Value,
  taker?: string,
  rateSlippagePercent?: Dec.Value,
  network: NetworkNumber = NetworkNumber.Base,
): Promise<MorphoMidnightPaybackUnitsQuote> => {
  if (!isTenorMidnightMarket(marketId)) {
    throw new Error(tenorQuoteError(`Not a Tenor Midnight market: ${marketId}`));
  }

  const [quote, availableAssets] = await Promise.all([
    fetchTenorQuote({
      marketId, side: 'asks', units: unitsRaw, taker, network,
    }),
    tenorBookAvailableAssetsRaw(marketId, network, 'asks'),
  ]);

  const ttmDays = midnightTimeToMaturityDays(maturity);
  const newAssets = quote.buyerAssets;
  const bestPrice = tenorFillPrice(newAssets, unitsRaw);
  const estPaybackRate = midnightApyFromPrice(bestPrice, ttmDays);

  const capPrice = midnightBoundPrice(estPaybackRate, ttmDays, 'floor', minPaybackRate, rateSlippagePercent);
  const minRate = midnightApyFromPrice(capPrice, ttmDays);
  const maxAssets = new Dec(unitsRaw).mul(capPrice).toFixed(0, Dec.ROUND_UP);

  return {
    bestPrice,
    worstPrice: capPrice,
    estPaybackRate,
    minRate,
    newAssets,
    maxAssets,
    availableAssets,
    availableUnits: TENOR_NO_AVAILABLE_UNITS,
    takeableOffers: quote.offerFills,
  };
};
