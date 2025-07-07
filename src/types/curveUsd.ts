import { EthAddress, NetworkNumber } from './common';

export enum CrvUSDVersions {
  'crvUSDwstETH' = 'wstETH',
  'crvUSDWBTC' = 'WBTC',
  'crvUSDETH' = 'ETH',
  'crvUSDtBTC' = 'tBTC',
  'crvUSDsfrxETH' = 'sfrxETH',
}

export enum CrvUSDStatus {
  Nonexistant = 'Nonexistant',
  Safe = 'Safe',
  Risk = 'Risk',
  SoftLiquidating = 'SoftLiquidating',
  SoftLiquidated = 'SoftLiquidated',
}

export interface CrvUSDMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  value: CrvUSDVersions,
  collAsset: string,
  baseAsset: string,
  controllerAddress: EthAddress,
  ammAddress: EthAddress,
  createCollAssets: string[],
}

export interface BandData {
  id: string,
  collAmount: string,
  debtAmount: string,
  lowPrice: string,
  highPrice: string,
}

export interface UserBandData {
  id: string,
  collAmount: string,
  debtAmount: string,
  lowPrice: string,
  highPrice: string,
  userDebtAmount: string,
  userCollAmount: string,
}

export interface CrvUSDGlobalMarketData {
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
  loanDiscount: string;
}

export interface CrvUSDAggregatedPositionData {
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

export interface CrvUSDUsedAsset {
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
}

export interface CrvUSDUsedAssets {
  [key: string]: CrvUSDUsedAsset,
}

export interface CrvUSDUserData {
  debtAmount: string,
  health: string,
  healthPercent: string,
  priceHigh: string,
  priceLow: string,
  liquidationDiscount: string,
  numOfBands: string,
  usedAssets: CrvUSDUsedAssets,
  status: CrvUSDStatus,
  ratio: string,
  supplied: string,
  suppliedUsd: string,
  borrowedUsd: string,
  borrowed: string,
  safetyRatio: string,
  userBands: UserBandData[],
}