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

export const decodeTokenURIToSvg = (tokenURI: string): string => {
  try {
    const dataStartIndex = tokenURI.indexOf('base64,') + 'base64,'.length;
    const json = atob(tokenURI.slice(dataStartIndex));
    return JSON.parse(json)?.image;
  } catch (e) {
    console.error(e);
    return 'Error parsing NFT image';
  }
};