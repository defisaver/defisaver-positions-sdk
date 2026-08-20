import { aprToApy } from '../moneymarket';
import { LONGER_TIMEOUT } from '../services/utils';
import {
  FluidMarketData,
  FluidMerklRewardMap,
  IncentiveData,
  IncentiveEligibilityId,
  IncentiveKind,
  MerklOpportunity,
  NetworkNumber,
  OpportunityStatus,
} from '../types';

/**
 * Merkl tags Fluid vault-scoped reward campaigns via the opportunity `type` field:
 *   - FLUIDVAULT_COLLATERAL → reward for supplying collateral to the vault
 *   - FLUIDVAULT_BORROW     → reward for borrowing from the vault
 * (ERC20LOGPROCESSOR campaigns target fToken earn positions rather than vaults, so they don't
 * belong on vault market data.)
 *
 * A campaign identifies its vault via `identifier` — the vault address. Conditional campaigns
 * append a marker to it (e.g. `0x5668…eeaBORROW_BL`, excluding holders who borrow the reward
 * asset elsewhere); those are still attached, with the full identifier passed through as
 * `eligibilityId` so a curated check in EligibilityMapping can gate them in net APY — unknown
 * ids apply unconditionally, mirroring Aave V3. Whitelist-gated campaigns only accrue to
 * whitelisted addresses, so they are skipped rather than advertised to every user.
 */
export const FLUID_MERKL_OPPORTUNITY_TYPES = ['FLUIDVAULT_COLLATERAL', 'FLUIDVAULT_BORROW'] as const;

// '0x' + 20-byte vault address; conditional campaigns append a marker after it
const VAULT_ADDRESS_LENGTH = 42;

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

export const buildFluidMerklRewardMap = (opportunities: MerklOpportunity[], chainId: NetworkNumber): FluidMerklRewardMap => {
  const result: FluidMerklRewardMap = {};

  opportunities
    .filter((o) => o.chainId === chainId)
    .filter((o) => o.status === OpportunityStatus.LIVE)
    .filter((o) => (FLUID_MERKL_OPPORTUNITY_TYPES as readonly string[]).includes(o.type))
    .filter((o) => !o.identifier?.includes('WHITELIST'))
    .forEach((o) => {
      const vaultAddress = o.identifier?.slice(0, VAULT_ADDRESS_LENGTH).toLowerCase();
      if (!vaultAddress || vaultAddress.length !== VAULT_ADDRESS_LENGTH) return;
      if (!result[vaultAddress]) result[vaultAddress] = { supply: [], borrow: [] };
      result[vaultAddress][o.type === 'FLUIDVAULT_BORROW' ? 'borrow' : 'supply'].push(buildMerklIncentive(o));
    });

  return result;
};

/**
 * Fetches live vault-scoped Fluid campaigns for the chain, keyed by vault address. Never throws —
 * on any failure it returns an empty map, so Merkl being down can't break market data. The query
 * is narrowed by `type=` and capped at `items=100` because Merkl paginates at 20 items by default.
 */
export const getFluidMerklCampaigns = async (chainId: NetworkNumber): Promise<FluidMerklRewardMap> => {
  try {
    const res = await fetch(`https://fe.defisaver.com/api/merkl/opportunities?mainProtocolId=fluid&type=${FLUID_MERKL_OPPORTUNITY_TYPES.join(',')}&status=LIVE&items=100`, {
      signal: AbortSignal.timeout(LONGER_TIMEOUT),
    });
    if (!res.ok) throw new Error('Failed to fetch Fluid Merkl campaigns');
    const opportunities = await res.json();
    return buildFluidMerklRewardMap(Array.isArray(opportunities) ? opportunities : [], chainId);
  } catch (e) {
    console.error('Failed to fetch Fluid Merkl campaigns', e);
    return {};
  }
};

/**
 * Appends the vault's Merkl campaigns to its assets' incentive arrays — supply rewards on every
 * suppliable asset and borrow rewards on every borrowable one. Smart collateral/debt vaults hold
 * the position across both pair tokens, so the pro-rata reward APY applies to each side's value.
 */
export const attachFluidMerklIncentives = (marketData: FluidMarketData, campaigns: FluidMerklRewardMap): FluidMarketData => {
  const vaultCampaigns = campaigns[marketData.marketData.marketAddress?.toLowerCase()];
  if (!vaultCampaigns || (!vaultCampaigns.supply.length && !vaultCampaigns.borrow.length)) return marketData;

  const assetsData = Object.fromEntries(Object.entries(marketData.assetsData).map(([symbol, asset]) => [symbol, {
    ...asset,
    supplyIncentives: asset.canBeSupplied ? [...asset.supplyIncentives, ...vaultCampaigns.supply] : asset.supplyIncentives,
    borrowIncentives: asset.canBeBorrowed ? [...asset.borrowIncentives, ...vaultCampaigns.borrow] : asset.borrowIncentives,
  }]));

  return { ...marketData, assetsData };
};
