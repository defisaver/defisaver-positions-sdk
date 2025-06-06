import {
  MMAssetData, MMPositionData, MMUsedAsset, NetworkNumber,
} from './common';

export enum CompoundVersions {
  'CompoundV2' = 'v2',
  'CompoundV3USDC' = 'v3-USDC',
  'CompoundV3USDCe' = 'v3-USDC.e',
  'CompoundV3ETH' = 'v3-ETH',
  'CompoundV3USDbC' = 'v3-USDbC',
  'CompoundV3USDT' = 'v3-USDT',
  'CompoundV3USDS' = 'v3-USDS',
  'CompoundV3wstETH' = 'v3-wstETH',
}

export interface CompoundBulkerOptions {
  supply: number | string,
  withdraw: number | string,
}

export interface CompoundMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  value: CompoundVersions,
  baseAsset: string,
  collAssets: readonly string[],
  baseMarket: string,
  baseMarketAddress: string,
  secondLabel: string,
  bulkerName: string,
  bulkerAddress: string,
  bulkerOptions: CompoundBulkerOptions,
  // icon: Function,
}

export interface CompoundUsedAsset extends MMUsedAsset {
  collateral: boolean,
  limit?: string,
}

export interface CompoundV2UsedAsset extends CompoundUsedAsset {
}
export interface CompoundV3UsedAsset extends CompoundUsedAsset {
}

export interface CompoundUsedAssets<T> {
  [token: string]: T,
}

export type CompoundV2UsedAssets = CompoundUsedAssets<CompoundV2UsedAsset>;
export type CompoundV3UsedAssets = CompoundUsedAssets<CompoundV3UsedAsset>;

export interface CompoundAssetData extends MMAssetData {
  supplyCapAlternative?: string,
  totalSupplyAlternative?: string,
  priceAlternative?: string,
  sortIndex?: number,
}

export interface CompoundV2AssetData extends CompoundAssetData {
}
export interface CompoundV3AssetData extends CompoundAssetData {
  borrowCollateralFactor: string,
  liquidateCollateralFactor: string,
  minDebt: string,
  liquidationRatio: string,
  supplyCap: string,
  priceInBaseAsset: string,
}

export interface CompoundAssetsData<T> {
  [token: string]: T
}
export type CompoundV2AssetsData = CompoundAssetsData<CompoundV2AssetData>;
export type CompoundV3AssetsData = CompoundAssetsData<CompoundV3AssetData>;

export type CompoundMarketsData<T> = { assetsData: T };
export type CompoundV2MarketsData = CompoundMarketsData<CompoundV2AssetsData>;
export type CompoundV3MarketsData = CompoundMarketsData<CompoundV3AssetsData>;

export interface BaseAdditionalAssetData {
  totalBorrow: string,
  utilization: string,
  marketLiquidity: string,
  rewardSupplySpeed: string,
  rewardBorrowSpeed: string,
  minDebt: string,
  isBase: boolean,
}

export interface CompoundAggregatedPositionData {
  suppliedUsd: string,
  suppliedCollateralUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  leftToBorrowUsd: string,
  ratio: string,
  collRatio: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  liqRatio: string,
  liqPercent: string,
  leveragedType: string,
  leveragedAsset?: string,
  leveragedLsdAssetRatio?: string,
  liquidationPrice?: string,
  minRatio: string,
  debtTooLow: boolean,
  minDebt: string,
  minCollRatio: string,
  collLiquidationRatio: string,
}

export interface CompoundPositionData extends MMPositionData {
  ratio: string,
  minRatio: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  isSubscribedToAutomation?: boolean,
  automationResubscribeRequired?: boolean,
}

export interface CompoundV2PositionData extends CompoundPositionData {
  usedAssets: CompoundV2UsedAssets,
}

export interface CompoundV3PositionData extends CompoundPositionData {
  usedAssets: CompoundV3UsedAssets,
}