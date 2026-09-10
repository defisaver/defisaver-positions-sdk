import { aprToApy } from '../moneymarket';
import { fetchAllMerklOpportunities } from '../services/merkl';
import {
  AaveV4MerklRewardMap,
  AaveV4ReserveAssetData,
  IncentiveData,
  IncentiveKind,
  IncentiveSide,
  MerklOpportunity,
  OpportunityAction,
  OpportunityStatus,
  NetworkNumber,
} from '../types';

/**
 * Merkl tags Aave V4 reward campaigns by scope via the `type` field:
 *   - AAVE_V4_HUB_SUPPLY / AAVE_V4_HUB_BORROW   → reward tied to a hub asset
 *   - AAVE_V4_SPOKE_SUPPLY / AAVE_V4_SPOKE_BORROW → reward tied to a spoke reserve
 * Embedded campaign params provide the exact on-chain identifiers. Token addresses cannot safely
 * identify Aave V4 rewards because one spoke can expose the same underlying from multiple hubs.
 */

const scopeKey = (scopeAddress: string, id: string | number) => `${scopeAddress.toLowerCase()}_${id.toString()}`;

const buildIncentive = (opportunity: MerklOpportunity): IncentiveData => {
  const rewardToken = opportunity.rewardsRecord?.breakdowns?.[0]?.token;
  const token = rewardToken?.symbol || opportunity.tokens?.[0]?.symbol || '';
  return {
    apy: aprToApy(opportunity.apr),
    token,
    incentiveKind: IncentiveKind.Reward,
    description: `Eligible for ${token} rewards through Merkl.${opportunity.description ? `\n${opportunity.description}` : ''}`,
  };
};

export const buildAaveV4MerklRewardMap = (opportunities: MerklOpportunity[], chainId: NetworkNumber): AaveV4MerklRewardMap => {
  const result: AaveV4MerklRewardMap = { hub: {}, spoke: {} };

  opportunities
    .filter((o) => o.chainId === chainId)
    .filter((o) => o.status === OpportunityStatus.LIVE)
    .filter((o) => typeof o.type === 'string' && o.type.startsWith('AAVE_V4_'))
    .forEach((o) => {
      const side = o.action === OpportunityAction.BORROW ? IncentiveSide.Borrow : IncentiveSide.Supply;
      const incentive = buildIncentive(o);
      const keys = new Set<string>();

      if (o.type.includes('HUB')) {
        o.campaigns?.forEach(({ params }) => {
          if (!params?.hubAddress || params.assetId === undefined || params.assetId === null) return;
          keys.add(scopeKey(params.hubAddress, params.assetId));
        });
        keys.forEach((key) => {
          if (!result.hub[key]) result.hub[key] = {};
          result.hub[key][side] = incentive;
        });
      } else if (o.type.includes('SPOKE')) {
        o.campaigns?.forEach(({ params }) => {
          if (!params?.spokeAddress || params.reserveId === undefined || params.reserveId === null) return;
          keys.add(scopeKey(params.spokeAddress, params.reserveId));
        });
        keys.forEach((key) => {
          if (!result.spoke[key]) result.spoke[key] = {};
          result.spoke[key][side] = incentive;
        });
      }
    });

  return result;
};

export const getAaveV4MerkleCampaigns = async (chainId: NetworkNumber): Promise<AaveV4MerklRewardMap> => {
  try {
    const opportunities = await fetchAllMerklOpportunities({
      mainProtocolId: 'aave',
      type: 'AAVE_V4_HUB_SUPPLY,AAVE_V4_HUB_BORROW,AAVE_V4_SPOKE_SUPPLY,AAVE_V4_SPOKE_BORROW',
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

  return {
    ...asset,
    spokeSupplyIncentives: spokeScoped?.supply ? [...baseSupply, spokeScoped.supply] : baseSupply,
    spokeBorrowIncentives: spokeScoped?.borrow ? [...baseBorrow, spokeScoped.borrow] : baseBorrow,
    hubSupplyIncentives: hubScoped?.supply ? [...baseSupply, hubScoped.supply] : baseSupply,
    hubBorrowIncentives: hubScoped?.borrow ? [...baseBorrow, hubScoped.borrow] : baseBorrow,
  };
};
