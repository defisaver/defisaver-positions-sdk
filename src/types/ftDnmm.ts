import { NetworkNumber } from './common';

export enum FtDnmmVersions {
  FtDnmm = 'ftDnmm',
}

export interface FtDnmmMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: FtDnmmVersions,
  assets: string[],
  protocolName: string,
}

export interface FtDnmmAssetData {
  symbol: string,
  address: string,
  price: string,
  mmBps: number,
  usageAsCollateralEnabled: boolean,
  canBeBorrowed: boolean,
  canBeSupplied: boolean,
  enabled: boolean,
  supplyIncentives: string[],
  borrowIncentives: string[],
}

export interface FtDnmmAssetsData {
  [key: string]: FtDnmmAssetData,
}

export interface FtDnmmMarketInfo {
  assetsData: FtDnmmAssetsData,
}

export interface FtDnmmUsedAsset {
  symbol: string,
  supplied: string,
  suppliedUsd: string,
  collateral: string,
  collateralUsd: string,
  isSupplied: boolean,
  borrowed: string,
  borrowedUsd: string,
  isBorrowed: boolean,
}

export interface FtDnmmUsedAssets {
  [key: string]: FtDnmmUsedAsset,
}

export interface FtDnmmPositionData {
  usedAssets: FtDnmmUsedAssets,
  suppliedUsd: string,
  borrowedUsd: string,
  // account-wide values from FtDnmmView.getAccountData, all plain USD
  ratio: string, // health factor as a percentage string (e.g. '180' = 1.8)
  equityUsd: string,
  maintUsd: string,
  collUsd: string,
  debtUsd: string,
  enginePnlUsd: string,
  hfTargetBps: number,
  hfSafeBps: number,
  minEquityUsd: string,
  isSubscribedToAutomation: boolean,
  lastUpdated: number,
}
