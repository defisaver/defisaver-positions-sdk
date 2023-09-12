import {
  MMAssetData, MMPositionData, MMUsedAsset, NetworkNumber,
} from './common';

export enum AaveVersions {
  AaveV1 = 'v1',
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
export type AaveV3AssetData = MMAssetData & {
  isIsolated: string,
  isSiloed: string,
  // ...
};
export type AaveV3AssetsData = AaveV3AssetData[];
export type AaveV3MarketData = {
  assetsData: AaveV3AssetsData,
  // TODO figure out if eModeCategories should be here
};
export type AaveV3UsedAsset = MMUsedAsset & {
  discountedBorrowRate: string,
  eModeCategory: string,
  // ...
};
export type AaveV3PositionData = MMPositionData & {
  usedAssets: AaveV3UsedAsset[],
  eModeCategory: string,
  isInIsolationMode: string,
  isInSiloedMode: string,
  // ...
};
