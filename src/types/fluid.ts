import {
  EthAddress, IncentiveData, LeverageType, NetworkNumber,
} from './common';

export interface FluidMarketInfo {
  chainIds: number[]
  label: string
  shortLabel: string
  value: FluidVersions
  url: string
  id?: number
  marketAddress: EthAddress
  hasSmartCollateral: boolean
  hasSmartDebt: boolean
  collateralAsset0: string
  collateralAsset1?: string
  debtAsset0: string
  debtAsset1?: string
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
  FLUID_SUSDE_USDC_7 = 'FLUID_SUSDE_USDC_7',
  FLUID_SUSDE_USDT_8 = 'FLUID_SUSDE_USDT_8',
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
  FLUID_WSTETH_CBBTC_33 = 'FLUID_WSTETH_CBBTC_33',
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
  FLUID_WBTC_GHO_59 = 'FLUID_WBTC_GHO_59',
  FLUID_CBBTC_GHO_60 = 'FLUID_CBBTC_GHO_60',
  FLUID_GHO_USDC_GHO_USDC_61 = 'FLUID_GHO_USDC_GHO_USDC_61',
  FLUID_WEETH_ETH_WSTETH_74 = 'FLUID_WEETH_ETH_WSTETH_74',
  FLUID_USDC_ETH_USDC_ETH_77 = 'FLUID_USDC_ETH_USDC_ETH_77',
  FLUID_RSETH_ETH_WSTETH_78 = 'FLUID_RSETH_ETH_WSTETH_78',
  FLUID_RSETH_WSTETH_79 = 'FLUID_RSETH_WSTETH_79',
  FLUID_WEETHS_ETH_WSTETH_80 = 'FLUID_WEETHS_ETH_WSTETH_80',
  FLUID_SUSDE_USDT_USDT_92 = 'FLUID_SUSDE_USDT_USDT_92',
  FLUID_USDE_USDT_USDT_93 = 'FLUID_USDE_USDT_USDT_93',
  FLUID_LBTC_CBBTC_WBTC_97 = 'FLUID_LBTC_CBBTC_WBTC_97',
  FLUID_SUSDE_USDT_USDC_USDT_98 = 'FLUID_SUSDE_USDT_USDC_USDT_98',
  FLUID_USDE_USDT_USDC_USDT_99 = 'FLUID_USDE_USDT_USDC_USDT_99',
  FLUID_USDC_ETH_100 = 'FLUID_USDC_ETH_100',
  FLUID_USDC_WBTC_101 = 'FLUID_USDC_WBTC_101',
  FLUID_USDC_CBBTC_102 = 'FLUID_USDC_CBBTC_102',
  FLUID_EZETH_WSTETH_103 = 'FLUID_EZETH_WSTETH_103',
  FLUID_EZETH_ETH_WSTETH_104 = 'FLUID_EZETH_ETH_WSTETH_104',
  FLUID_LBTC_USDC_107 = 'FLUID_LBTC_USDC_107',
  FLUID_LBTC_USDT_108 = 'FLUID_LBTC_USDT_108',
  FLUID_LBTC_GHO_109 = 'FLUID_LBTC_GHO_109',
  FLUID_LBTC_CBBTC_CBBTC_114 = 'FLUID_LBTC_CBBTC_CBBTC_114',
  FLUID_WBTC_LBTC_WBTC_115 = 'FLUID_WBTC_LBTC_WBTC_115',
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
  // FLUID_SUSDS_USDC_USDT_30_ARB = 'FLUID_SUSDS_USDC_USDT_30_ARB',
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
  FLUID_ETH_SUSDS_17_BASE = 'FLUID_ETH_SUSDS_17_BASE',
  FLUID_WSTETH_SUSDS_18_BASE = 'FLUID_WSTETH_SUSDS_18_BASE',
  FLUID_CBBTC_SUSDS_19_BASE = 'FLUID_CBBTC_SUSDS_19_BASE',
  FLUID_LBTC_USDC_21_BASE = 'FLUID_LBTC_USDC_21_BASE',
  FLUID_LBTC_SUSDS_22_BASE = 'FLUID_LBTC_SUSDS_22_BASE',
}

