import { NetworkNumber } from './common';

export interface FluidMarketInfo {
  chainIds: number[]
  label: string
  shortLabel: string
  value: FluidVersions
  url: string
  id?: number
  marketAddress: string
  hasSmartCollateral: boolean
  hasSmartDebt: boolean
  collateralAsset: string
  debtAsset: string
  ethBased?: boolean,
  btcBased?: boolean,
  wstETHBased?: boolean,
  stableBased?: boolean,
  type: FluidVaultType,
  isDeprecatingSoon?: boolean,
}

export enum FluidMainnetVersion {
  FLUID_ETH_USDC_1 = 'FLUID_ETH_USDC_1',
  FLUID_ETH_USDT_2 = 'FLUID_ETH_USDT_2',
  FLUID_WSTETH_ETH_3 = 'FLUID_WSTETH_ETH_3',
  FLUID_WSTETH_USDC_4 = 'FLUID_WSTETH_USDC_4',
  FLUID_WSTETH_USDT_5 = 'FLUID_WSTETH_USDT_5',
  FLUID_WEETH_WSTETH_6 = 'FLUID_WEETH_WSTETH_6',
  FLUID_WEETH_USDC_9 = 'FLUID_WEETH_USDC_9',
  FLUID_WEETH_USDT_10 = 'FLUID_WEETH_USDT_10',
  FLUID_ETH_USDC_11 = 'FLUID_ETH_USDC_11',
  FLUID_ETH_USDT_12 = 'FLUID_ETH_USDT_12',
  FLUID_WSTETH_ETH_13 = 'FLUID_WSTETH_ETH_13',
  FLUID_WSTETH_USDC_14 = 'FLUID_WSTETH_USDC_14',
  FLUID_WSTETH_USDT_15 = 'FLUID_WSTETH_USDT_15',
  FLUID_WEETH_WSTETH_16 = 'FLUID_WEETH_WSTETH_16',
  FLUID_SUSDE_USDC_17 = 'FLUID_SUSDE_USDC_17',
  FLUID_SUSDE_USDT_18 = 'FLUID_SUSDE_USDT_18',
  FLUID_WEETH_USDC_19 = 'FLUID_WEETH_USDC_19',
  FLUID_WEETH_USDT_20 = 'FLUID_WEETH_USDT_20',
  FLUID_WBTC_USDC_21 = 'FLUID_WBTC_USDC_21',
  FLUID_WBTC_USDT_22 = 'FLUID_WBTC_USDT_22',
  FLUID_WBTC_ETH_23 = 'FLUID_WBTC_ETH_23',
  FLUID_ETH_WBTC_24 = 'FLUID_ETH_WBTC_24',
  FLUID_WSTETH_WBTC_25 = 'FLUID_WSTETH_WBTC_25',
  FLUID_WEETH_WBTC_26 = 'FLUID_WEETH_WBTC_26',
  FLUID_WEETHS_WSTETH_27 = 'FLUID_WEETHS_WSTETH_27',
  FLUID_CBBTC_ETH_28 = 'FLUID_CBBTC_ETH_28',
  FLUID_CBBTC_USDC_29 = 'FLUID_CBBTC_USDC_29',
  FLUID_CBBTC_USDT_30 = 'FLUID_CBBTC_USDT_30',
  FLUID_ETH_CBBTC_31 = 'FLUID_ETH_CBBTC_31',
  FLUID_WEETH_CBBTC_32 = 'FLUID_WEETH_CBBTC_32',
  FLUID_WSTETH_ETH_WSTETH_ETH_44 = 'FLUID_WSTETH_ETH_WSTETH_ETH_44',
  FLUID_ETH_USDC_USDT_45 = 'FLUID_ETH_USDC_USDT_45',
  FLUID_WSTETH_USDC_USDT_46 = 'FLUID_WSTETH_USDC_USDT_46',
  FLUID_WEETH_USDC_USDT_47 = 'FLUID_WEETH_USDC_USDT_47',
  FLUID_WBTC_USDC_USDT_48 = 'FLUID_WBTC_USDC_USDT_48',
  FLUID_CBBTC_USDC_USDT_49 = 'FLUID_CBBTC_USDC_USDT_49',
  FLUID_SUSDE_USDC_USDT_50 = 'FLUID_SUSDE_USDC_USDT_50',
  FLUID_WBTC_CBBTC_WBTC_CBBTC_51 = 'FLUID_WBTC_CBBTC_WBTC_CBBTC_51',
  FLUID_WBTC_CBBTC_USDC_52 = 'FLUID_WBTC_CBBTC_USDC_52',
  FLUID_WBTC_CBBTC_USDT_53 = 'FLUID_WBTC_CBBTC_USDT_53',
  FLUID_ETH_GHO_54 = 'FLUID_ETH_GHO_54',
  FLUID_WSTETH_GHO_55 = 'FLUID_WSTETH_GHO_55',
  FLUID_SUSDE_GHO_56 = 'FLUID_SUSDE_GHO_56',
  FLUID_WEETH_GHO_57 = 'FLUID_WEETH_GHO_57',
  FLUID_SUSDS_GHO_58 = 'FLUID_SUSDS_GHO_58',
  FLUID_GHO_USDC_GHO_USDC_61 = 'FLUID_GHO_USDC_GHO_USDC_61',
  FLUID_WEETH_ETH_WSTETH_74 = 'FLUID_WEETH_ETH_WSTETH_74',
  FLUID_USDC_ETH_USDC_ETH_77 = 'FLUID_USDC_ETH_USDC_ETH_77',
  FLUID_RSETH_ETH_WSTETH_78 = 'FLUID_RSETH_ETH_WSTETH_78',
  FLUID_RSETH_WSTETH_79 = 'FLUID_RSETH_WSTETH_79',
  FLUID_WEETHS_ETH_WSTETH_80 = 'FLUID_WEETHS_ETH_WSTETH_80',
  FLUID_SUSDE_USDT_USDT_92 = 'FLUID_SUSDE_USDT_USDT_92',
  FLUID_USDE_USDT_USDT_93 = 'FLUID_USDE_USDT_USDT_93',
  FLUID_LBTC_CBBTC_WBTC_97 = 'FLUID_LBTC_CBBTC_WBTC_97',
}

