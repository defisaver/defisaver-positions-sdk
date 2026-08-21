import { getAssetInfoByAddress } from '@defisaver/tokens';
import { aprToApy } from '../moneymarket';
import { fetchAllMerklOpportunities } from '../services/merkl';
import { compareAddresses, wethToEth } from '../services/utils';
import {
  CompoundV3AssetData,
  IncentiveData,
  IncentiveEligibilityId,
  IncentiveKind,
  MerklOpportunity,
  NetworkNumber,
  OpportunityAction,
  OpportunityStatus,
} from '../types';

/**
 * Merkl tags Compound V3 reward campaigns with COMPOUND_V3_* opportunity types (e.g.
 * COMPOUND_V3_BORROW_FROM_COLLATERAL) and identifies the comet via `explorerAddress`. Campaign
 * identifiers are opaque hashes, passed through as `eligibilityId` so conditional campaigns —
 * like borrow-from-collateral ones, whose reward is min(collateral * LTV, borrow amount) — can
 * be gated and sized by a curated check in EligibilityMapping; unknown ids apply
 * unconditionally, mirroring Aave V3.
 */
export const getCompoundV3MerklOpportunities = async (): Promise<MerklOpportunity[]> => {
  try {
    return await fetchAllMerklOpportunities({
      mainProtocolId: 'compound-v3',
      status: OpportunityStatus.LIVE,
    });
  } catch (e) {
    console.error('Failed to fetch Compound V3 Merkl campaigns', e);
    return [];
  }
};

const buildMerklIncentive = (opportunity: MerklOpportunity): IncentiveData => {
  const token = opportunity.rewardsRecord?.breakdowns?.[0]?.token?.symbol || opportunity.tokens?.[0]?.symbol || '';
  return {
    apy: aprToApy(opportunity.apr),
    token,
    incentiveKind: IncentiveKind.Reward,
    description: `Eligible for ${token} rewards through Merkl.${opportunity.description ? `\n${opportunity.description}` : ''}`,
    eligibilityId: opportunity.identifier as IncentiveEligibilityId,
  };
};

/**
 * Appends the comet's Merkl campaigns to its assets' incentive arrays (mutating them, like the
 * staking incentives are attached). BORROW campaigns land on the base asset — the only borrowable
 * one — while LEND campaigns land on the asset the campaign's first token resolves to.
 */
export const attachCompoundV3MerklIncentives = (
  baseAsset: CompoundV3AssetData,
  collAssets: CompoundV3AssetData[],
  baseMarketAddress: string,
  chainId: NetworkNumber,
  opportunities: MerklOpportunity[],
): void => {
  opportunities
    .filter((o) => o.chainId === chainId
      && o.status === OpportunityStatus.LIVE
      && typeof o.type === 'string' && o.type.startsWith('COMPOUND_V3')
      && o.explorerAddress && compareAddresses(o.explorerAddress, baseMarketAddress))
    .forEach((o) => {
      const incentive = buildMerklIncentive(o);
      if (o.action === OpportunityAction.BORROW) {
        baseAsset.borrowIncentives.push(incentive);
      } else if (o.action === OpportunityAction.LEND) {
        const campaignTokenAddress = o.tokens?.[0]?.address;
        if (!campaignTokenAddress) return;
        const campaignSymbol = wethToEth(getAssetInfoByAddress(campaignTokenAddress, chainId).symbol);
        const target = [baseAsset, ...collAssets].find((asset) => asset.symbol === campaignSymbol);
        target?.supplyIncentives.push(incentive);
      }
    });
};
