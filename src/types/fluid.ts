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
  type: FluidVaultType
}

export enum FluidMainnetVersion {
  ETH_USDC_1 = 'ETH_USDC_1',
  ETH_USDT_2 = 'ETH_USDT_2',
  WSTETH_ETH_3 = 'WSTETH_ETH_3',
  WSTETH_USDC_4 = 'WSTETH_USDC_4',
  WSTETH_USDT_5 = 'WSTETH_USDT_5',
  WEETH_WSTETH_6 = 'WEETH_WSTETH_6',
  WEETH_USDC_9 = 'WEETH_USDC_9',
  WEETH_USDT_10 = 'WEETH_USDT_10',
  ETH_USDC_11 = 'ETH_USDC_11',
  ETH_USDT_12 = 'ETH_USDT_12',
  WSTETH_ETH_13 = 'WSTETH_ETH_13',
  WSTETH_USDC_14 = 'WSTETH_USDC_14',
  WSTETH_USDT_15 = 'WSTETH_USDT_15',
  WEETH_WSTETH_16 = 'WEETH_WSTETH_16',
  SUSDE_USDC_17 = 'SUSDE_USDC_17',
  SUSDE_USDT_18 = 'SUSDE_USDT_18',
  WEETH_USDC_19 = 'WEETH_USDC_19',
  WEETH_USDT_20 = 'WEETH_USDT_20',
  WBTC_USDC_21 = 'WBTC_USDC_21',
  WBTC_USDT_22 = 'WBTC_USDT_22',
  WBTC_ETH_23 = 'WBTC_ETH_23',
  ETH_WBTC_24 = 'ETH_WBTC_24',
  WSTETH_WBTC_25 = 'WSTETH_WBTC_25',
  WEETH_WBTC_26 = 'WEETH_WBTC_26',
  WEETHS_WSTETH_27 = 'WEETHS_WSTETH_27',
  CBBTC_ETH_28 = 'CBBTC_ETH_28',
  CBBTC_USDC_29 = 'CBBTC_USDC_29',
  CBBTC_USDT_30 = 'CBBTC_USDT_30',
  ETH_CBBTC_31 = 'ETH_CBBTC_31',
  WEETH_CBBTC_32 = 'WEETH_CBBTC_32',
  WSTETH_ETH_WSTETH_ETH_44 = 'WSTETH_ETH_WSTETH_ETH_44',
  ETH_USDC_USDT_45 = 'ETH_USDC_USDT_45',
  WSTETH_USDC_USDT_46 = 'WSTETH_USDC_USDT_46',
  WEETH_USDC_USDT_47 = 'WEETH_USDC_USDT_47',
  WBTC_USDC_USDT_48 = 'WBTC_USDC_USDT_48',
  CBBTC_USDC_USDT_49 = 'CBBTC_USDC_USDT_49',
  SUSDE_USDC_USDT_50 = 'SUSDE_USDC_USDT_50',
  WBTC_CBBTC_WBTC_CBBTC_51 = 'WBTC_CBBTC_WBTC_CBBTC_51',
  WBTC_CBBTC_USDC_52 = 'WBTC_CBBTC_USDC_52',
  WBTC_CBBTC_USDT_53 = 'WBTC_CBBTC_USDT_53',
  ETH_GHO_54 = 'ETH_GHO_54',
  WSTETH_GHO_55 = 'WSTETH_GHO_55',
  SUSDE_GHO_56 = 'SUSDE_GHO_56',
  WEETH_GHO_57 = 'WEETH_GHO_57',
  SUSDS_GHO_58 = 'SUSDS_GHO_58',
  GHO_USDC_GHO_USDC_61 = 'GHO_USDC_GHO_USDC_61',
  WEETH_ETH_WSTETH_74 = 'WEETH_ETH_WSTETH_74',
  USDC_ETH_USDC_ETH_77 = 'USDC_ETH_USDC_ETH_77',
  RSETH_ETH_WSTETH_78 = 'RSETH_ETH_WSTETH_78',
  RSETH_WSTETH_79 = 'RSETH_WSTETH_79',
  WEETHS_ETH_WSTETH_80 = 'WEETHS_ETH_WSTETH_80',
  SUSDE_USDT_USDT_92 = 'SUSDE_USDT_USDT_92',
  USDE_USDT_USDT_93 = 'USDE_USDT_USDT_93',
  LBTC_CBBTC_WBTC_97 = 'LBTC_CBBTC_WBTC_97',
}