export enum FluidArbitrumVersion {
  FLUID_ETH_USDC_1_ARB = 'FLUID_ETH_USDC_1_ARB',
  FLUID_ETH_USDT_2_ARB = 'FLUID_ETH_USDT_2_ARB',
  FLUID_WSTETH_USDC_3_ARB = 'FLUID_WSTETH_USDC_3_ARB',
  FLUID_WSTETH_USDT_4_ARB = 'FLUID_WSTETH_USDT_4_ARB',
  FLUID_WSTETH_ETH_5_ARB = 'FLUID_WSTETH_ETH_5_ARB',
  FLUID_WEETH_WSTETH_6_ARB = 'FLUID_WEETH_WSTETH_6_ARB',
  FLUID_WEETH_USDC_7_ARB = 'FLUID_WEETH_USDC_7_ARB',
  FLUID_WEETH_USDT_8_ARB = 'FLUID_WEETH_USDT_8_ARB',
  FLUID_ETH_ARB_9_ARB = 'FLUID_ETH_ARB_9_ARB',
  FLUID_ARB_USDC_10_ARB = 'FLUID_ARB_USDC_10_ARB',
  FLUID_ARB_USDT_11_ARB = 'FLUID_ARB_USDT_11_ARB',
  FLUID_WBTC_USDC_12_ARB = 'FLUID_WBTC_USDC_12_ARB',
  FLUID_WBTC_USDT_13_ARB = 'FLUID_WBTC_USDT_13_ARB',
  FLUID_WSTETH_ETH_WSTETH_ETH_16_ARB = 'FLUID_WSTETH_ETH_WSTETH_ETH_16_ARB',
  FLUID_WEETH_ETH_WSTETH_17_ARB = 'FLUID_WEETH_ETH_WSTETH_17_ARB',
  FLUID_WBTC_ETH_18_ARB = 'FLUID_WBTC_ETH_18_ARB',
  FLUID_ETH_WBTC_19_ARB = 'FLUID_ETH_WBTC_19_ARB',
  FLUID_WSTETH_WBTC_20_ARB = 'FLUID_WSTETH_WBTC_20_ARB',
  FLUID_WEETH_WBTC_21_ARB = 'FLUID_WEETH_WBTC_21_ARB',
  FLUID_USDC_ETH_USDC_ETH_22_ARB = 'FLUID_USDC_ETH_USDC_ETH_22_ARB',
  FLUID_ETH_USDC_USDT_23_ARB = 'FLUID_ETH_USDC_USDT_23_ARB',
  FLUID_WSTETH_USDC_USDT_24_ARB = 'FLUID_WSTETH_USDC_USDT_24_ARB',
  FLUID_WEETH_USDC_USDT_25_ARB = 'FLUID_WEETH_USDC_USDT_25_ARB',
  FLUID_WBTC_USDC_USDT_26_ARB = 'FLUID_WBTC_USDC_USDT_26_ARB',
}

