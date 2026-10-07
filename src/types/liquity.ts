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
  priceForRecovery: string,
  debtInFront: string,
  exposure: string,
}
/** LQTY staking and the LUSD stability pool deposit of an address, from getLiquityStakingData. */
export interface LiquityStakingData {
  totalLUSDDeposited: string,
  totalLQTYStaked: string,
  stakedLQTY: string,
  stakedLUSDBalance: string,
  rewardETH: string,
  rewardLUSD: string,
  stabilityRewardETH: string,
  stabilityRewardLQTY: string,
  showStakingBalances: boolean,
}
