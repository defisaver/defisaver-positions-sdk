import { EthAddress, NetworkNumber } from './common';

export enum LiquityV2Versions {
  LiquityV2Eth = 'liquityv2eth',
  LiquityV2WstEth = 'liquityv2wsteth',
}

export interface LiquityV2MarketInfo {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: LiquityV2Versions,
  debtToken: string,
  collateralToken: string,
  marketAddress: string,
  protocolName: string,
}

export interface LiquityV2AssetData {
  symbol: string,
  address: string,
  price: string,
  incentiveSupplyApy?: string,
  incentiveSupplyToken?: string,
  totalSupply: string,
  totalBorrow: string,
  canBeSupplied: boolean,
  canBeBorrowed: boolean,
}

export type LiquityV2AssetsData = { [key: string]: LiquityV2AssetData };

export interface InnerLiquityV2MarketData {
  minRatio: string,
}

export interface LiquityV2MarketData {
  assetsData: LiquityV2AssetsData,
  marketData: InnerLiquityV2MarketData,
}

export interface LiquityV2UsedAsset {
  symbol: string,
  address: string,
  price: string,
  supplied: string,
  suppliedUsd: string,
  borrowed: string,
  borrowedUsd: string,
  isSupplied: boolean,
  isBorrowed: boolean,
}

export type LiquityV2UsedAssets = { [key: string]: LiquityV2UsedAsset };

export interface LiquityV2AggregatedTroveData {
  suppliedUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  leftToBorrowUsd: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  leveragedType: string,
  leveragedAsset: string,
  liquidationPrice: string,
}

export interface LiquityV2TroveData {
  usedAssets: LiquityV2UsedAssets,
  troveId: string,
  ratio: string,
  interestRate: string,
  leftToBorrowUsd: string,
  borrowLimitUsd: string,
  suppliedUsd: string,
  borrowedUsd: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  interestBatchManager: EthAddress,
  troveStatus: string,
  leveragedType: string,
  leveragedAsset: string,
  liquidationPrice: string,
}