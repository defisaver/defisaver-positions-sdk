import Dec from 'decimal.js';
import { aprToApy } from '../moneymarket';
import { fetchAllMerklOpportunities } from '../services/merkl';
import {
  AaveV4MerklRewardMap,
  AaveV4MerklIncentive,
  AaveV4ReserveAssetData,
  IncentiveData,
  IncentiveKind,
  IncentiveSide,
  IncentiveSource,
  MerklCampaign,
  MerklOpportunity,
  OpportunityAction,
  OpportunityStatus,
  NetworkNumber,
} from '../types';

/**
 * Merkl tags Aave V4 reward campaigns by scope via the `type` field:
 *   - AAVE_V4_HUB_SUPPLY / AAVE_V4_HUB_BORROW   → reward tied to a hub asset
 *   - AAVE_V4_SPOKE_SUPPLY / AAVE_V4_SPOKE_BORROW → reward tied to a spoke reserve
 *   - AAVE_V4_HUB_NET_LENDING / AAVE_V4_SPOKE_NET_BORROWING → reward on the NET position
 *     (supply minus same-token borrows, or vice versa); params list scopes as `hubs[]`/`spokes[]`
 *     arrays instead of a flat address+id pair, and only the campaign's own side maps to a reward
 *     (the opposite-side ids describe what reduces the accrual)
 * Embedded campaign params provide the exact on-chain identifiers. Token addresses cannot safely
 * identify Aave V4 rewards because one spoke can expose the same underlying from multiple hubs.
 * Each stored reward is also tagged with campaign identity (`campaignIds`/`parentCampaignIds`) so
 * a hub (parent) campaign's child re-listing on a spoke can be told apart from a genuinely
 * distinct spoke campaign — the former replaces the hub reward, the latter combines with it.
 */

const scopeKey = (scopeAddress: string, id: string | number) => `${scopeAddress.toLowerCase()}_${id.toString()}`;

const buildIncentive = (opportunity: MerklOpportunity): IncentiveData => {
  const rewardToken = opportunity.rewardsRecord?.breakdowns?.[0]?.token;
  const token = rewardToken?.symbol || opportunity.tokens?.[0]?.symbol || '';
  return {
    apy: aprToApy(opportunity.apr),
    token,
    incentiveKind: IncentiveKind.Reward,
    source: IncentiveSource.Merkl,
    name: opportunity.name,
    description: opportunity.description || `Eligible for ${token} rewards through Merkl.`,
  };
};

export const buildAaveV4MerklRewardMap = (opportunities: MerklOpportunity[], chainId: NetworkNumber): AaveV4MerklRewardMap => {
  const result: AaveV4MerklRewardMap = { hub: {}, spoke: {} };

  const endByCampaignId: Record<string, number> = {};
  opportunities.forEach((o) => o.campaigns?.forEach((c) => {
    if (c.id && c.endTimestamp) endByCampaignId[c.id] = +c.endTimestamp;
  }));
  const effectiveEndTimestamp = (campaign: MerklCampaign): number => Math.max(
    campaign.endTimestamp ? +campaign.endTimestamp : 0,
    ...(campaign.childCampaignIds || []).map((id) => endByCampaignId[id] || 0),
  );

  opportunities
    .filter((o) => o.chainId === chainId)
    .filter((o) => o.status === OpportunityStatus.LIVE)
    .filter((o) => typeof o.type === 'string' && o.type.startsWith('AAVE_V4_'))
    .forEach((o) => {
      const side = o.action === OpportunityAction.BORROW ? IncentiveSide.Borrow : IncentiveSide.Supply;
      const now = Date.now() / 1000;
      const methods = o.campaigns
        ?.filter((c) => (c.startTimestamp === undefined || c.startTimestamp <= now)
          && (c.endTimestamp === undefined || c.endTimestamp > now))
        .map((c) => c.params?.distributionMethodParameters?.distributionMethod);
      // An opportunity-level APR cannot be split between simultaneous net and additive campaigns.
      if (side === IncentiveSide.Supply && methods?.includes('AAVE_V4_NET_APR')
        && methods.some((method) => !!method && method !== 'AAVE_V4_NET_APR')) return;
      const incentive = {
        ...buildIncentive(o),
        // Missing methods keep the existing target-yield behavior.
        isAdditiveReward: side === IncentiveSide.Supply && !!methods?.length
          && methods.every((method) => !!method && method !== 'AAVE_V4_NET_APR'),
      };
      // one opportunity can span several campaigns (e.g. renewed periods), so campaign identity is
      // collected per scope key before the reward entries are written
      const idsByKey: Record<string, { campaignIds: Set<string>, parentCampaignIds: Set<string>, endTimestamp?: number }> = {};
      const collect = (key: string, campaign: MerklCampaign) => {
        if (!idsByKey[key]) idsByKey[key] = { campaignIds: new Set(), parentCampaignIds: new Set() };
        if (campaign.id) idsByKey[key].campaignIds.add(campaign.id);
        if (campaign.parentCampaignId) idsByKey[key].parentCampaignIds.add(campaign.parentCampaignId);
        const endTimestamp = effectiveEndTimestamp(campaign);
        if (endTimestamp) idsByKey[key].endTimestamp = Math.max(idsByKey[key].endTimestamp || 0, endTimestamp);
      };

      if (o.type.includes('HUB')) {
        o.campaigns?.forEach((c) => {
          if (c.params?.hubs?.length) {
            c.params.hubs.forEach((hub) => {
              if (!hub.hubAddress) return;
              const rewardedIds = (side === IncentiveSide.Borrow ? hub.borrowAssetIds : hub.lendingAssetIds) || [];
              rewardedIds.forEach((assetId) => collect(scopeKey(hub.hubAddress, assetId), c));
            });
            return;
          }
          const hubAddress = c.params?.hubAddress ?? c.params?.distributionMethodParameters?.distributionSettings?.hubAddress;
          const assetId = c.params?.assetId ?? c.params?.distributionMethodParameters?.distributionSettings?.assetId;
          if (!hubAddress || assetId === undefined || assetId === null) return;
          collect(scopeKey(hubAddress, assetId), c);
        });
        Object.entries(idsByKey).forEach(([key, ids]) => {
          if (!result.hub[key]) result.hub[key] = {};
          result.hub[key][side] = [...(result.hub[key][side] || []), { ...incentive, endTimestamp: ids.endTimestamp, campaignIds: [...ids.campaignIds] }];
        });
      } else if (o.type.includes('SPOKE')) {
        o.campaigns?.forEach((c) => {
          if (c.params?.spokes?.length) {
            c.params.spokes.forEach((spoke) => {
              if (!spoke.spokeAddress) return;
              const rewardedTokens = (side === IncentiveSide.Borrow ? spoke.borrowTokens : spoke.supplyTokens) || [];
              rewardedTokens.forEach((tokenScope) => {
                if (tokenScope.reserveId === undefined || tokenScope.reserveId === null) return;
                collect(scopeKey(spoke.spokeAddress, tokenScope.reserveId), c);
              });
            });
            return;
          }
          if (!c.params?.spokeAddress || c.params.reserveId === undefined || c.params.reserveId === null) return;
          collect(scopeKey(c.params.spokeAddress, c.params.reserveId), c);
        });
        Object.entries(idsByKey).forEach(([key, ids]) => {
          if (!result.spoke[key]) result.spoke[key] = {};
          result.spoke[key][side] = [...(result.spoke[key][side] || []), {
            ...incentive, endTimestamp: ids.endTimestamp, campaignIds: [...ids.campaignIds], parentCampaignIds: [...ids.parentCampaignIds],
          }];
        });
      }
    });

  return result;
};