export enum FluidPlasmaVersions {
  FLUID_ETH_USDT_1_PLASMA = 'FLUID_ETH_USDT_1_PLASMA',
  FLUID_ETH_USDE_2_PLASMA = 'FLUID_ETH_USDE_2_PLASMA',
  FLUID_WEETH_ETH_3_PLASMA = 'FLUID_WEETH_ETH_3_PLASMA',
  FLUID_SUSDE_USDT_4_PLASMA = 'FLUID_SUSDE_USDT_4_PLASMA',
  FLUID_WEETH_USDT_5_PLASMA = 'FLUID_WEETH_USDT_5_PLASMA',
  FLUID_WEETH_USDE_6_PLASMA = 'FLUID_WEETH_USDE_6_PLASMA',
  FLUID_XAUT_USDT_7_PLASMA = 'FLUID_XAUT_USDT_7_PLASMA',
  FLUID_XAUT_USDE_8_PLASMA = 'FLUID_XAUT_USDE_8_PLASMA',
  FLUID_USDE_USDT_9_PLASMA = 'FLUID_USDE_USDT_9_PLASMA',
  FLUID_USDAI_USDT_10_PLASMA = 'FLUID_USDAI_USDT_10_PLASMA',
  FLUID_ETH_WEETH_ETH_11_PLASMA = 'FLUID_ETH_WEETH_ETH_11_PLASMA',
  FLUID_SUSDE_USDT_USDT_12_PLASMA = 'FLUID_SUSDE_USDT_USDT_12_PLASMA',
  FLUID_USDE_USDT_USDT_13_PLASMA = 'FLUID_USDE_USDT_USDT_13_PLASMA',
  FLUID_USDAI_USDT_USDT_14_PLASMA = 'FLUID_USDAI_USDT_USDT_14_PLASMA',
  FLUID_USDT_SYRUPUSDT_USDT_15_PLASMA = 'FLUID_USDT_SYRUPUSDT_USDT_15_PLASMA',
  FLUID_XPL_USDT_16_PLASMA = 'FLUID_XPL_USDT_16_PLASMA',
  FLUID_XPL_USDE_17_PLASMA = 'FLUID_XPL_USDE_17_PLASMA',
  FLUID_WSTUSR_USDT_18_PLASMA = 'FLUID_WSTUSR_USDT_18_PLASMA',
  FLUID_WSTUSR_USDT_USDT_19_PLASMA = 'FLUID_WSTUSR_USDT_USDT_19_PLASMA',
  FLUID_SYRUPUSDT_USDT_20_PLASMA = 'FLUID_SYRUPUSDT_USDT_20_PLASMA',
  FLUID_ETH_WRSETH_ETH_21_PLASMA = 'FLUID_ETH_WRSETH_ETH_21_PLASMA',
}

export type FluidVersions = FluidArbitrumVersion | FluidBaseVersions | FluidMainnetVersion | FluidPlasmaVersions;

export enum FluidMainnetDepositToken {
  ETH = 'ETH',
  wstETH = 'wstETH',
  USDC = 'USDC',
  USDT = 'USDT',
  GHO = 'GHO',
  sUSDS = 'sUSDS',
  USDtb = 'USDtb',
}

export enum FluidArbitrumDepositToken {
  ETH = 'ETH',
  wstETH = 'wstETH',
  USDC = 'USDC',
  USDT = 'USDT',
  ARB = 'ARB',
  GHO = 'GHO',
  sUSDS = 'sUSDS',
}

export enum FluidBaseDepositToken {
  ETH = 'ETH',
  USDC = 'USDC',
  wstETH = 'wstETH',
  EURC = 'EURC',
  sUSDS = 'sUSDS',
  GHO = 'GHO',
}

export enum FluidPlasmaDepositToken {
  USDe = 'USDe',
  USDT = 'USDT',
  ETH = 'ETH',
}

export type FluidDepositTokenByNetwork = {
  [NetworkNumber.Eth]: FluidMainnetDepositToken;
  [NetworkNumber.Arb]: FluidArbitrumDepositToken;
  [NetworkNumber.Base]: FluidBaseDepositToken;
  [NetworkNumber.Plasma]: FluidPlasmaDepositToken;
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
  supplyIncentives: IncentiveData[],
  borrowIncentives: IncentiveData[],
  totalSupply: string,
  totalBorrow: string,
  canBeSupplied: boolean,
  canBeBorrowed: boolean,
  supplyRate: string,
  borrowRate: string,
  utilization?: string,
  withdrawable?: string,
  borrowable?: string,
  tokenPerSupplyShare?: string,
  tokenPerBorrowShare?: string,
  supplyReserves?: string,
  borrowReserves?: string,
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
  oracle: EthAddress,
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
  withdrawalLimit?: string,
  withdrawableUntilLimit?: string,
  withdrawable: string,
  withdrawableDex?: string,
  borrowLimit?: string,
  borrowableUntilLimit?: string,
  borrowable: string,
  borrowableDex?: string,
  borrowLimitUtilization?: string,
  maxBorrowLimit?: string,
  baseBorrowLimit?: string,
  minimumBorrowing?: string,
  supplyRate: string,
  borrowRate: string,
  liquidationMaxLimit: string,
  oraclePrice: string,
  incentiveBorrowRate?: string,
  incentiveSupplyRate?: string,
  // T2 and T4 vaults
  collSharePrice?: string,
  maxSupplyShares?: string,
  maxSupplySharesUsd?: string,
  withdrawableUSD?: string,
  totalSupplyToken0?: string,
  totalSupplyToken1?: string,
  withdrawableToken0?: string,
  withdrawableToken1?: string,
  collDexFee?: string
  // T3 and T4 vaults
  debtSharePrice?: string,
  maxBorrowShares?: string,
  maxBorrowSharesUsd?: string,
  borrowableUSD?: string,
  borrowableToken0?: string,
  borrowableToken1?: string,
  totalBorrowToken0?: string,
  totalBorrowToken1?: string,
  borrowDexFee?: string,
  // Dex vault
  tradingBorrowRate?: string,
  tradingSupplyRate?: string,
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
  minRatio: string,
  totalInterestUsd: string,
  leveragedType?: LeverageType,
  leveragedAsset?: string,
  liquidationPrice?: string,
  currentVolatilePairRatio?: string,
  minCollRatio?: string,
  collLiquidationRatio?: string,
  exposure: string,
}

