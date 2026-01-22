import {
  EthAddress, IncentiveData, LeverageType, NetworkNumber,
} from './common';

export enum LiquityV2Versions {
  LiquityV2Eth = 'liquityv2eth',
  LiquityV2WstEth = 'liquityv2wsteth',
  LiquityV2REth = 'liquityv2reth',
  // Legacy
  LiquityV2EthLegacy = 'liquityv2ethlegacy',
  LiquityV2WstEthLegacy = 'liquityv2wstethlegacy',
  LiquityV2REthLegacy = 'liquityv2rethlegacy',
}

export enum LIQUITY_V2_TROVE_STATUS_ENUM {
  nonExistent,
  active,
  closedByOwner,
  closedByLiquidation,
  zombie,
}

export const LIQUITY_V2_STATUS_MAPPING = {
  nonExistent: 'Non existent',
  active: 'Active',
  closedByOwner: 'Closed',
  closedByLiquidation: 'Liquidated',
  zombie: 'Zombie',
};

export interface LiquityV2MarketInfo {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: LiquityV2Versions,
  debtToken: string,
  collateralToken: string,
  marketAddress: EthAddress,
  protocolName: string,
  isLegacy: boolean,
}

export interface LiquityV2AssetData {
  symbol: string,
  address: string,
  price: string,
  totalSupply: string,
  totalBorrow: string,
  canBeSupplied: boolean,
  canBeBorrowed: boolean,
  leftToBorrowGlobal: string,
  leftToWithdrawGlobal: string,
  supplyIncentives: IncentiveData[],
  borrowIncentives: IncentiveData[],
}

export type LiquityV2AssetsData = { [key: string]: LiquityV2AssetData };

export interface InnerLiquityV2MarketData {
  minCollRatio: string,
  totalCollRatio: string,
  criticalCollRatio: string,
  batchCollRatio: string,
  isUnderCollateralized: boolean,
  hintHelperAddress: EthAddress,
  troveNFTAddress: EthAddress,
  borrowerOperationsAddress: EthAddress,
  troveManagerAddress: EthAddress,
  stabilityPoolAddress: EthAddress,
  collSurplusPoolAddress: EthAddress,
  activePoolAddress: EthAddress,
}

export interface LiquityV2MarketData {
  assetsData: LiquityV2AssetsData,
  marketData: InnerLiquityV2MarketData,
}

export interface LiquityV2UsedAsset {
  symbol: string,
  collateral?: boolean,
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
  leveragedType: LeverageType,
  leveragedAsset: string,
  liquidationPrice: string,
  ratio: string,
  collRatio: string,
}

export interface LiquityV2TroveData {
  usedAssets: LiquityV2UsedAssets,
  troveId: string,
  ratio: string,
  collRatio: string,
  liqRatio: string,
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
  leveragedType: LeverageType,
  leveragedAsset: string,
  liquidationPrice: string,
  debtInFront: string,
  lastInterestRateAdjTime: string,
}