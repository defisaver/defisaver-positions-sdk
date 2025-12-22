import { EthAddress, NetworkNumber } from './common';

export enum AaveV4SpokesType {
  AaveV4CoreSpoke = 'aave_v4_core_spoke',
}

export enum AaveV4HubsType {
  AaveV4CoreHub = 'aave_v4_core_hub',
}

export interface AaveV4SpokeInfo {
  chainIds: NetworkNumber[],
  label: string,
  value: AaveV4SpokesType,
  url: string,
  address: EthAddress,
  hubs: EthAddress[],
}

export interface AaveV4HubAssetOnChainData {
  assetId: number,
  drawnRate: bigint,
}

export interface AaveV4HubOnChainData {
  assets: Record<number, AaveV4HubAssetOnChainData>,
}

export interface AaveV4ReserveAssetOnChain {
  underlying: EthAddress,
  hub: EthAddress,
  assetId: number,
  decimals: number,
  paused: boolean,
  frozen: boolean,
  borrowable: boolean,
  collateralRisk: number,
  collateralFactor: number,
  maxLiquidationBonus: number,
  liquidationFee: number,
  price: bigint,
  totalSupplied: bigint,
  totalDrawn: bigint,
  totalPremium: bigint,
  totalDebt: bigint,
  supplyCap: bigint,
  borrowCap: bigint,
  deficitRay: bigint,
  spokeActive: boolean,
  spokePaused: boolean
}

export interface AaveV4ReserveAssetData {
  symbol: string,
  underlying: EthAddress,
  hub: EthAddress,
  assetId: number,
  paused: boolean,
  frozen: boolean,
  borrowable: boolean,
  collateralRisk: number,
  collateralFactor: number,
  liquidationFee: number,
  price: string,
  totalSupplied: string,
  totalDrawn: string,
  totalPremium: string,
  totalDebt: string,
  supplyCap: string,
  borrowCap: string,
  spokeActive: boolean,
  spokePaused: boolean,
  drawnRate: string,
}

export interface AaveV4SpokeData {
  assetsData: Record<string, AaveV4ReserveAssetData>,
  oracle: EthAddress,
  oracleDecimals: number,
  address: EthAddress,
}