export enum FluidBaseVersions {
  FLUID_ETH_USDC_1_BASE = 'FLUID_ETH_USDC_1_BASE',
  FLUID_WSTETH_USDC_2_BASE = 'FLUID_WSTETH_USDC_2_BASE',
  FLUID_WSTETH_ETH_3_BASE = 'FLUID_WSTETH_ETH_3_BASE',
  FLUID_WEETH_WSTETH_4_BASE = 'FLUID_WEETH_WSTETH_4_BASE',
  FLUID_WEETH_USDC_5_BASE = 'FLUID_WEETH_USDC_5_BASE',
  FLUID_CBETH_USDC_6_BASE = 'FLUID_CBETH_USDC_6_BASE',
  FLUID_CBBTC_USDC_7_BASE = 'FLUID_CBBTC_USDC_7_BASE',
  FLUID_CBBTC_EURC_8_BASE = 'FLUID_CBBTC_EURC_8_BASE',
  FLUID_CBETH_EURC_9_BASE = 'FLUID_CBETH_EURC_9_BASE',
  FLUID_ETH_EURC_10_BASE = 'FLUID_ETH_EURC_10_BASE',
  FLUID_WEETH_EURC_11_BASE = 'FLUID_WEETH_EURC_11_BASE',
  FLUID_WSTETH_EURC_12_BASE = 'FLUID_WSTETH_EURC_12_BASE',
  FLUID_CBBTC_ETH_13_BASE = 'FLUID_CBBTC_ETH_13_BASE',
  FLUID_ETH_CBBTC_14_BASE = 'FLUID_ETH_CBBTC_14_BASE',
  FLUID_WEETH_CBBTC_15_BASE = 'FLUID_WEETH_CBBTC_15_BASE',
  FLUID_WSTETH_CBBTC_16_BASE = 'FLUID_WSTETH_CBBTC_16_BASE',
}

export type FluidVersions = FluidArbitrumVersion | FluidBaseVersions | FluidMainnetVersion;

export enum FluidMainnetDepositToken {
  ETH = 'ETH',
  wstETH = 'wstETH',
  USDC = 'USDC',
  USDT = 'USDT',
  GHO = 'GHO',
  sUSDS = 'sUSDS',
}

export enum FluidArbitrumDepositToken {
  ETH = 'ETH',
  wstETH = 'wstETH',
  USDC = 'USDC',
  USDT = 'USDT',
  ARB = 'ARB',
}

export enum FluidBaseDepositToken {
  ETH = 'ETH',
  USDC = 'USDC',
  wstETH = 'wstETH',
  EURC = 'EURC',
  sUSDS = 'sUSDS',
}

export type FluidDepositTokenByNetwork = {
  [NetworkNumber.Eth]: FluidMainnetDepositToken;
  [NetworkNumber.Arb]: FluidArbitrumDepositToken;
  [NetworkNumber.Base]: FluidBaseDepositToken;
};

export enum FluidVaultType {
  T1 = 'T1',
  T2 = 'T2',
  T3 = 'T3',
  T4 = 'T4',
  Unknown = 'Unknown',
}

export interface FluidAssetData {
  symbol: string,
  address: string,
  price: string,
  incentiveSupplyApy?: string,
  incentiveSupplyToken?: string,
  totalSupply: string,
  totalBorrow: string,
  canBeSupplied: boolean,
  canBeBorrowed: boolean,
  supplyRate: string,
  borrowRate: string,
}
export type FluidAssetsData = { [key: string]: FluidAssetData };

export interface InnerFluidMarketData {
  // Market specific data
  vaultId: number,
  isSmartColl: boolean,
  isSmartDebt: boolean,
  marketAddress: string,
  vaultType: FluidVaultType,
  vaultValue?: FluidVersions
  oracle: string,
  liquidationPenaltyPercent: string,
  collFactor: string,
  liquidationRatio: string,
  liqFactor: string,
  minRatio: string,
  collAsset0: string,
  collAsset1?: string,
  debtAsset0: string,
  debtAsset1?: string,
  totalPositions: string,
  totalSupplyVault: string,
  totalSupplyVaultUsd: string,
  totalBorrowVault: string,
  totalBorrowVaultUsd: string,
  withdrawalLimit: string,
  withdrawableUntilLimit: string,
  withdrawable: string,
  borrowLimit: string,
  borrowableUntilLimit: string,
  borrowable: string,
  borrowLimitUtilization: string,
  maxBorrowLimit: string,
  baseBorrowLimit: string,
  minimumBorrowing: string,
  supplyRate: string,
  borrowRate: string,
  liquidationMaxLimit: string,
}

export interface FluidMarketData {
  assetsData: FluidAssetsData,
  marketData: InnerFluidMarketData,
}

export interface FluidUsedAsset {
  symbol: string,
  collateral?: boolean,
  supplied: string,
  suppliedUsd: string,
  borrowed: string,
  borrowedUsd: string,
  isSupplied: boolean,
  isBorrowed: boolean,
}

export type FluidUsedAssets = { [key: string]: FluidUsedAsset };

export interface FluidAggregatedVaultData {
  suppliedUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  leftToBorrowUsd: string,
  netApy: string,
  incentiveUsd: string,
  ratio: string,
  collRatio: string,
  minRatio: string
  totalInterestUsd: string,
  leveragedType?: string,
  leveragedAsset?: string,
  liquidationPrice?: string,
  leveragedLsdAssetRatio?: string,
}

export interface BaseFluidVaultData {
  owner: string,
  vaultId: number,
  usedAssets: FluidUsedAssets,
  isSubscribedToAutomation: boolean,
  automationResubscribeRequired: boolean,
  lastUpdated: number,
}

export type FluidVaultData = FluidAggregatedVaultData & BaseFluidVaultData;