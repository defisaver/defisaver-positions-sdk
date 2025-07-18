import { EthAddress, HexString } from './common';

export interface IlkInfo {
  ilkLabel: string;
  currentRate: string;
  futureRate: string;
  minDebt: string;
  globalDebtCeiling: string;
  globalDebtCurrent: string;
  assetPrice: string;
  liqRatio: string;
  liqPercent: number;
  stabilityFee: number;
  liquidationFee: string;
  creatableDebt: string;
}

export enum CdpType {
  MCD = 'mcd',
}

export interface CdpInfo {
  id: number,
  ilk: HexString,
  ilkLabel: string,
  urn: HexString,
  asset: string,
  type: CdpType,
  owner: EthAddress,
}

export interface CdpData {
  owner: EthAddress,
  id: string,
  urn: EthAddress,
  type: CdpType,
  ilk: string,
  ilkLabel: string,
  asset: string,
  collateral: string,
  collateralUsd: string,
  futureDebt: string,
  debtDai: string,
  debtUsd: string,
  debtInAsset: string,
  debtAssetPrice: string,
  debtAssetMarketPrice: string,
  liquidationPrice: string,
  ratio: string,
  liqRatio: string,
  liqPercent: number,
  assetPrice: string,
  daiLabel: string,
  debtAsset: string,
  unclaimedCollateral: string,
  debtTooLow: boolean,
  minDebt: string,
  stabilityFee: number,
  creatableDebt: string,
  globalDebtCeiling: string,
  globalDebtCurrent: string,
  liquidationFee: string,
  lastUpdated: number,
}