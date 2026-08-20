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
  // Tenor-hosted Midnight markets (same core, different order book)
  MorphoMidnightTenorCbBTCUSDC_20260827_Base = 'morphomidnighttenorcbbtcusdc_20260827_base',
  MorphoMidnightTenorCbBTCUSDC_20260924_Base = 'morphomidnighttenorcbbtcusdc_20260924_base',
  MorphoMidnightTenorCbBTCUSDC_20261022_Base = 'morphomidnighttenorcbbtcusdc_20261022_base',
  MorphoMidnightTenorCbBTCUSDC_20261119_Base = 'morphomidnighttenorcbbtcusdc_20261119_base',
  MorphoMidnightTenorCbBTCUSDC_20261217_Base = 'morphomidnighttenorcbbtcusdc_20261217_base',
  MorphoMidnightTenorWETHUSDC_20260827_Base = 'morphomidnighttenorwethusdc_20260827_base',
  MorphoMidnightTenorWETHUSDC_20260924_Base = 'morphomidnighttenorwethusdc_20260924_base',
  MorphoMidnightTenorWETHUSDC_20261022_Base = 'morphomidnighttenorwethusdc_20261022_base',
  MorphoMidnightTenorWETHUSDC_20261119_Base = 'morphomidnighttenorwethusdc_20261119_base',
  MorphoMidnightTenorWETHUSDC_20261217_Base = 'morphomidnighttenorwethusdc_20261217_base',
  MorphoMidnightTenorCbETHWETH_20260827_Base = 'morphomidnighttenorcbethweth_20260827_base',
  MorphoMidnightTenorCbETHWETH_20260924_Base = 'morphomidnighttenorcbethweth_20260924_base',
  MorphoMidnightTenorCbETHWETH_20261022_Base = 'morphomidnighttenorcbethweth_20261022_base',
  MorphoMidnightTenorCbETHWETH_20261119_Base = 'morphomidnighttenorcbethweth_20261119_base',
  MorphoMidnightTenorCbETHWETH_20261217_Base = 'morphomidnighttenorcbethweth_20261217_base',
}

export type MorphoMidnightCurator = 'Morpho' | 'Tenor';

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
  /**
   * Tenor's curated markets list the curator's own vault share token next to the real collateral.
   */
  hiddenCollaterals?: MorphoMidnightCollateralParams[],
  maturity: number, // unix timestamp (seconds)
  rcfThreshold: number | string,
  enterGate: EthAddress,
  liquidatorGate: EthAddress,
  marketId: string, // bytes32, precomputed off-chain (verify with MidnightView.toId)
  protocolName: string,
  curator: MorphoMidnightCurator,
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

/**
 * How much weight `borrowRate` / `debtBase` / `debtInterest` carry on a given position. They fall back to
 * `'0'` / `debt` / `'0'`, which is indistinguishable from a real 0%-interest position, so anything
 * displaying them has to read this to know whether it is looking at a number or at a placeholder.
 *
 * - `Available` — reported and reconciled against the on-chain debt (also lenders and debt-free positions,
 *   which have nothing to report).
 * - `Pending` — the indexer has not caught up with the chain yet: it does not know the position, or its
 *   split describes a different debt. Refetching resolves it; `getMorphoMidnightUserBorrowInfo` failing
 *   outright lands here too, since the next call may well succeed.
 * - `Unavailable` — no source covers this market, so refetching changes nothing. See
 *   `morphoMidnightMarketReportsBorrowInfo`.
 */
export enum MorphoMidnightBorrowInfoStatus {
  Available = 'available',
  Pending = 'pending',
  Unavailable = 'unavailable',
}

// Fixed-rate/YTM (derived from entry price + orderbook) is intentionally absent in MVP:
// MidnightView exposes no per-position rate, so a variable-MM-style APY would be misleading.
export interface MorphoMidnightPositionData extends MorphoMidnightAggregatedPositionData {
  usedAssets: MMUsedAssets,
  credit: string, // lender credit units, face value at maturity (with interest); 0 for borrowers
  debt: string, // borrower debt, face value at maturity (with interest); 0 for lenders
  borrowRate: string, // weighted-average borrow APY as a percent
  debtBase: string, // base borrowed (principal), loan-token units
  debtInterest: string, // debt − debtBase (fixed interest owed at maturity), loan-token units
  borrowInfoStatus: MorphoMidnightBorrowInfoStatus,
  maturity: number,
  isMatured: boolean,
}
