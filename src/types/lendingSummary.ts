import { EthAddress, NetworkNumber } from './common';

export type LendingSummaryPosition = {
  id: string;
  protocol: string;
  /** Estimated decimal USD values; null means unavailable, never a verified zero. */
  suppliedUsd: string | null;
  debtUsd: string | null;
};

export type WalletLendingSummary = {
  status: 'complete' | 'partial' | 'failed';
  positions: LendingSummaryPosition[];
  protocols: string[];
  /** Sum of known supply values; check valuationComplete before ranking by value. */
  suppliedUsd: string;
  valuationComplete: boolean;
  errors: string[];
};

/** Resolve distinct token addresses to USD prices keyed by lowercase address.
 * Native tokens use their wrapped address. Missing/invalid prices remain unavailable.
 * Prices are current market estimates; balances may come from a historical/fork snapshot.
 */
export type LendingSummaryPriceResolver = (
  network: NetworkNumber, tokens: EthAddress[], signal?: AbortSignal,
) => Promise<Record<string, string>>;

export type LendingSummaryOptions = {
  resolvePrices: LendingSummaryPriceResolver;
  signal?: AbortSignal;
  /** Defaults to a snapshot of the provider's latest block. */
  blockNumber?: bigint;
  /** Use the smaller 2 KB calldata limit required by simulation providers. */
  isSim?: boolean;
};

export type WalletLendingSummaries = {
  summaries: Record<string, WalletLendingSummary>;
  rateLimited: boolean;
};
