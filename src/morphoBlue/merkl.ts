import { aprToApy } from '../moneymarket';
import { fetchAllMerklOpportunities } from '../services/merkl';
import {
  IncentiveData,
  IncentiveKind,
  MerklOpportunity,
  MorphoBlueMarketData,
  MorphoBlueMarketInfo,
  NetworkNumber,
  OpportunityStatus,
} from '../types';

/**
 * Merkl tags Morpho Blue market-level reward campaigns via the opportunity `type` field:
 *   - MORPHOSUPPLY     → reward for supplying the market's loan asset
 *   - MORPHOCOLLATERAL → reward for depositing the market's collateral asset
 *   - MORPHOBORROW     → reward for borrowing the market's loan asset
 * (MORPHOVAULT/ERC20LOGPROCESSOR are MetaMorpho vault campaigns and MORPHOSUPPLY_SINGLETOKEN is
 * token-wide rather than market-scoped, so none of them belong on per-market data.)
 *
 * A campaign identifies its market via `identifier` — the first 20 bytes of the 32-byte Morpho
 * market id, formatted as a checksummed address. Whitelist-gated campaigns append a marker to that
 * identifier (e.g. `0x54cf…c46WHITELIST_CAMPAIGN`); their rewards only accrue to whitelisted
 * addresses, so they are skipped rather than advertised to every user.
 */
export enum MorphoBlueMerklOpportunityType {
  Supply = 'MORPHOSUPPLY',
  Collateral = 'MORPHOCOLLATERAL',
  Borrow = 'MORPHOBORROW',
}

const MERKL_DESCRIPTION_MARKER = 'through Merkl';

// '0x' + first 20 bytes of the market id
const MARKET_ID_PREFIX_LENGTH = 42;

const buildMerklIncentive = (opportunity: MerklOpportunity): IncentiveData => {
  const token = opportunity.rewardsRecord?.breakdowns?.[0]?.token?.symbol || opportunity.tokens?.[0]?.symbol || '';
  return {
    apy: aprToApy(opportunity.apr),
    token,
    incentiveKind: IncentiveKind.Reward,
    description: `Eligible for ${token} rewards through Merkl.${opportunity.description ? `\n${opportunity.description}` : ''}`,
  };
};

const withoutMerklIncentives = (incentives: IncentiveData[] = []) => incentives
  .filter(({ description }) => !description?.includes(MERKL_DESCRIPTION_MARKER));

/**
 * Appends the given live Merkl campaigns for the market to its `assetsData` incentive arrays
 * (collateral supply / loan supply / loan borrow). Existing Merkl incentives are replaced rather
 * than duplicated, so re-applying on refreshed data is safe.
 */
export const addMorphoBlueMerklOpportunitiesToMarketInfo = (
  marketInfo: MorphoBlueMarketInfo,
  selectedMarket: MorphoBlueMarketData,
  chainId: NetworkNumber,
  opportunities: MerklOpportunity[],
): MorphoBlueMarketInfo => {
  const marketIdPrefix = (selectedMarket.marketId || '').slice(0, MARKET_ID_PREFIX_LENGTH).toLowerCase();
  const collateralAsset = marketInfo.assetsData[marketInfo.collateralToken];
  const loanAsset = marketInfo.assetsData[marketInfo.loanToken];
  if (marketIdPrefix.length !== MARKET_ID_PREFIX_LENGTH || !collateralAsset || !loanAsset) return marketInfo;

  const relevant = opportunities.filter((o) => o.chainId === chainId
    && o.status === OpportunityStatus.LIVE
    && Object.values(MorphoBlueMerklOpportunityType).includes(o.type as MorphoBlueMerklOpportunityType)
    // a suffixed identifier marks a whitelist-gated campaign — skip those
    && o.identifier?.length === MARKET_ID_PREFIX_LENGTH
    && o.identifier.toLowerCase() === marketIdPrefix);
  if (!relevant.length) return marketInfo;

  const incentivesByType = (type: MorphoBlueMerklOpportunityType) => relevant.filter((o) => o.type === type).map(buildMerklIncentive);
  const collateralSupply = incentivesByType(MorphoBlueMerklOpportunityType.Collateral);
  const loanSupply = incentivesByType(MorphoBlueMerklOpportunityType.Supply);
  const loanBorrow = incentivesByType(MorphoBlueMerklOpportunityType.Borrow);

  return {
    ...marketInfo,
    assetsData: {
      ...marketInfo.assetsData,
      [marketInfo.collateralToken]: {
        ...collateralAsset,
        supplyIncentives: [...withoutMerklIncentives(collateralAsset.supplyIncentives), ...collateralSupply],
      },
      [marketInfo.loanToken]: {
        ...loanAsset,
        supplyIncentives: [...withoutMerklIncentives(loanAsset.supplyIncentives), ...loanSupply],
        borrowIncentives: [...withoutMerklIncentives(loanAsset.borrowIncentives), ...loanBorrow],
      },
    },
  };
};

/**
 * Fetches live market-scoped Morpho Blue campaigns for all chains. Never throws — on any failure
 * it returns an empty list, so Merkl being down can't break market data.
 */
export const getMorphoBlueMerklOpportunities = async (): Promise<MerklOpportunity[]> => {
  try {
    return await fetchAllMerklOpportunities({
      mainProtocolId: 'morpho',
      type: Object.values(MorphoBlueMerklOpportunityType).join(','),
      status: OpportunityStatus.LIVE,
    });
  } catch (e) {
    console.error('Failed to fetch Morpho Blue Merkl campaigns', e);
    return [];
  }
};

/**
 * Fetches live Merkl campaigns and appends the ones for the market to its `assetsData` incentive
 * arrays. Never throws — on any failure the market info is returned unchanged.
 */
export const addMorphoBlueMerklRewardsToMarketInfo = async (
  marketInfo: MorphoBlueMarketInfo,
  selectedMarket: MorphoBlueMarketData,
  network: NetworkNumber,
): Promise<MorphoBlueMarketInfo> => addMorphoBlueMerklOpportunitiesToMarketInfo(marketInfo, selectedMarket, network, await getMorphoBlueMerklOpportunities());
