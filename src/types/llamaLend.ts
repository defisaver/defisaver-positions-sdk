import { EthAddress, NetworkNumber } from './common';
import { BandData, UserBandData } from './curveUsd';

export enum LLVersionsEth {
  // long only
  LLWstethCrvusd = 'llamaLendwstETHcrvUSD',
  LLWstethCrvusd2 = 'llamaLendwstETHcrvUSD2',
  LLSusdeCrvusd = 'llamaLendsUSDecrvUSD',
  LLSusdeCrvusd2 = 'llamaLendsUSDecrvUSD2',
  LLWbtcCrvusd = 'llamaLendWBTCcrvUSD',
  // LLPufethCrvusd = 'llamaLendPufETHcrvUSD', // temp disabled
  LLUsdeCrvusd = 'llamaLendUSDecrvUSD',
  LLWethCrvusd2 = 'llamaLendWETHcrvUSD2',
  // long and short crv
  LLCrvCrvusd = 'llamaLendCRVcrvUSD',
  LLCrvusdCrv = 'llamaLendcrvUSDCRV',
  // long and short tbtc
  LLTbtcCrvusd = 'llamaLendTBTCcrvUSD',
  LLCrvusdTbtc = 'llamaLendcrvUSDTBTC',
  // long and short weth
  LLWethCrvusd = 'llamaLendWETHcrvUSD',
  LLCrvusdWeth = 'llamaLendcrvUSDWETH',
}

export enum LLVersionsArb {
  // long only
  LLArbCrvusd = 'llamaLendArbcrvUSD',
  LLArbCrvusd2 = 'llamaLendArbcrvUSD2',
  LLFxnCrvusd = 'llamaLendFXNcrvUSD',
  LLWbtcCrvusd = 'llamaLendWBTCcrvUSD',
  LLWbtcCrvusd2 = 'llamaLendWBTCcrvUSD2',
  LLCrvCrvusd = 'llamaLendCRVcrvUSD',
  LLWethCrvusd = 'llamaLendWETHcrvUSD',
  LLWethCrvusd2 = 'llamaLendWETHcrvUSD2',
}

export const LlamaLendVersions = {
  ...LLVersionsEth,
  ...LLVersionsArb,
} as const;

export type LlamaLendVersionsType = typeof LlamaLendVersions[keyof typeof LlamaLendVersions];

export enum LlamaLendStatus {
  Nonexistant = 'Nonexistant',
  Safe = 'Safe',
  Risk = 'Risk',
  SoftLiquidating = 'SoftLiquidating',
  SoftLiquidated = 'SoftLiquidated',
}

export interface LlamaLendMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  value: LlamaLendVersionsType,
  collAsset: string,
  baseAsset: string,
  controllerAddress: EthAddress,
  vaultAddress: EthAddress,
  url: string,
}
export interface LlamaLendAssetData {
  symbol: string,
  address: string,
  price: string,
  supplyRate: string,
  borrowRate: string,
  totalSupply?: string,
  totalBorrow?: string,
  canBeSupplied?: boolean,
  canBeBorrowed?: boolean,
  shares?: string,
}

export type LlamaLendAssetsData = { [key: string]: LlamaLendAssetData };

export interface LlamaLendGlobalMarketData {
  A:string,
  loanDiscount: string,
  activeBand: string,
  totalDebt: string,
  totalDebtSupplied:string,
  utilization:string,
  ammPrice: string,
  basePrice: string,
  oraclePrice: string,
  minted: string,
  redeemed: string,
  monetaryPolicyRate: string,
  ammRate: string,
  minBand: string,
  maxBand: string,
  borrowRate: string,
  lendRate: string,
  futureBorrowRate: string,
  leftToBorrow: string,
  bands: BandData[],
  assetsData: LlamaLendAssetsData,
}

export interface LlamaLendAggregatedPositionData {
  ratio: string,
  suppliedUsd: string,
  borrowedUsd: string,
  suppliedForYieldUsd: string,
  safetyRatio: string,
  borrowLimitUsd: string,
  minAllowedRatio: number,
  collFactor: string,
  leveragedType: string,
  leveragedAsset?: string,
  liquidationPrice?: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
}

export interface LlamaLendUsedAsset {
  isSupplied: boolean,
  supplied: string,
  suppliedUsd: string,
  borrowed: string,
  borrowedUsd: string,
  isBorrowed: boolean,
  symbol: string,
  collateral: boolean,
  price: string,
  interestRate?: string,
  suppliedForYield?: string,
  suppliedForYieldUsd?: string,
  shares?: string,
}

export interface LlamaLendUsedAssets {
  [key: string]: LlamaLendUsedAsset,
}

export interface LlamaLendUserData {
  debtAmount: string,
  health: string,
  healthPercent: string,
  priceHigh: string,
  priceLow: string,
  liquidationDiscount: string,
  numOfBands: string,
  usedAssets: LlamaLendUsedAssets,
  status: LlamaLendStatus,
  ratio: string,
  suppliedUsd: string,
  borrowedUsd: string,
  suppliedForYieldUsd: string,
  safetyRatio: string,
  userBands: UserBandData[],
  loanExists: boolean,
  borrowRate?: string,
}
