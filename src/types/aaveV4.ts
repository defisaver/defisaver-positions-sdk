import {
  EthAddress, IncentiveData, LeverageType, NetworkNumber,
} from './common';

export enum AaveV4HubsType {
  AaveV4CoreHub = 'aave_v4_core_hub',
  AaveV4PlusHub = 'aave_v4_plus_hub',
  AaveV4PrimeHub = 'aave_v4_prime_hub',
}

export enum AaveV4SpokesType {
  AaveV4BluechipSpoke = 'aave_v4_bluechip_spoke',
  AaveV4EthenaCorrelatedSpoke = 'aave_v4_ethena_correlated_spoke',
  AaveV4EthenaEcosystemSpoke = 'aave_v4_ethena_ecosystem_spoke',
  AaveV4EtherfiSpoke = 'aave_v4_etherfi_spoke',
  AaveV4ForexSpoke = 'aave_v4_forex_spoke',
  AaveV4GoldSpoke = 'aave_v4_gold_spoke',
  AaveV4KelpSpoke = 'aave_v4_kelp_spoke',
  AaveV4LidoSpoke = 'aave_v4_lido_spoke',
  AaveV4LombardBtcSpoke = 'aave_v4_lombard_btc_spoke',
  AaveV4MainSpoke = 'aave_v4_main_spoke',
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
  liquidity: bigint,
  liquidityFee: number,
  swept: bigint,
  totalDrawn: bigint,
  totalDrawnShares: bigint,
  totalPremiumShares: bigint,
}

export interface AaveV4HubOnChainData {
  assets: Record<number, AaveV4HubAssetOnChainData>,
}

export interface AaveV4SpokeInfo {
  chainIds: NetworkNumber[],
  label: string,
  value: AaveV4SpokesType,
  url: string,
  address: EthAddress,
  hubs: EthAddress[],
}

export interface AaveV4SpokeData {
  assetsData: AaveV4AssetsData,
  oracle: EthAddress,
  oracleDecimals: number,
  address: EthAddress,
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
  spokeHalted: boolean
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
  maxLiquidationBonus: number,
  price: string,
  totalSupplied: string,
  totalDrawn: string,
  totalPremium: string,
  totalDebt: string,
  supplyCap: string,
  borrowCap: string,
  spokeActive: boolean,
  spokeHalted: boolean,
  drawnRate: string,
  supplyRate: string,
  borrowRate: string,
  supplyIncentives: IncentiveData[];
  borrowIncentives: IncentiveData[];
  canBeBorrowed: boolean;
  canBeSupplied: boolean;
  canBeWithdrawn: boolean;
  canBePayBacked: boolean;
  utilization: string;
}

export type AaveV4AssetsData = Record<string, AaveV4ReserveAssetData>;

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
  riskPremiumBps: number,
}
