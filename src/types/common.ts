// General
export type EthAddress = string;
export enum NetworkNumber {
  Eth = 1,
  Opt = 10,
  Arb = 42161,
  Base = 8453,
}
export type Networkish = string | NetworkNumber;

// Common
export interface MMAssetData {
  symbol: string,
  supplyRate: string,
  borrowRate: string,
  price: string,
  collateralFactor: string,
  underlyingTokenAddress: string,
  assetId: string,
  borrowRateStable: string,
  liquidationRatio: string,
  marketLiquidity: string,
  utilization: string,
  usageAsCollateralEnabled: string,
  supplyCap: string,
  borrowCap: string,
  totalSupply: string,
  isInactive: boolean,
  isFrozen: boolean,
  isPaused: boolean,
  canBeBorrowed: boolean,
  canBeSupplied: boolean,
  canBeWithdrawn: boolean,
  canBePayBacked: boolean,
  disabledStableBorrowing: boolean,
  totalBorrow: string,
  totalBorrowVar: string,
  isFlashLoanEnabled: boolean,
  incentiveBorrowApy: string,
  incentiveBorrowToken: string,
  incentiveSupplyApy: string,
  incentiveSupplyToken: string,
}
export interface MMMarketData {
  assetsData: MMAssetData[],
}
export interface MMUsedAsset {
  symbol: string,
  supplied: string,
  suppliedUsd: string,
  isSupplied: boolean,
  borrowed: string,
  borrowedUsd: string,
  isBorrowed: boolean,
  debt: string,
}
export interface MMUsedAssetWStableB extends MMUsedAsset {
  stableBorrowRate: string,
  borrowedStable: string,
  borrowedVariable: string,
  borrowedUsdStable: string,
  borrowedUsdVariable: string,
  interestMode: string,
}
export interface MMPositionData {
  usedAssets: any,
  netApy: string,
  totalSupplied: string,
  lastUpdated: number,
  // ...
}
