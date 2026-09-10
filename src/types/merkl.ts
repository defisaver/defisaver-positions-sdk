import { EthAddress, IncentiveData, IncentiveSide } from './common';

export enum OpportunityAction {
  LEND = 'LEND',
  BORROW = 'BORROW',
}

export enum OpportunityStatus {
  LIVE = 'LIVE',
  PAST = 'PAST',
  UPCOMING = 'UPCOMING',
}

export type MerklCampaign = {
  id: string;
  campaignId: string;
  params?: {
    reserveId?: string | number;
    spokeAddress?: EthAddress;
    hubAddress?: EthAddress;
    hubAssetId?: string | number;
    assetId?: string | number;
  };
};

export type MerklOpportunity = {
  chainId: number;
  type: string;
  identifier: EthAddress;
  name: string;
  status: OpportunityStatus;
  action: OpportunityAction;
  tvl: number;
  apr: number;
  dailyRewards: number;
  tags: [];
  id: string;
  explorerAddress?: EthAddress;
  description?: string;
  campaigns?: MerklCampaign[];
  tokens: {
    id: string;
    name: string;
    chainId: number;
    address: EthAddress;
    decimals: number;
    icon: string;
    verified: boolean;
    isTest: boolean;
    price: number;
    symbol: string;
  }[];
  rewardsRecord: {
    id: string;
    total: number;
    timestamp: string;
    breakdowns: {
      token: {
        id: string;
        name: string;
        chainId: number;
        address: EthAddress;
        decimals: number;
        symbol: string;
        displaySymbol: string;
        icon: string;
        verified: boolean;
        isTest: boolean;
        type: string;
        isNative: boolean;
        price: number;
      };
      amount: string;
      value: number;
      distributionType: string;
      id: string;
      campaignId: string;
      dailyRewardsRecordId: string;
    }[];
  };
};

export type MerkleRewardInfo = { apy: string; rewardTokenSymbol: string, description: string, identifier: string };
export type MerkleRewardMap = Record<EthAddress, { supply?: MerkleRewardInfo; borrow?: MerkleRewardInfo }>;

export type AaveV4MerklScopedReward = { [side in IncentiveSide]?: IncentiveData };

/**
 * Fluid vault-scoped Merkl campaigns keyed by lowercase vault address — `supply` rewards apply to
 * the vault's collateral side, `borrow` rewards to its debt side.
 */
export type FluidMerklRewardMap = Record<string, { supply: IncentiveData[], borrow: IncentiveData[] }>;

/**
 * Aave V4 Merkl reward campaigns split by scope:
 *   - `hub`: keyed by `${hubAddress}_${assetId}` — rewards for supplying/borrowing via a hub asset
 *   - `spoke`: keyed by `${spokeAddress}_${reserveId}` — rewards for supplying/borrowing on a spoke reserve
 */
export type AaveV4MerklRewardMap = {
  hub: Record<string, AaveV4MerklScopedReward>;
  spoke: Record<string, AaveV4MerklScopedReward>;
};
