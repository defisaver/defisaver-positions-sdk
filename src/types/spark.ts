import { MMAssetData, NetworkNumber } from './common';

export enum SparkVersions {
  SparkV1 = 'v1default',
}

export interface SparkMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: SparkVersions,
  assets: readonly string[],
  provider: '' | 'SparkPoolAddressesProvider',
  providerAddress: string,
  lendingPool: '' | 'SparkLendingPool',
  lendingPoolAddress: string,
  protocolData: '' | 'SparkProtocolDataProvider',
  protocolDataAddress: string
  subVersionLabel?: string
  // icon: Function,
  protocolName: string,
  disabled?: boolean,
}

export interface SparkAssetData extends MMAssetData {
  totalBorrowVar: string,
  sortIndex?: number,
}

export interface SparkAssetsData {
  [token: string]: SparkAssetData,
}

export type SparkMarketsData = { assetsData: SparkAssetsData };