export enum FluidArbitrumVersion {
  ETH_USDC_1_ARB = 'ETH_USDC_1_ARB',
  ETH_USDT_2_ARB = 'ETH_USDT_2_ARB',
  WSTETH_USDC_3_ARB = 'WSTETH_USDC_3_ARB',
  WSTETH_USDT_4_ARB = 'WSTETH_USDT_4_ARB',
  WSTETH_ETH_5_ARB = 'WSTETH_ETH_5_ARB',
  WEETH_WSTETH_6_ARB = 'WEETH_WSTETH_6_ARB',
  WEETH_USDC_7_ARB = 'WEETH_USDC_7_ARB',
  WEETH_USDT_8_ARB = 'WEETH_USDT_8_ARB',
  ETH_ARB_9_ARB = 'ETH_ARB_9_ARB',
  ARB_USDC_10_ARB = 'ARB_USDC_10_ARB',
  ARB_USDT_11_ARB = 'ARB_USDT_11_ARB',
  WBTC_USDC_12_ARB = 'WBTC_USDC_12_ARB',
  WBTC_USDT_13_ARB = 'WBTC_USDT_13_ARB',
  WSTETH_ETH_WSTETH_ETH_16_ARB = 'WSTETH_ETH_WSTETH_ETH_16_ARB',
  WEETH_ETH_WSTETH_17_ARB = 'WEETH_ETH_WSTETH_17_ARB',
  WBTC_ETH_18_ARB = 'WBTC_ETH_18_ARB',
  ETH_WBTC_19_ARB = 'ETH_WBTC_19_ARB',
  WSTETH_WBTC_20_ARB = 'WSTETH_WBTC_20_ARB',
  WEETH_WBTC_21_ARB = 'WEETH_WBTC_21_ARB',
  USDC_ETH_USDC_ETH_22_ARB = 'USDC_ETH_USDC_ETH_22_ARB',
  ETH_USDC_USDT_23_ARB = 'ETH_USDC_USDT_23_ARB',
  WSTETH_USDC_USDT_24_ARB = 'WSTETH_USDC_USDT_24_ARB',
  WEETH_USDC_USDT_25_ARB = 'WEETH_USDC_USDT_25_ARB',
  WBTC_USDC_USDT_26_ARB = 'WBTC_USDC_USDT_26_ARB',
}

export enum FluidBaseVersions {
  ETH_USDC_1_BASE = 'ETH_USDC_1_BASE',
  WSTETH_USDC_2_BASE = 'WSTETH_USDC_2_BASE',
  WSTETH_ETH_3_BASE = 'WSTETH_ETH_3_BASE',
  WEETH_WSTETH_4_BASE = 'WEETH_WSTETH_4_BASE',
  WEETH_USDC_5_BASE = 'WEETH_USDC_5_BASE',
  CBETH_USDC_6_BASE = 'CBETH_USDC_6_BASE',
  CBBTC_USDC_7_BASE = 'CBBTC_USDC_7_BASE',
  CBBTC_EURC_8_BASE = 'CBBTC_EURC_8_BASE',
  CBETH_EURC_9_BASE = 'CBETH_EURC_9_BASE',
  ETH_EURC_10_BASE = 'ETH_EURC_10_BASE',
  WEETH_EURC_11_BASE = 'WEETH_EURC_11_BASE',
  WSTETH_EURC_12_BASE = 'WSTETH_EURC_12_BASE',
  CBBTC_ETH_13_BASE = 'CBBTC_ETH_13_BASE',
  ETH_CBBTC_14_BASE = 'ETH_CBBTC_14_BASE',
  WEETH_CBBTC_15_BASE = 'WEETH_CBBTC_15_BASE',
  WSTETH_CBBTC_16_BASE = 'WSTETH_CBBTC_16_BASE',
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