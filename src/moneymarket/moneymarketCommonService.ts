import Dec from 'decimal.js';
import { BLOCKS_IN_A_YEAR } from '../constants';
import { LeverageType, MMUsedAssets } from '../types/common';

export const getAssetsTotal = (assets: object, filter: any, transform: any) => (Object.values(assets) as any)
  .filter(filter)
  .map(transform)
  .reduce((acc: any, data: any) => new Dec(acc).add(data), '0')
  .toString();

export const calcLongLiqPrice = (assetPrice: string, borrowedUsd: string, borrowLimitUsd: string) => new Dec(assetPrice).mul(borrowedUsd).div(borrowLimitUsd).toString();
export const calcShortLiqPrice = (assetPrice: string, borrowedUsd: string, borrowLimitUsd: string) => new Dec(assetPrice).div(borrowedUsd).mul(borrowLimitUsd).toString();

export const calcLeverageLiqPrice = (leverageType: LeverageType, assetPrice: string, borrowedUsd: string, borrowLimitUsd: string) => {
  if (leverageType === LeverageType.Short || leverageType === LeverageType.VolatilePairReverse) return calcShortLiqPrice(assetPrice, borrowedUsd, borrowLimitUsd);
  if (leverageType === LeverageType.Long || leverageType === LeverageType.VolatilePair) return calcLongLiqPrice(assetPrice, borrowedUsd, borrowLimitUsd);
  console.error('invalid leverageType', leverageType);
  return '0';
};

export const calculateBorrowingAssetLimit = (assetBorrowedUsd: string, borrowLimitUsd: string) => new Dec(assetBorrowedUsd).div(borrowLimitUsd).times(100).toString();

export const STABLE_ASSETS = [
  'DAI', 'USDC', 'USDT', 'TUSD', 'USDP', 'GUSD', 'BUSD', 'SUSD', 'FRAX', 'LUSD', 'USDC.e', 'GHO', 'sDAI', 'USDA',
  'USDe', 'sUSDe', 'USDS', 'sUSDS', 'USR', 'EURC', 'BOLD', 'BOLD Legacy', 'RLUSD', 'PT sUSDe July', 'PT eUSDe May',
  'USDtb', 'eUSDe', 'PT USDe July', 'PT eUSDe Aug', 'PT sUSDe Sep', 'PT USDe Sep', 'PT sUSDe Nov', 'PT USDe Nov', 'PT sUSDe Jan', 'PT USDe Jan',
  'PT sUSDe Feb', 'PT USDe Feb', 'PT USDe Apr', 'PT sUSDe Apr',
];

export const isLeveragedPos = (usedAssets: MMUsedAssets, dustLimit = 5) => {
  let borrowUnstable = 0;
  let supplyStable = 0;
  let borrowStable = 0;
  let supplyUnstable = 0;
  let longAsset = '';
  let shortAsset = '';
  Object.values(usedAssets).forEach(({
    symbol, suppliedUsd, borrowedUsd, collateral,
  }) => {
    const isSupplied = (+suppliedUsd) > dustLimit; // ignore dust like <limit leftover supply
    const isBorrowed = (+borrowedUsd) > dustLimit; // ignore dust like <limit leftover supply
    if (isSupplied && STABLE_ASSETS.includes(symbol) && collateral) supplyStable += 1;
    if (isBorrowed && STABLE_ASSETS.includes(symbol)) borrowStable += 1;
    if (isBorrowed && !STABLE_ASSETS.includes(symbol)) {
      borrowUnstable += 1;
      shortAsset = symbol;
    }
    if (isSupplied && !STABLE_ASSETS.includes(symbol) && collateral) {
      supplyUnstable += 1;
      longAsset = symbol;
    }
  });
  const isLong = borrowStable > 0 && borrowUnstable === 0 && supplyUnstable === 1 && supplyStable === 0;
  const isShort = supplyStable > 0 && supplyUnstable === 0 && borrowUnstable === 1 && borrowStable === 0;
  const isVolatilePair = supplyUnstable === 1 && borrowUnstable === 1 && supplyStable === 0 && borrowStable === 0;
  if (isLong) {
    return {
      leveragedType: LeverageType.Long,
      leveragedAsset: longAsset,
    };
  }
  if (isShort) {
    return {
      leveragedType: LeverageType.Short,
      leveragedAsset: shortAsset,
    };
  }
  if (isVolatilePair) {
    return {
      leveragedType: LeverageType.VolatilePair,
      leveragedAsset: longAsset,
    };
  }
  return {
    leveragedType: LeverageType.None,
    leveragedAsset: '',
  };
};

export const aprToApy = (interest:string | number, frequency = BLOCKS_IN_A_YEAR) => new Dec(interest).div(100).div(frequency).plus(1)
  .pow(frequency)
  .minus(1)
  .times(100)
  .toString();