export const getAaveV4MerkleCampaigns = async (chainId: NetworkNumber): Promise<AaveV4MerklRewardMap> => {
  try {
    const opportunities = await fetchAllMerklOpportunities({
      mainProtocolId: 'aave',
      type: 'AAVE_V4_HUB_SUPPLY,AAVE_V4_HUB_BORROW,AAVE_V4_SPOKE_SUPPLY,AAVE_V4_SPOKE_BORROW,AAVE_V4_HUB_NET_LENDING,AAVE_V4_HUB_NET_BORROWING,AAVE_V4_SPOKE_NET_LENDING,AAVE_V4_SPOKE_NET_BORROWING',
      status: OpportunityStatus.LIVE,
      campaigns: 'true',
    });
    return buildAaveV4MerklRewardMap(opportunities, chainId);
  } catch (e) {
    console.error('Failed to fetch Aave V4 Merkle campaigns', e);
    return { hub: {}, spoke: {} };
  }
};

/**
 * Returns a copy of the asset with scope-specific incentive arrays pre-combined with the asset's
 * intrinsic (staking) incentives, so each surface can render base yield + the rewards that apply to it.
 */
export const attachAaveV4MerklIncentives = (asset: AaveV4ReserveAssetData, spokeAddress: string, campaigns: AaveV4MerklRewardMap): AaveV4ReserveAssetData => {
  const baseSupply = asset.supplyIncentives || [];
  const baseBorrow = asset.borrowIncentives || [];

  const spokeScoped = spokeAddress ? campaigns.spoke[scopeKey(spokeAddress, asset.reserveId)] : undefined;
  const hubScoped = asset.hub ? campaigns.hub[scopeKey(asset.hub, asset.assetId)] : undefined;
  // Net-APR campaigns top up native yield; additive campaigns pay their APR on top.
  const supplyRewards = (rewards: AaveV4MerklIncentive[] = []) => rewards.map((reward) => ({
    ...reward,
    apy: reward.isAdditiveReward ? reward.apy : Dec.max(0, new Dec(reward.apy).minus(asset.supplyRate || 0)).toString(),
  }));

  return {
    ...asset,
    spokeSupplyIncentives: spokeScoped?.supply?.length ? [...baseSupply, ...supplyRewards(spokeScoped.supply)] : baseSupply,
    spokeBorrowIncentives: spokeScoped?.borrow?.length ? [...baseBorrow, ...spokeScoped.borrow] : baseBorrow,
    hubSupplyIncentives: hubScoped?.supply?.length ? [...baseSupply, ...supplyRewards(hubScoped.supply)] : baseSupply,
    hubBorrowIncentives: hubScoped?.borrow?.length ? [...baseBorrow, ...hubScoped.borrow] : baseBorrow,
  };
};
