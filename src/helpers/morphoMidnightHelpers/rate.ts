import Dec from 'decimal.js';
import { SECONDS_PER_DAY } from '../../constants';
import { MorphoMidnightBookOffer, MorphoMidnightBookSide, MorphoMidnightParsedBook } from '../../types';

const nowInSeconds = () => Math.floor(Date.now() / 1000);

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
 * Inverse of `midnightApyFromPrice`: the loan-per-unit price a borrow APY implies,
 * price = (1 + rate)^(−ttmDays / 365).
 */
export const midnightPriceFromApy = (ratePercent: Dec.Value, ttmDays: Dec.Value): string => {
  const rate = new Dec(ratePercent);
  const ttm = new Dec(ttmDays);
  if (rate.lte(0) || ttm.lte(0)) return '1';
  return new Dec(1).div(new Dec(1).add(rate.div(100)).pow(ttm.div(365))).toString();
};

export const MIDNIGHT_DEFAULT_RATE_SLIPPAGE = 0.1;

const MIDNIGHT_MIN_FLOOR_RATIO = 0.5;

/** Which side of the estimate a guard sits on: a ceiling for borrows, a floor for paybacks. */
export type MidnightRateBoundKind = 'ceiling' | 'floor';

export const midnightBoundPrice = (
  estRate: Dec.Value,
  ttmDays: Dec.Value,
  kind: MidnightRateBoundKind,
  boundRate?: Dec.Value,
  rateSlippagePercent: Dec.Value = MIDNIGHT_DEFAULT_RATE_SLIPPAGE,
): string => {
  if (boundRate !== undefined && new Dec(boundRate).gt(0)) return midnightPriceFromApy(boundRate, ttmDays);

  const est = new Dec(estRate);
  const slippage = new Dec(rateSlippagePercent);
  const bound = kind === 'ceiling'
    ? est.add(slippage)
    : Dec.max(est.sub(slippage), est.mul(MIDNIGHT_MIN_FLOOR_RATIO));

  return midnightPriceFromApy(bound, ttmDays);
};

export const midnightBookBestFirst = (side: MorphoMidnightBookSide): 1 | -1 => (side === 'asks' ? -1 : 1);

export const buildMidnightParsedBook = (
  offers: MorphoMidnightBookOffer[],
  side: MorphoMidnightBookSide,
): MorphoMidnightParsedBook | null => {
  const bestFirst = [...offers].sort((a, b) => new Dec(a.rate).minus(b.rate).mul(midnightBookBestFirst(side)).toNumber());
  if (bestFirst.length === 0) return null;

  return {
    bestRate: bestFirst[0].rate,
    totalLiquidity: bestFirst.reduce((sum, offer) => sum.add(offer.liquidity), new Dec(0)).toString(),
    offers: bestFirst,
  };
};
