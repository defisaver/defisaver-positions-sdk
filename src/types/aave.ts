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

export interface AaveAssetData extends MMAssetData {
  sortIndex?: number,
  isIsolated?: boolean,
  usageAsCollateralEnabled: boolean,
  isInactive: boolean,
  canBeWithdrawn: boolean,
  canBePayBacked: boolean,
  liquidationRatio: string,
  supplyCap: string,
  disabledStableBorrowing: boolean,
  borrowRateStable: string,
  totalBorrowVar: string,
}


export interface AaveV2AssetData extends AaveAssetData {
  priceInEth: string,
}

export interface AaveV3AssetData extends AaveAssetData {
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
  supplyRateP2P?: string,
  borrowRateP2P?: string,
  isFrozen: boolean,
  isPaused: boolean,
  isFlashLoanEnabled: boolean,
  assetId: string,
}

export type AaveAssetsData<T> = { [key: string]: T };

export type AaveV2AssetsData = AaveAssetsData<AaveV2AssetData>;

export type AaveV2MarketData = { assetsData: AaveV2AssetsData };

export type AaveV3AssetsData = AaveAssetsData<AaveV3AssetData>;

export type AaveV3MarketData = { assetsData: AaveV3AssetsData };

export interface AaveUsedAsset extends MMUsedAsset {
  stableBorrowRate: string,
  borrowedStable: string,
  borrowedVariable: string,
  borrowedUsdStable: string,
  borrowedUsdVariable: string,
  stableLimit: string,
  variableLimit: string,
  limit: string,
}

export interface AaveV2UsedAsset extends AaveUsedAsset {
}
export interface AaveV3UsedAsset extends AaveUsedAsset {
  discountedBorrowRate: string,
  eModeCategory: number,
  supplyRate: string,
  borrowRate: string,
  interestMode: string,
  collateral: boolean,
  // ...
}

export type AaveUsedAssets<T> = { [key: string]: T };

export type AaveV2UsedAssets = AaveUsedAssets<AaveV2UsedAsset>;

export type AaveV3UsedAssets = AaveUsedAssets<AaveV3UsedAsset>;

export interface AavePositionData extends MMPositionData {
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
}

export interface AaveV2PositionData extends AavePositionData {
  usedAssets: AaveV2UsedAssets,
}

export interface AaveV3PositionData extends AavePositionData {
  usedAssets: AaveV3UsedAssets,
  eModeCategory: number,
  isInIsolationMode: boolean,
  isInSiloedMode: boolean,
  eModeCategories: { [key: number]: EModeCategoryDataMapping },
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
  usedAssets: any,
  eModeCategory: number,
  eModeCategories?: number[],
  assetsData: any,
  selectedMarket: AaveMarketInfo,
  network?: NetworkNumber,
}
