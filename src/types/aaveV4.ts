import {
  EthAddress, IncentiveData, LeverageType, NetworkNumber,
} from './common';

export enum AaveV4SpokesType {
  AaveV4CoreSpoke = 'aave_v4_core_spoke',
  AaveV4YieldSeekingSpoke = 'aave_v4_yield_seeking_spoke',
}

export enum AaveV4HubsType {
  AaveV4CoreHub = 'aave_v4_core_hub',
  AaveV4YieldSeekingHub = 'aave_v4_yield_seeking_hub',
}

export interface AaveV4SpokeInfo {
  chainIds: NetworkNumber[],
  label: string,
  value: AaveV4SpokesType,
  url: string,
  address: EthAddress,
  hubs: EthAddress[],
}

export interface AaveV4HubInfo {
  chainIds: NetworkNumber[],
  label: string,
  value: AaveV4HubsType,
  address: EthAddress,
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
  hubName: string,
  assetId: number,
  reserveId: number,
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
  supplyRate: string,
  supplyIncentives: IncentiveData[];
  borrowIncentives: IncentiveData[];
  canBeBorrowed: boolean;
  canBeSupplied: boolean;
  canBeWithdrawn: boolean;
  canBePayBacked: boolean;
  utilization: string;
}

export type AaveV4AssetsData = Record<string, AaveV4ReserveAssetData>;

export interface AaveV4SpokeData {
  assetsData: AaveV4AssetsData,
  oracle: EthAddress,
  oracleDecimals: number,
  address: EthAddress,
}

export interface AaveV4UsedReserveAsset {
  symbol: string,
  hubName: string,
  assetId: number,
  reserveId: number,
  supplied: string,
  suppliedUsd: string,
  drawn: string,
  drawnUsd: string,
  premium: string,
  premiumUsd: string,
  borrowed: string,
  borrowedUsd: string,
  isSupplied: boolean,
  isBorrowed: boolean,
  collateral: boolean,
  collateralFactor: number,
}

export interface AaveV4AggregatedPositionData {
  suppliedUsd: string,
  suppliedCollateralUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  borrowedUsd: string,
  drawnUsd: string,
  premiumUsd: string,
  leftToBorrowUsd: string,
  ratio: string,
  collRatio: string,
  liqRatio: string,
  liqPercent: string,
  leveragedType: LeverageType,
  leveragedAsset: string,
  liquidationPrice: string,
  minCollRatio: string,
  collLiquidationRatio: string,
  minHealthRatio: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  currentVolatilePairRatio?: string,
}

export type AaveV4UsedReserveAssets = Record<string, AaveV4UsedReserveAsset>;

export interface AaveV4AccountData extends AaveV4AggregatedPositionData {
  usedAssets: AaveV4UsedReserveAssets,
  healthFactor: string,
}
