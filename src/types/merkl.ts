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
  /**
   * Merkl-internal `id` of the parent campaign — set on child campaigns, which re-publish a hub
   * (parent) campaign's reward scoped to a single spoke reserve. Absent on standalone campaigns,
   * whose `params` still carry `hubAddress`/`hubAssetId`, so only this field tells the two apart.
   */
  parentCampaignId?: string;
  childCampaignIds?: string[];
  startTimestamp?: number;
  endTimestamp?: number;
  params?: {
    reserveId?: string | number;
    spokeAddress?: EthAddress;
    hubAddress?: EthAddress;
    hubAssetId?: string | number;
    assetId?: string | number;
    /**
     * AAVE_V4_HUB_NET_* campaigns scope per hub: the reward applies to the ids on the campaign's
     * own side (`lendingAssetIds` for LEND, `borrowAssetIds` for BORROW) — the opposite-side ids
     * only describe positions that reduce the net accrual, so they never map to a reward.
     */
    hubs?: {
      hubAddress: EthAddress;
      assets?: { symbol: string; assetId: string | number; decimals?: number; underlyingToken?: EthAddress }[];
      lendingAssetIds?: (string | number)[];
      borrowAssetIds?: (string | number)[];
    }[];
    /** AAVE_V4_SPOKE_NET_* campaigns scope per spoke, with the same own-side rule as `hubs`. */
    spokes?: {
      spokeAddress: EthAddress;
      spokeName?: string;
      supplyTokens?: { symbol: string; reserveId: string | number; hubAddress?: EthAddress; hubAssetId?: string | number; underlyingToken?: EthAddress }[];
      borrowTokens?: { symbol: string; reserveId: string | number; hubAddress?: EthAddress; hubAssetId?: string | number; underlyingToken?: EthAddress }[];
    }[];
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

/**
 * A scoped Aave V4 Merkl reward tagged with the campaign identity needed to resolve parent/child
 * listings downstream: `campaignIds` are the Merkl-internal ids of the campaigns behind this
 * entry, `parentCampaignIds` (spoke entries only) the ids of the hub campaigns those are children
 * of. A hub reward is dropped only for a spoke reward that is its own child re-listing — a spoke
 * reward from a distinct campaign combines with it instead.
 */
export type AaveV4MerklIncentive = IncentiveData & {
  campaignIds?: string[];
  parentCampaignIds?: string[];
};

export type AaveV4MerklScopedReward = { [side in IncentiveSide]?: AaveV4MerklIncentive[] };

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
