import { MMUsedAssets, NetworkNumber } from './common';

export enum MorphoBlueVersions {
  MorphoBlueWstEthEth = 'morphobluewstetheth',
}

export interface MorphoBlueMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: MorphoBlueVersions,
  loanToken: string,
  collateralToken: string,
  oracle: string,
  irm: string,
  lltv: number | string,
  // icon: Function,
  protocolName: string,
}

export interface MorphoBlueAssetData {
  symbol: string,
  address: string,
  price: string,
  supplyRate: string,
  borrowRate: string,
  incentiveSupplyApy?: string,
  incentiveSupplyToken?: string,
  totalSupply?: string,
  totalBorrow?: string,
}

export type MorphoBlueAssetsData = { [key: string]: MorphoBlueAssetData };

export interface MorphoBlueMarketInfo {
  id: string,
  fee: string,
  loanToken: string,
  collateralToken: string,
  utillization: string,
  oracle: string,
  lltv: string,
  assetsData: MorphoBlueAssetsData,
}

export interface MorphoBlueAggregatedPositionData {
  suppliedUsd: string,
  suppliedCollateralUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  leftToBorrowUsd: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  ltv: string,
  leveragedType: string,
  leveragedAsset?: string,
  leveragedLsdAssetRatio?: string,
  liquidationPrice?: string,
}

export interface MorphoBluePositionData {
  usedAssets: MMUsedAssets,
  suppliedUsd: string,
  suppliedCollateralUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  leftToBorrowUsd: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  ltv: string,
  leveragedType: string,
  leveragedAsset?: string,
  leveragedLsdAssetRatio?: string,
  liquidationPrice?: string,
}