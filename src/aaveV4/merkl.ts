import { aprToApy } from '../moneymarket';
import { LONGER_TIMEOUT } from '../services/utils';
import {
  AaveV4MerklRewardMap,
  AaveV4ReserveAssetData,
  IncentiveData,
  IncentiveKind,
  MerklOpportunity,
  OpportunityAction,
  OpportunityStatus,
} from '../types';
import { NetworkNumber } from '../types/common';

/**
 * Merkl tags Aave V4 reward campaigns by scope via the `type` field:
 *   - AAVE_V4_HUB_SUPPLY / AAVE_V4_HUB_BORROW   → reward tied to a hub (matched per underlying token)
 *   - AAVE_V4_SPOKE_SUPPLY / AAVE_V4_SPOKE_BORROW → reward tied to a spoke (matched per spoke contract + underlying)
 * Hub campaigns identify the underlying via `tokens[0]`; spoke campaigns identify the spoke via `explorerAddress`.
 */

const spokeKey = (spokeAddress: string, underlying: string) => `${spokeAddress.toLowerCase()}_${underlying.toLowerCase()}`;

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

export const getAaveV4MerkleCampaigns = async (chainId: NetworkNumber): Promise<AaveV4MerklRewardMap> => {
  const result: AaveV4MerklRewardMap = { hub: {}, spoke: {} };
  try {
    // TEMP staging QA (DEV-12653): revert to https://fe.defisaver.com/api/merkl before merge
    const res = await fetch('https://stage.defisaver.com/dev-12653-merkl-auth-api/api/merkl/opportunities?mainProtocolId=aave', {
      signal: AbortSignal.timeout(LONGER_TIMEOUT),
    });
    if (!res.ok) throw new Error('Failed to fetch Aave V4 Merkle campaigns');
    const opportunities = await res.json() as MerklOpportunity[];

    opportunities
      .filter((o) => o.chainId === chainId)
      .filter((o) => o.status === OpportunityStatus.LIVE)
      .filter((o) => typeof o.type === 'string' && o.type.startsWith('AAVE_V4_'))
      .forEach((o) => {
        const underlying = o.tokens?.[0]?.address?.toLowerCase();
        if (!underlying) return;

        const side: 'supply' | 'borrow' = o.action === OpportunityAction.BORROW ? 'borrow' : 'supply';
        const incentive = buildIncentive(o);

        if (o.type.includes('HUB')) {
          if (!result.hub[underlying]) result.hub[underlying] = {};
          result.hub[underlying][side] = incentive;
        } else if (o.type.includes('SPOKE')) {
          const spokeAddress = o.explorerAddress?.toLowerCase();
          if (!spokeAddress) return;
          const key = spokeKey(spokeAddress, underlying);
          if (!result.spoke[key]) result.spoke[key] = {};
          result.spoke[key][side] = incentive;
        }
      });

    return result;
  } catch (e) {
    console.error('Failed to fetch Aave V4 Merkle campaigns', e);
    return result;
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

  const spokeScoped = (spokeAddress && underlying) ? campaigns.spoke[spokeKey(spokeAddress, underlying)] : undefined;
  const hubScoped = underlying ? campaigns.hub[underlying] : undefined;

  return {
    ...asset,
    spokeSupplyIncentives: spokeScoped?.supply ? [...baseSupply, spokeScoped.supply] : baseSupply,
    spokeBorrowIncentives: spokeScoped?.borrow ? [...baseBorrow, spokeScoped.borrow] : baseBorrow,
    hubSupplyIncentives: hubScoped?.supply ? [...baseSupply, hubScoped.supply] : baseSupply,
    hubBorrowIncentives: hubScoped?.borrow ? [...baseBorrow, hubScoped.borrow] : baseBorrow,
  };
};
