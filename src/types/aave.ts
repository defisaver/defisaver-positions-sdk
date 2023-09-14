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
export interface AaveV3AssetData extends MMAssetData {
  isIsolated: string,
  isSiloed: string,
  nativeAsset: boolean,
  discountData: DiscountData,
  debtCeilingForIsolationMode: string,
  eModeCategory: string,
  isolationModeTotalDebt: string,
  borrowRateDiscounted: string,
  isolationModeBorrowingEnabled: boolean,
  eModeCategoryData: EModeCategoryData,
}
export type AaveV3AssetsData = AaveV3AssetData[];
export type AaveV3MarketData = {
  assetsData: AaveV3AssetsData,
  // TODO figure out if eModeCategories should be here
};
export interface AaveV3UsedAsset extends MMUsedAsset {
  discountedBorrowRate: string,
  eModeCategory: string,
  // ...
}
export interface AaveV3PositionData extends MMPositionData {
  usedAssets: AaveV3UsedAsset[],
  eModeCategory: string,
  isInIsolationMode: string,
  isInSiloedMode: string,
  // ...
}

export interface AaveV3IncentiveData {
  underlyingAsset: string,
  aIncentiveData: IUiIncentiveDataProviderV3.IncentiveDataStructOutput,
  vIncentiveData: IUiIncentiveDataProviderV3.IncentiveDataStructOutput,
  sIncentiveData: IUiIncentiveDataProviderV3.IncentiveDataStructOutput
}
