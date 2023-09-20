import { NetworkNumber } from './common';

export enum CrvUSDVersions {
  'wstETH' = 'wstETH',
  'WBTC' = 'WBTC',
  'ETH' = 'ETH',
}


export interface CrvUSDMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  value: CrvUSDVersions,
  collAsset: string,
  baseAsset: string,
  controllerAddress: string,
  ammAddress: string,
  createCollAssets: string[],
}

export interface BandData {
  id: number,
  collAmount: string,
  debtAmount: string,
  lowPrice: string,
  highPrice: string,
}

export interface CrvUSDGlobalMarketData {
  collateral: string,
  decimals: number,
  activeBand: number,
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
}