import {
  MMAssetData, MMPositionData, MMUsedAsset, NetworkNumber,
} from './common';

export enum CompoundVersions {
  'CompoundV2' = 'v2',
  'CompoundV3USDC' = 'v3-USDC',
  'CompoundV3ETH' = 'v3-ETH',
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
  bulkerOptions: { supply: string | number, withdraw: string | number },
  // icon: Function,
}

export interface CompoundV3UsedAsset extends MMUsedAsset {
  collateral: boolean,
  limit?: string,
}

export interface CompoundV3UsedAssets {
  [token: string]: CompoundV3UsedAsset,
}

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

export interface CompoundV3AggregatedPositionData {
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
}