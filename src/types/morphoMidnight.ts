import {
  EthAddress, IncentiveData, LeverageType, MMUsedAssets, NetworkNumber,
} from './common';

export enum MorphoMidnightVersions {
  // BASE
  // Fixed-term markets are disambiguated by maturity (YYYYMMDD), so the same pair recurs across dates.
  // Sourced from the official listing at https://markets.morpho.org/fixed/base (see sitemap.xml).
  MorphoMidnightCbBTCUSDC_860_20260731_Base = 'morphomidnightcbbtcusdc_860_20260731_base',
  MorphoMidnightCbBTCUSDC_860_20260828_Base = 'morphomidnightcbbtcusdc_860_20260828_base',
  MorphoMidnightCbBTCUSDC_860_20260925_Base = 'morphomidnightcbbtcusdc_860_20260925_base',
  MorphoMidnightCbBTCUSDC_860_20261030_Base = 'morphomidnightcbbtcusdc_860_20261030_base',
  MorphoMidnightCbBTCUSDC_860_20261127_Base = 'morphomidnightcbbtcusdc_860_20261127_base',
  MorphoMidnightCbBTCUSDC_860_20261225_Base = 'morphomidnightcbbtcusdc_860_20261225_base',
}

export interface MorphoMidnightCollateralParams {
  token: EthAddress,
  lltv: number | string,
  liquidationCursor: number | string,
  oracle: EthAddress,
}

export interface MorphoMidnightMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: MorphoMidnightVersions,
  midnight: EthAddress,
  loanToken: EthAddress,
  collaterals: MorphoMidnightCollateralParams[],
  maturity: number, // unix timestamp (seconds)
  rcfThreshold: number | string,
  enterGate: EthAddress,
  liquidatorGate: EthAddress,
  marketId: string, // bytes32, precomputed off-chain (verify with MidnightView.toId)
  protocolName: string,
}

export interface MorphoMidnightAssetData {
  symbol: string,
  address: string,
  price: string,
  supplyRate: string,
  borrowRate: string,
  supplyIncentives: IncentiveData[],
  borrowIncentives: IncentiveData[],
  totalSupply?: string,
  totalBorrow?: string,
  canBeSupplied?: boolean,
  canBeBorrowed?: boolean,
  lltv?: string,
}

export type MorphoMidnightAssetsData = { [key: string]: MorphoMidnightAssetData };

export interface MorphoMidnightMarketInfo {
  id: string,
  loanToken: string,
  collaterals: string[], // collateral symbols, index-aligned with the market's collateral set
  maturity: number, // unix timestamp (seconds)
  isMatured: boolean, // true once now >= maturity; no new debt can be opened
  totalUnits: string, // face-value units on the market (= totalDebt + withdrawable)
  withdrawable: string, // loan-token liquidity available for withdraw
  totalDebt: string,
  lossFactor: string, // bad-debt socialization factor applied to lender credit
  tickSpacing: number, // orderbook price granularity (relevant to phase-2 rate math)
  utillization: string,
  assetsData: MorphoMidnightAssetsData,
}

// Which half of the order book a caller is taking from: `bids` are the lend offers a borrower fills,
// `asks` the sell offers a repayer buys debt units from.
export type MorphoMidnightBookSide = 'bids' | 'asks';

// One resting offer on a market's order book, as an annualized rate rather than the API's raw WAD price.
export interface MorphoMidnightBookOffer {
  rate: string, // fixed APY, percent
  liquidity: string, // loan-token amount available at this rate
}

export interface MorphoMidnightParsedBook {
  bestRate: string, // best rate for the taker of this side (= offers[0].rate)
  totalLiquidity: string, // Σ offers[].liquidity, loan-token units
  offers: MorphoMidnightBookOffer[], // best-first: bids ascending by rate, asks descending
}

export interface MorphoMidnightAggregatedPositionData {
  suppliedUsd: string,
  suppliedCollateralUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  leftToBorrowUsd: string,
  leftToBorrow: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  ltv: string,
  ratio: string, // health ratio as a percentage (from MidnightView.ratio, 1e18-scaled)
  healthRatio: string, // liquidationLimitUsd / borrowedUsd
  leveragedType: LeverageType,
  leveragedAsset?: string,
  currentVolatilePairRatio?: string,
  liquidationPrice?: string,
  minCollRatio?: string,
  collLiquidationRatio?: string,
  exposure: string,
}

// Fixed-rate/YTM (derived from entry price + orderbook) is intentionally absent in MVP:
// MidnightView exposes no per-position rate, so a variable-MM-style APY would be misleading.
export interface MorphoMidnightPositionData extends MorphoMidnightAggregatedPositionData {
  usedAssets: MMUsedAssets,
  credit: string, // lender credit units, face value at maturity (with interest); 0 for borrowers
  debt: string, // borrower debt, face value at maturity (with interest); 0 for lenders
  // Borrow rate + base/interest split are orderbook-derived off-chain (from the Midnight transactions API):
  // MidnightView only stores `debt` (= face value at maturity), so principal-vs-interest and the effective
  // rate are computed from the fill history. Default to '0'/`debt`/'0' for lenders or when the API is unavailable.
  borrowRate: string, // weighted-average borrow APY as a percent
  debtBase: string, // base borrowed (principal), loan-token units
  debtInterest: string, // debt − debtBase (fixed interest owed at maturity), loan-token units
  maturity: number,
  isMatured: boolean,
}
