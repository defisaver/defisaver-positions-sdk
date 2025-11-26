import {
  IncentiveData,
  MMAssetData, MMPositionData, MMUsedAsset, NetworkNumber,
} from './common';

export enum AaveVersions {
  AaveV1 = 'v1',
  AaveV2 = 'v2default',
  AaveV3 = 'v3default',
  AaveV3Lido = 'v3lido',
  AaveV3Etherfi = 'v3etherfi',
}

export enum AaveVersionType {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
}

export type AaveMarketInfo = {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: AaveVersions,
  assets: readonly string[],
  provider: '' | 'LendingPoolAddressesProvider' | 'AaveV3PoolAddressesProvider' | 'AaveV3LidoPoolAddressesProvider' | 'AaveV3EtherfiPoolAddressesProvider',
  providerAddress: `0x${string}`,
  lendingPool: '' | 'AaveLendingPoolV2' | 'AaveV3LendingPool' | 'AaveV3LidoLendingPool' | 'AaveV3EtherfiLendingPool',
  lendingPoolAddress: string,
  protocolData: '' | 'AaveProtocolDataProvider' | 'AaveV3ProtocolDataProvider' | 'AaveV3LidoProtocolDataProvider' | 'AaveV3EtherfiProtocolDataProvider',
  protocolDataAddress: string
  subVersionLabel?: string
  protocolName: string,
  disabled?: boolean,
};

export interface EModeCategoryData {
  label: string,
  id: number,
  liquidationBonus: string,
  liquidationRatio: string,
  collateralFactor: string,
  borrowableBitmap?: string,
  collateralBitmap?: string,
  collateralAssets: string[],
  borrowAssets: string[],
}
export interface EModeCategoryDataMapping {
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
  isFrozen: boolean,
}

export interface AaveV3AssetData extends AaveAssetData {
  isIsolated: boolean,
  isSiloed: boolean,
  debtCeilingForIsolationMode: string,
  isolationModeTotalDebt: string,
  isolationModeBorrowingEnabled: boolean,
  supplyRateP2P?: string,
  borrowRateP2P?: string,
  isFrozen: boolean,
  isPaused: boolean,
  isFlashLoanEnabled: boolean,
  assetId: string | number | null,
  liquidationBonus: string,
  supplyIncentives: IncentiveData[];
  borrowIncentives: IncentiveData[];
}

export type EModeCategoriesData = Record<number, EModeCategoryData>;

export type AaveAssetsData<T> = { [key: string]: T };

export type AaveV2AssetsData = AaveAssetsData<AaveV2AssetData>;

export type AaveV2MarketData = { assetsData: AaveV2AssetsData };

export type AaveV3AssetsData = AaveAssetsData<AaveV3AssetData>;

export type AaveV3MarketData = { assetsData: AaveV3AssetsData, eModeCategoriesData: EModeCategoriesData };

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
  supplyRate: string,
  borrowRate: string,
  interestMode: string,
  collateral: boolean,
}

export type AaveUsedAssets<T> = { [key: string]: T };

export type AaveV2UsedAssets = AaveUsedAssets<AaveV2UsedAsset>;

export type AaveV3UsedAssets = AaveUsedAssets<AaveV3UsedAsset>;

export interface AavePositionData extends MMPositionData {
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
  minCollRatio?: string,
  collLiquidationRatio?: string,
  healthRatio?: string,
  minHealthRatio?: string,
}

export interface AaveHelperCommon {
  usedAssets: any,
  eModeCategory: number,
  eModeCategories?: { [key: number]: EModeCategoryDataMapping },
  eModeCategoriesData?: EModeCategoriesData,
  assetsData: any,
  selectedMarket: Partial<AaveMarketInfo>,
  network?: NetworkNumber,
}
