export type ChickenBondsSystemInfoStructOutputStruct = {
  totalPendingLUSD: string;
  totalReserveLUSD: string;
  totalPermanentLUSD: string;
  ownedLUSDInSP: string;
  ownedLUSDInCurve: string;
  systemBackingRatio: string;
  accrualParameter: string;
  chickenInAMMFee: string;
  numPendingBonds: string;
  numChickenInBonds: string;
  numChickenOutBonds: string;
  bLUSDSupply: string;
};

export interface ChickenBondsSystemInfoBasic extends ChickenBondsSystemInfoStructOutputStruct {
  totalWeightedStartTimes: string
  targetAverageAgeMs: number
  acquiredLUSDInSP: string
  acquiredLUSDInCurve: string
  yTokensHeldByCBM: string
  floorPrice: string
  averageBondAgeMs: number
}

export interface BondInfoBasic {
  bondId: string,
  status: string,
  startTime: Date,
  endTime: Date,
  accruedBLUSD: string,
  claimedBLUSD: string,
  lusdAmount: string,
  maxAmountBLUSD: string,
}

export enum BondStatus {
  // Order [0, 3] is set on contract
  Nonexistent = '0',
  Active = '1',
  ChickenedOut = '2',
  ChickenedIn = '3',
  BrokeEven = '4',
  Rebondable = '5',
}