import {
  MMAssetData, MMPositionData, MMUsedAsset, NetworkNumber,
} from './common';

import { IUiIncentiveDataProviderV3 } from './contracts/generated/AaveUiIncentiveDataProviderV3';

export enum AaveVersions {
  AaveV2 = 'v2default',
  AaveV3 = 'v3default',
  MorphoAaveV2 = 'morphoAaveV2',
  MorphoAaveV3Eth = 'morphoAaveV3Eth',
}
export type AaveMarketInfo = {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: AaveVersions,
  assets: readonly string[],
  provider: '' | 'LendingPoolAddressesProvider' | 'AaveV3PoolAddressesProvider',
  providerAddress: string,
  lendingPool: '' | 'AaveLendingPoolV2' | 'AaveV3LendingPool' | 'MorphoAaveV3ProxyEthMarket',
  lendingPoolAddress: string,
  protocolData: '' | 'AaveProtocolDataProvider' | 'AaveV3ProtocolDataProvider',
  protocolDataAddress: string
  subVersionLabel?: string
  protocolName: string,
  disabled?: boolean,
};

export interface DiscountData {
  ghoDiscountedPerDiscountToken: string,
  discountRate: string,
  minDiscountTokenBalance: string,
  minGhoBalanceForDiscount: string,
}

export interface EModeCategoryData {
  label: string,
  liquidationBonus: string,
  liquidationRatio: string,
  collateralFactor: string,
  priceSource: string,
}
export interface EModeCategoryDataMapping {
  enteringTerms: boolean[],
  canEnterCategory: boolean,
  id: number,
  data: EModeCategoryData,
  assets: string[],
  enabledData: {
    ratio: string,
    liqRatio: string,
    liqPercent: string,
    collRatio: string,
  }
}
export interface AaveV3AssetData extends MMAssetData {
  isIsolated: boolean,
  isSiloed: boolean,
  nativeAsset: boolean,
  discountData: DiscountData,
  debtCeilingForIsolationMode: string,
  eModeCategory: number,
  isolationModeTotalDebt: string,
  borrowRateDiscounted: string,
  isolationModeBorrowingEnabled: boolean,
  eModeCategoryData: EModeCategoryData,
  sortIndex: number,
  supplyRateP2P?: string,
  borrowRateP2P?: string,
}
export type AaveV3AssetsData = { [key: string]: AaveV3AssetData };
export type AaveV3MarketData = { assetsData: AaveV3AssetsData };
export interface AaveV3UsedAsset extends MMUsedAsset {
  discountedBorrowRate: string,
  eModeCategory: number,
  supplyRate: string,
  borrowRate: string,
  interestMode: string,
  stableBorrowRate: string,
  stableLimit: string,
  variableLimit: string,
  limit: string,
  borrowedUsdStable: string,
  borrowedUsdVariable: string,
  collateral: boolean,
  // ...
}
export interface AaveV3UsedAssets {
  [key: string]: AaveV3UsedAsset,
}
export interface AaveV3PositionData extends MMPositionData {
  usedAssets: AaveV3UsedAssets,
  eModeCategory: number,
  isInIsolationMode: boolean,
  isInSiloedMode: boolean,
  eModeCategories: { [key: number]: EModeCategoryDataMapping },
  ratio: string,
  minRatio: string,
  collRatio: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  suppliedCollateralUsd: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  isSubscribedToAutomation?: boolean,
  automationResubscribeRequired?: boolean,
  // ...
}

export interface AaveV3IncentiveData {
  underlyingAsset: string,
  aIncentiveData: IUiIncentiveDataProviderV3.IncentiveDataStructOutput,
  vIncentiveData: IUiIncentiveDataProviderV3.IncentiveDataStructOutput,
  sIncentiveData: IUiIncentiveDataProviderV3.IncentiveDataStructOutput
}

export interface AaveV3AggregatedPositionData {
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
}

export interface AaveHelperCommon {
  usedAssets: AaveV3UsedAssets,
  eModeCategory: number,
  eModeCategories: number[],
  assetsData: AaveV3AssetsData,
  selectedMarket: AaveMarketInfo,
  network: NetworkNumber,
}
