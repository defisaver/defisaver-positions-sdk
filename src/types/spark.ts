import { EModeCategoriesData } from './aave';
import {
  EthAddress,
  IncentiveData,
  LeverageType,
  MMAssetData, MMPositionData, MMUsedAsset, NetworkNumber,
} from './common';

export enum SparkVersions {
  SparkV1 = 'v1default',
}

export interface SparkEModeCategoryData {
  label: string,
  liquidationBonus: string,
  liquidationRatio: string,
  collateralFactor: string,
  priceSource: string,
}

export interface SparkEModeCategoryDataMapping {
  enteringTerms: boolean[],
  canEnterCategory: boolean,
  id: number,
  enabledData: {
    ratio: string,
    liqRatio: string,
    liqPercent: string,
    collRatio: string,
  }
}

export interface SparkMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: SparkVersions,
  assets: readonly string[],
  provider: '' | 'SparkPoolAddressesProvider',
  providerAddress: EthAddress,
  lendingPool: 'SparkLendingPool',
  lendingPoolAddress: EthAddress,
  protocolData: '' | 'SparkProtocolDataProvider',
  protocolDataAddress: EthAddress,
  subVersionLabel?: string
  // icon: Function,
  protocolName: string,
  disabled?: boolean,
}

export interface SparkAssetData extends MMAssetData {
  totalBorrowVar: string,
  sortIndex?: number,
  usageAsCollateralEnabled: boolean,
  isIsolated: boolean,
  eModeCategory: number,
  liquidationBonus: string,
  liquidationRatio: string,
}

export interface SparkAssetsData {
  [token: string]: SparkAssetData,
}

export type SparkMarketsData = { assetsData: SparkAssetsData, eModeCategoriesData: EModeCategoriesData };

export interface SparkUsedAsset extends MMUsedAsset {
  stableBorrowRate: string,
  borrowedStable: string,
  borrowedVariable: string,
  borrowedUsdStable: string,
  borrowedUsdVariable: string,
  stableLimit: string,
  variableLimit: string,
  limit: string,
  eModeCategory: number,
}

export interface SparkUsedAssets {
  [token: string]: SparkUsedAsset,
}

export interface SparkHelperCommon {
  usedAssets: SparkUsedAssets,
  eModeCategory: number,
  eModeCategoriesData?: EModeCategoriesData,
  assetsData: SparkAssetsData,
  selectedMarket?: SparkMarketData,
  network?: NetworkNumber,
}

export interface SparkAggregatedPositionData {
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
  leveragedType: LeverageType,
  leveragedAsset?: string,
  currentVolatilePairRatio?: string,
  liquidationPrice?: string,
  minCollRatio: string,
  collLiquidationRatio: string,
  healthRatio: string;
  minHealthRatio: string;
  exposure: string,
}

export interface SparkPositionData extends MMPositionData {
  ratio: string,
  minRatio: string,
  collRatio: string,
  suppliedUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  suppliedCollateralUsd: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  isSubscribedToAutomation?: boolean,
  automationResubscribeRequired?: boolean,
  totalSupplied: string,
  usedAssets: SparkUsedAssets,
  eModeCategory: number,
  isInIsolationMode: boolean,
  isInSiloedMode: boolean,
  eModeCategories: { [key: number]: SparkEModeCategoryDataMapping },
}
