import Dec from 'decimal.js';

/**
 * Safety margin every Midnight position is held at. On Midnight the lltv is *both* the borrow cap and the
 * liquidation threshold (`liquidationLimitUsd === borrowLimitUsd` in the aggregate), so a position borrowed
 * to its full limit opens at a health ratio of exactly 1 — immediately liquidatable. This is what holds it
 * off that line, and what absorbs swap price impact on a boost.
 */
export const MIDNIGHT_MIN_HEALTH_RATIO = 1.025;

export interface MidnightBorrowHeadroomParams {
  borrowLimitUsd: Dec.Value;
  borrowedUsd: Dec.Value;
  /** Principal a unit of borrow power is worth (loan-per-unit price, ≤ 1), off a book rate. */
  principalPerUnit?: Dec.Value;
  /** Depth the book can fill, in loan tokens, from the same quote. Omitted leaves the answer uncapped. */
  availableAssets?: Dec.Value;
  loanTokenPrice?: Dec.Value;
  /** Loan token decimals. Omitted skips the quantisation, which only a caller ignoring `leftToBorrow` wants. */
  loanTokenDecimals?: number;
  isMatured?: boolean;
  minHealthRatio?: Dec.Value;
}

export interface MidnightBorrowHeadroom {
  /** Face-value headroom, before the order-book discount. What a *boost* solve scales itself. */
  headroomUsd: string;
  /** The borrowable amount in loan tokens — the Borrow action's Max, quantised exactly as it is typed in. */
  leftToBorrow: string;
  /** `leftToBorrow · price`. Derived FROM the token amount, never computed alongside it — see below. */
  leftToBorrowUsd: string;
  borrowPowerUsed: string;
}

/**
 * The one answer to "how much more can this position borrow". Every surface that sizes a Midnight borrow
 * derives from here — the max-borrow getter, the position overview's headroom rows, and the max-boost
 * solve, which scales `headroomUsd` by its own leverage factors — so a max and the figure shown next to it
 * cannot drift into two different formulas. They did: the overview used to price
 * the whole headroom off the top-of-book offer (often dust) with no rate pad and no depth cap, while the
 * max walked the book for its real size, which is what put the two 1–2% apart.
 *
 * Three corrections separate this from a plain `limit − debt`, and dropping any one overstates the answer:
 * `minHealthRatio` reserves the margin, `principalPerUnit` turns face-value headroom into the principal a
 * borrow actually receives (a correction that grows with the term, past 7% on a one-year market), and
 * `availableAssets` caps it at what the book can currently fill.
 *
 * `leftToBorrowUsd` is deliberately `leftToBorrow · price` rather than the USD figure the token amount was
 * derived from: the two differ by the round-down to token decimals, and a UI showing one next to an input
 * holding the other would be reporting a difference the user cannot spend. Everything quantises once, here.
 */
export const getMorphoMidnightBorrowHeadroom = ({
  borrowLimitUsd,
  borrowedUsd,
  principalPerUnit = 1,
  availableAssets,
  loanTokenPrice = 0,
  loanTokenDecimals,
  isMatured = false,
  minHealthRatio = MIDNIGHT_MIN_HEALTH_RATIO,
}: MidnightBorrowHeadroomParams): MidnightBorrowHeadroom => {
  const usableLimitUsd = new Dec(borrowLimitUsd).div(minHealthRatio);
  const headroomUsd = isMatured ? new Dec(0) : Dec.max(0, usableLimitUsd.sub(borrowedUsd));

  const price = new Dec(loanTokenPrice);
  // Capped in loan tokens rather than in USD: `availableAssets` is quoted in tokens, and converting it to
  // USD only to divide the result back out again would re-round the one number that has to land exactly.
  const payout = price.lte(0) ? new Dec(0) : headroomUsd.mul(principalPerUnit).div(price);
  const capped = availableAssets === undefined ? payout : Dec.min(payout, availableAssets);
  // Round down: rounding the last decimal up would eat into the margin we just reserved.
  const leftToBorrow = loanTokenDecimals === undefined ? capped : capped.toDP(loanTokenDecimals, Dec.ROUND_DOWN);

  return {
    headroomUsd: headroomUsd.toString(),
    leftToBorrow: leftToBorrow.toString(),
    leftToBorrowUsd: leftToBorrow.mul(price).toString(),
    // Measured against the margined limit rather than the raw one, so it reads 100% at max borrow instead
    // of 97.56%, and can exceed 100% inside the reserved band. Deliberately left uncapped by book depth:
    // how much a position has borrowed is a property of the position, not of what the book can fill today.
    borrowPowerUsed: usableLimitUsd.lte(0) ? '0' : new Dec(borrowedUsd).div(usableLimitUsd).mul(100).toString(),
  };
};
