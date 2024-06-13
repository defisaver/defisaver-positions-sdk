import Dec from 'decimal.js';
import { BLOCKS_IN_A_YEAR } from '../constants';
import { MMUsedAssets } from '../types/common';

export const getAssetsTotal = (assets: object, filter: any, transform: any) => (Object.values(assets) as any)
  .filter(filter)
  .map(transform)
  .reduce((acc: any, data: any) => new Dec(acc).add(data), '0')
  .toString();

export const calcLongLiqPrice = (assetPrice: string, borrowedUsd: string, borrowLimitUsd: string) => new Dec(assetPrice).mul(borrowedUsd).div(borrowLimitUsd).toString();
export const calcShortLiqPrice = (assetPrice: string, borrowedUsd: string, borrowLimitUsd: string) => new Dec(assetPrice).div(borrowedUsd).mul(borrowLimitUsd).toString();

export const calcLeverageLiqPrice = (leverageType: string, assetPrice: string, borrowedUsd: string, borrowLimitUsd: string) => {
  if (leverageType === 'short') return calcShortLiqPrice(assetPrice, borrowedUsd, borrowLimitUsd);
  if (leverageType === 'long' || leverageType === 'lsd-leverage') return calcLongLiqPrice(assetPrice, borrowedUsd, borrowLimitUsd);
  console.error('invalid leverageType', leverageType);
  return '0';
};

export const calculateBorrowingAssetLimit = (assetBorrowedUsd: string, borrowLimitUsd: string) => new Dec(assetBorrowedUsd).div(borrowLimitUsd).times(100).toString();

export const STABLE_ASSETS = ['DAI', 'USDC', 'USDT', 'TUSD', 'USDP', 'GUSD', 'BUSD', 'SUSD', 'FRAX', 'LUSD', 'USDC.e', 'GHO', 'sDAI', 'crvUSD'];

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
  // lsd -> liquid staking derivative
  const isLsdLeveraged = supplyUnstable === 1 && borrowUnstable === 1 && shortAsset === 'ETH' && ['stETH', 'wstETH', 'cbETH', 'rETH'].includes(longAsset);
  if (isLong) {
    return {
      leveragedType: 'long',
      leveragedAsset: longAsset,
    };
  }
  if (isShort) {
    return {
      leveragedType: 'short',
      leveragedAsset: shortAsset,
    };
  }
  if (isLsdLeveraged) {
    return {
      leveragedType: 'lsd-leverage',
      leveragedAsset: longAsset,
    };
  }
  return {
    leveragedType: '',
    leveragedAsset: '',
  };
};

export const aprToApy = (interest:string | number, frequency = BLOCKS_IN_A_YEAR) => new Dec(interest).div(100).div(frequency).plus(1).pow(frequency).minus(1).times(100).toString();
