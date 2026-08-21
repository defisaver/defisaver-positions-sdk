import Dec from 'decimal.js';

export const MIDNIGHT_MIN_HEALTH_RATIO = 1.025;

export interface MidnightBorrowHeadroomParams {
  borrowLimitUsd: Dec.Value;
  borrowedUsd: Dec.Value;
  principalPerUnit?: Dec.Value;
  availableAssetsUsd?: Dec.Value;
  isMatured?: boolean;
  minHealthRatio?: Dec.Value;
}

export interface MidnightBorrowHeadroom {
  headroomUsd: string;
  leftToBorrowUsd: string;
  borrowPowerUsed: string;
}

/**
 * The one answer to "how much more can this position borrow". Every surface that sizes a Midnight borrow
 * derives from here — the max-borrow getter, the max-boost getter and the position overview's headroom
 * rows — so a max and the figure shown next to it cannot drift into two different formulas.
 */
export const getMorphoMidnightBorrowHeadroom = ({
  borrowLimitUsd,
  borrowedUsd,
  principalPerUnit = 1,
  availableAssetsUsd,
  isMatured = false,
  minHealthRatio = MIDNIGHT_MIN_HEALTH_RATIO,
}: MidnightBorrowHeadroomParams): MidnightBorrowHeadroom => {
  const usableLimitUsd = new Dec(borrowLimitUsd).div(minHealthRatio);
  const headroomUsd = isMatured ? new Dec(0) : Dec.max(0, usableLimitUsd.sub(borrowedUsd));
  const payoutUsd = headroomUsd.mul(principalPerUnit);

  return {
    headroomUsd: headroomUsd.toString(),
    leftToBorrowUsd: (availableAssetsUsd === undefined ? payoutUsd : Dec.min(payoutUsd, availableAssetsUsd)).toString(),
    borrowPowerUsed: usableLimitUsd.lte(0) ? '0' : new Dec(borrowedUsd).div(usableLimitUsd).mul(100).toString(),
  };
};
