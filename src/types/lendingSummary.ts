export type LendingSummaryPosition = {
  id: string;
  protocol: string;
  /** Decimal USD values; null means unavailable, never a verified zero. */
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

export type LendingSummaryOptions = {
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