export interface BaseFluidVaultData {
  owner: string,
  vaultId: number,
  usedAssets: FluidUsedAssets,
  isSubscribedToAutomation: boolean,
  automationResubscribeRequired: boolean,
  lastUpdated: number,
  supplyShares?: string;
  borrowShares?: string;
  nftId: string;
}

export type FluidVaultData = FluidAggregatedVaultData & BaseFluidVaultData;

export interface FluidDexSupplyDataStructOutput {
  dexPool: EthAddress;
  dexId: bigint;
  fee: bigint;
  lastStoredPrice: bigint;
  centerPrice: bigint;
  token0Utilization: bigint;
  token1Utilization: bigint;
  totalSupplyShares: bigint;
  maxSupplyShares: bigint;
  token0Supplied: bigint;
  token1Supplied: bigint;
  sharesWithdrawable: bigint;
  token0Withdrawable: bigint;
  token1Withdrawable: bigint;
  token0PerSupplyShare: bigint;
  token1PerSupplyShare: bigint;
  token0SupplyRate: bigint;
  token1SupplyRate: bigint;
  supplyToken0Reserves: bigint;
  supplyToken1Reserves: bigint;
}

export interface FluidDexBorrowDataStructOutput {
  quoteToken: EthAddress;
  dexPool: EthAddress;
  dexId: bigint;
  fee: bigint;
  lastStoredPrice: bigint;
  centerPrice: bigint;
  token0Utilization: bigint;
  token1Utilization: bigint;
  totalBorrowShares: bigint;
  maxBorrowShares: bigint;
  token0Borrowed: bigint;
  token1Borrowed: bigint;
  sharesBorrowable: bigint;
  token0Borrowable: bigint;
  token1Borrowable: bigint;
  token0PerBorrowShare: bigint;
  token1PerBorrowShare: bigint;
  token0BorrowRate: bigint;
  token1BorrowRate: bigint;
  quoteTokensPerShare: bigint;
  borrowToken0Reserves: bigint;
  borrowToken1Reserves: bigint;
}

export interface FluidVaultDataStructOutputStruct {
  vault: EthAddress;
  vaultId: bigint;
  vaultType: bigint;
  isSmartColl: boolean;
  isSmartDebt: boolean;
  supplyToken0: EthAddress;
  supplyToken1: EthAddress;
  borrowToken0: EthAddress;
  borrowToken1: EthAddress;
  supplyRateVault: bigint;
  borrowRateVault: bigint;
  oraclePriceOperate: bigint;
  totalSupplyVault: bigint;
  totalBorrowVault: bigint;
  liquidationThreshold: number;
  liquidationMaxLimit: number;
  oracle: EthAddress;
  liquidationPenalty: number;
  collateralFactor: number;
  totalPositions: bigint;
  withdrawalLimit: bigint;
  withdrawableUntilLimit: bigint;
  withdrawable: bigint;
  borrowLimit: bigint;
  borrowableUntilLimit: bigint;
  borrowable: bigint;
  borrowLimitUtilization: bigint;
  maxBorrowLimit: bigint;
  baseBorrowLimit: bigint;
  minimumBorrowing: bigint;
  dexSupplyData: FluidDexSupplyDataStructOutput;
  dexBorrowData: FluidDexBorrowDataStructOutput;
}

export interface FluidUserPositionStructOutputStruct {
  nftId: bigint;
  owner: EthAddress;
  isLiquidated: boolean;
  isSupplyPosition: boolean;
  supply: bigint;
  borrow: bigint;
  ratio: bigint;
  tick: bigint;
  tickId: bigint;
}

export interface FluidUserEarnPositionStructOutput {
  fTokenShares: bigint;
  underlyingAssets: bigint;
  underlyingBalance: bigint;
  allowance: bigint;
}

export interface FluidFTokenDataStructOutput {
  tokenAddress: EthAddress;
  isNativeUnderlying: boolean;
  name: string;
  symbol: string;
  decimals: bigint;
  asset: EthAddress;
  totalAssets: bigint;
  totalSupply: bigint;
  convertToShares: bigint;
  convertToAssets: bigint;
  expandDuration: bigint;
  supplyRate: bigint;
  rewardsRate: bigint;
  withdrawable: bigint;
}