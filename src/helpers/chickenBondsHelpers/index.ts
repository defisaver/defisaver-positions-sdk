import Dec from 'decimal.js';

export const calcCBondsBLUSDFloorPrice = (bLUSDSupply: string, totalReserveLUSD: string) => {
  if (new Dec(bLUSDSupply).eq(0)) return '1';
  return new Dec(totalReserveLUSD).div(bLUSDSupply).toString();
};

export const calcAverageBondAgeMs = (totalWeightedStartTimes: string, totalPendingLusd: string) => {
  const averageStartTimeMs = new Dec(totalWeightedStartTimes).div(totalPendingLusd).round().mul(1000)
    .toNumber();

  return Date.now() - averageStartTimeMs;
};