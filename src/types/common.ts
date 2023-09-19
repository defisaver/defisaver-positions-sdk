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
  marketLiquidity: string,
  utilization: string,
  borrowCap: string,
  totalSupply: string,
  canBeBorrowed: boolean,
  canBeSupplied: boolean,
  totalBorrow: string,
  incentiveBorrowApy?: string,
  incentiveBorrowToken?: string,
  incentiveSupplyApy?: string,
  incentiveSupplyToken?: string,
  borrowRateP2P?: string,
  supplyRateP2P?: string,
}

export interface MMAssetsData {
  [token: string]: MMAssetData,
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
  supplyRate?: string,
  borrowRate?: string,
  discountedBorrowRate?: string,
  stableBorrowRate?: string,
  interestMode?: string,
  collateral?: boolean,
}
export interface MMUsedAssets {
  [token: string]: MMUsedAsset,
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
  lastUpdated: number,
  // ...
}
