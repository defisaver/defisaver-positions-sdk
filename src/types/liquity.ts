export enum LIQUITY_TROVE_STATUS_ENUM {
  nonExistent,
  active,
  closedByOwner,
  closedByLiquidation,
  closedByRedemption,
}

export const LIQUITY_STATUS_MAPPING = {
  nonExistent: 'Non existent',
  active: 'Active',
  closedByOwner: 'Closed',
  closedByLiquidation: 'Liquidated',
  closedByRedemption: 'Redeemed',
};

export interface LiquityTroveInfo {
  troveStatus: string,
  collateral: string,
  debtInAsset: string,
  TCRatio: string,
  recoveryMode: boolean,
  claimableCollateral: string,
  borrowingRateWithDecay: string,
  assetPrice: string,
  totalETH: string,
  totalLUSD: string,
  minCollateralRatio: number,
  // Collateral ratio rebased so 100 sits on `minCollateralRatio` (normalised safety ratio).
  safetyRatio: string,
  priceForRecovery: string,
  debtInFront: string,
  exposure: string,
  // Always '0' for Liquity v1: LUSD debt is interest free (one-off borrowing fee only) and ETH collateral earns no yield.
  netApy: string,
  totalInterestUsd: string,
  incentiveUsd: string,
}