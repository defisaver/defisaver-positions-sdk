export enum IncentiveKind {
  Staking = 'staking',
  Reward = 'reward',
}

export enum IncentiveEligibilityId {
  AaveV3EthenaLiquidLeverage = '0x8772bb231f3af13ead41d7ecf6abd60f5f716ec8BORROW_BL',
}

export interface IncentiveData {
  token: string,
  apy: string,
  incentiveKind?: IncentiveKind;
  description?: string;
  eligibilityId?: IncentiveEligibilityId;
}

// General
export type EthAddress = HexString;
export type Blockish = number | 'latest';
export type AssetSymbol = string;
export type Amount = string | number;

export enum NetworkNumber {
  Eth = 1,
  Opt = 10,
  Arb = 42161,
  Base = 8453,
  Linea = 59144,
}
export type Networkish = string | NetworkNumber;

// Common
export interface MMAssetData {
  symbol: string,
  supplyRate: string,
  borrowRate: string,
  price: string,
  collateralFactor: string,
  underlyingTokenAddress: string,
  marketLiquidity: string,
  utilization: string,
  borrowCap: string,
  totalSupply: string,
  canBeBorrowed: boolean,
  canBeSupplied: boolean,
  totalBorrow: string,
  borrowRateP2P?: string,
  supplyRateP2P?: string,
  supplyIncentives: IncentiveData[];
  borrowIncentives: IncentiveData[];
}

export interface MMAssetsData {
  [token: string]: MMAssetData,
}
export interface MMMarketData {
  assetsData: MMAssetData[],
}
export interface MMUsedAsset {
  symbol: string,
  supplied: string,
  suppliedUsd: string,
  isSupplied: boolean,
  borrowed: string,
  borrowedUsd: string,
  isBorrowed: boolean,
  stableBorrowRate?: string,
  debt?: string,
  supplyRate?: string,
  borrowRate?: string,
  interestMode?: string,
  collateral?: boolean,
}
export interface MMUsedAssets {
  [token: string]: MMUsedAsset,
}
export interface MMUsedAssetWStableB extends MMUsedAsset {
  stableBorrowRate: string,
  borrowedStable: string,
  borrowedVariable: string,
  borrowedUsdStable: string,
  borrowedUsdVariable: string,
  interestMode: string,
}
export interface MMPositionData {
  usedAssets: any,
  netApy: string,
  lastUpdated: number,
  // ...
}

export type Balances = Record<AssetSymbol, Amount>;
export interface PositionBalances {
  collateral?: Balances,
  debt?: Balances,
  selling?: Balances,
  deposited?: Balances,
}

export type EthereumProvider = { request(...args: any): Promise<any> }; // TODO

export type HexString = `0x${string}`;
