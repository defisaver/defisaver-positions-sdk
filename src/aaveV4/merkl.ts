import { aprToApy } from '../moneymarket';
import { LONGER_TIMEOUT } from '../services/utils';
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
 *   - AAVE_V4_HUB_SUPPLY / AAVE_V4_HUB_BORROW   → reward tied to a hub (matched per hub contract + underlying)
 *   - AAVE_V4_SPOKE_SUPPLY / AAVE_V4_SPOKE_BORROW → reward tied to a spoke (matched per spoke contract + underlying)
 * Campaigns identify the underlying via `tokens[0]` and the scoping contract (the hub or spoke) via
 * `explorerAddress`. The same underlying exists on several hubs (e.g. USDC on Prime and Paxos), so a
 * hub campaign matched by underlying alone would leak onto every hub's reserves — a campaign whose
 * `explorerAddress` isn't a contract any fetched reserve points to simply never matches.
 */

const scopeKey = (scopeAddress: string, underlying: string) => `${scopeAddress.toLowerCase()}_${underlying.toLowerCase()}`;

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
      const underlying = o.tokens?.[0]?.address?.toLowerCase();
      if (!underlying) return;

      const scopeAddress = o.explorerAddress?.toLowerCase();
      if (!scopeAddress) return;

      const side = o.action === OpportunityAction.BORROW ? IncentiveSide.Borrow : IncentiveSide.Supply;
      const incentive = buildIncentive(o);
      const key = scopeKey(scopeAddress, underlying);

      if (o.type.includes('HUB')) {
        if (!result.hub[key]) result.hub[key] = {};
        result.hub[key][side] = incentive;
      } else if (o.type.includes('SPOKE')) {
        if (!result.spoke[key]) result.spoke[key] = {};
        result.spoke[key][side] = incentive;
      }
    });

  return result;
};

export const getAaveV4MerkleCampaigns = async (chainId: NetworkNumber): Promise<AaveV4MerklRewardMap> => {
  try {
    const res = await fetch('https://fe.defisaver.com/api/merkl/opportunities?mainProtocolId=aave&type=AAVE_V4_HUB_SUPPLY,AAVE_V4_HUB_BORROW,AAVE_V4_SPOKE_SUPPLY,AAVE_V4_SPOKE_BORROW', {
      signal: AbortSignal.timeout(LONGER_TIMEOUT),
    });
    if (!res.ok) throw new Error('Failed to fetch Aave V4 Merkle campaigns');
    const opportunities = await res.json() as MerklOpportunity[];
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
  const underlying = asset.underlying?.toLowerCase();
  const baseSupply = asset.supplyIncentives || [];
  const baseBorrow = asset.borrowIncentives || [];

  const spokeScoped = (spokeAddress && underlying) ? campaigns.spoke[scopeKey(spokeAddress, underlying)] : undefined;
  const hubScoped = (asset.hub && underlying) ? campaigns.hub[scopeKey(asset.hub, underlying)] : undefined;

  return {
    ...asset,
    spokeSupplyIncentives: spokeScoped?.supply ? [...baseSupply, spokeScoped.supply] : baseSupply,
    spokeBorrowIncentives: spokeScoped?.borrow ? [...baseBorrow, spokeScoped.borrow] : baseBorrow,
    hubSupplyIncentives: hubScoped?.supply ? [...baseSupply, hubScoped.supply] : baseSupply,
    hubBorrowIncentives: hubScoped?.borrow ? [...baseBorrow, hubScoped.borrow] : baseBorrow,
  };
};
