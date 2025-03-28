import {
  MMPositionData, NetworkNumber,
} from './common';

export enum EulerV2Versions {
  eUSDC2 = 'eUSDC-2',
  eWETH2 = 'eWETH-2',
}

export enum EulerV2VaultType {
  Escrow = 'Escrow',
  Governed = 'Governed',
  Ungoverned = 'Ungoverned',
}

export interface EulerV2Market {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  asset: string,
  value: EulerV2Versions,
  secondLabel: string,
  marketAddress: string,
  // icon: Function,
}

export interface EulerV2PositionData extends MMPositionData {
  ratio: string,
  minRatio: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  isSubscribedToAutomation?: boolean,
  automationResubscribeRequired?: boolean,
}

export interface EulerV2AssetData {
  vaultAddress: string,
  vaultSymbol: string
  sortIndex?: number
  liquidationRatio: string
  cash: string
  supplyCap: string
  assetAddress: string
  decimals: string
  symbol: string
  price: string
  borrowCap: string
  canBeBorrowed: boolean
  canBeSupplied: boolean
  incentiveSupplyApy?: string
  incentiveSupplyToken?: string
  totalBorrow: string
  collateralFactor: string
  borrowRate: string
  supplyRate: string
  utilization: string
  governorAdmin: string
  vaultType: EulerV2VaultType
}

export interface EulerV2UsedAsset {
  isSupplied: boolean
  isBorrowed: boolean
  supplied: string
  suppliedUsd: string
  borrowed: string
  borrowedUsd: string
  symbol: string
  collateral: boolean
  vaultAddress: string
}

export interface EulerV2MarketInfoData {
  name: string,
  symbol: string,
  decimals: string,
  vaultAddress: string,
  irm: string,
  creator: string,
  governorAdmin: string,
  unitOfAccount: string,
  unitOfAccountUsdPrice: string,
  isInUSD: boolean,
  oracle: string,
  collaterals: string[],
  isEscrow: boolean,
  isGoverned: boolean,
  vaultType: EulerV2VaultType,
}

export type EulerV2AssetsData = { [key: string]: EulerV2AssetData };
export type EulerV2UsedAssets = { [key: string]: EulerV2UsedAsset };


export interface EulerV2CollateralInfo {
  lltv: string
  borrowLtv: string
  totalBorrows: string
  cash: string
  supplyCap: string
}

export interface EulerV2MarketData {
  name: string
  symbol: string
  decimals: number

  totalSupplyShares: string
  cash: string
  totalBorrows: string
  totalAssets: string
  supplyCap: string
  borrowCap: string

  collaterals: string[]

  badDebtSocializationEnabled: boolean

  unitOfAccount: string
  oracle: string
  assetPrice: string

  interestRate: string
  irm: string

  creator: string

  governorAdmin: string

  interestFee: string
}

export interface EulerV2FullMarketData {
  marketData: EulerV2MarketInfoData
  assetsData: EulerV2AssetsData
}

export interface EulerV2AccountData {
  owner: string
  inLockDownMode: boolean
  inPermitDisabledMode: boolean

  borrowVault: string
  borrowAmountInUnit: string

  collaterals: string[] // all collaterals user has enabled on main evc contract (globally - not only collaterals for his borrow market)
  collateralAmountsInUnit: string[] // only amounts used as collateral for his debt (empty array if no debt)
}

export interface EulerV2AggregatedPositionData {
  suppliedUsd: string,
  suppliedCollateralUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  leftToBorrowUsd: string,
  ratio: string,
  collRatio: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  liqRatio: string,
  liqPercent: string,
  leveragedType: string,
  leveragedAsset?: string,
  leveragedLsdAssetRatio?: string,
  liquidationPrice?: string,
  minRatio: string,
  minDebt: string,
  minCollRatio: string,
  collLiquidationRatio: string,
}