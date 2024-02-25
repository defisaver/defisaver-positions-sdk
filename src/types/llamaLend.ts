import { AssetDataBase } from '@defisaver/tokens';
import { EthAddress, NetworkNumber } from './common';
import { BandData, UserBandData } from './curveUsd';

export enum LlamaLendVersions {
  'LlamaLendwstETHcrvUSD' = 'llamaLendwstETHcrvUSD',
  'LlamaLendCRVcrvUSD' = 'llamaLendCRVcrvUSD',
  'LlamaLendcrvUSDCRV' = 'llamaLendcrvUSDCRV',
}

export enum LlamaLendStatus {
  Nonexistant = 'Nonexistant',
  Safe = 'Safe',
  Risk = 'Risk',
  SoftLiquidating = 'SoftLiquidating',
  SoftLiquidated = 'SoftLiquidated',
}

export interface LlamaLendMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  value: LlamaLendVersions,
  collAsset: string,
  baseAsset: string,
  controllerAddress: string,
  vaultAddress: EthAddress,
  url: string,
}
export interface LlamaLendAssetData {
  symbol: string,
  address: string,
  price: string,
  supplyRate: string,
  borrowRate: string,
  totalSupply?: string,
  totalBorrow?: string,
  canBeSupplied?: boolean,
  canBeBorrowed?: boolean,
  shares?: string,
}

export type LlamaLendAssetsData = { [key: string]: LlamaLendAssetData };

export interface LlamaLendGlobalMarketData {
  collateral: string,
  decimals: string,
  activeBand: string,
  totalDebt: string,
  ammPrice: string,
  basePrice: string,
  oraclePrice: string,
  minted: string,
  redeemed: string,
  monetaryPolicyRate: string,
  ammRate: string,
  minBand: string,
  maxBand: string,
  debtCeiling: string,
  borrowRate: string,
  futureBorrowRate: string,
  leftToBorrow: string,
  bands: BandData[],
  assetsData: LlamaLendAssetsData,
}

export interface LlamaLendAggregatedPositionData {
  ratio: string,
  supplied: string,
  suppliedUsd: string,
  borrowedUsd: string,
  borrowed: string,
  safetyRatio: string,
  borrowLimitUsd: string,
  minAllowedRatio: number,
  collFactor: string,
  leveragedType: string,
  leveragedAsset?: string,
  liquidationPrice?: string,
}

export interface LlamaLendUsedAsset {
  isSupplied: boolean,
  supplied: string,
  suppliedUsd: string,
  borrowed: string,
  borrowedUsd: string,
  isBorrowed: boolean,
  symbol: string,
  collateral: boolean,
  price: string,
  interestRate?: string,
  suppliedForYield?: string,
  suppliedForYieldUsd?: string,
  shares?: string,
}

export interface LlamaLendUsedAssets {
  [key: string]: LlamaLendUsedAsset,
}

export interface LlamaLendUserData {
  debtAmount: string,
  health: string,
  healthPercent: string,
  priceHigh: string,
  priceLow: string,
  liquidationDiscount: string,
  numOfBands: string,
  usedAssets: LlamaLendUsedAssets,
  status: LlamaLendStatus,
  ratio: string,
  supplied: string,
  suppliedUsd: string,
  borrowedUsd: string,
  borrowed: string,
  safetyRatio: string,
  userBands: UserBandData[],
}