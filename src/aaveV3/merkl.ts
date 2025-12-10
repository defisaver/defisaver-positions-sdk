import { aprToApy } from '../moneymarket';
import { DEFAULT_TIMEOUT, wethToEth } from '../services/utils';
import {
  MerkleRewardMap, MerklOpportunity, OpportunityAction, OpportunityStatus,
} from '../types';
import { EthAddress, NetworkNumber } from '../types/common';

export const getAaveUnderlyingSymbol = (_symbol = '') => {
  let symbol = _symbol
    .replace(/^aEthLido/, '')
    .replace(/^aEthEtherFi/, '')
    .replace(/^aEth/, '')
    .replace(/^aArb/, '')
    .replace(/^aOpt/, '')
    .replace(/^aBas/, '')
    .replace(/^aLin/, '');
  if (symbol.startsWith('a')) symbol = symbol.slice(1);
  return wethToEth(symbol);
};

/**
 * aEthLidoUSDC -> aUSDC
 * USDC -> USDC
 */
export const formatAaveAsset = (_symbol: string) => {
  if (_symbol.startsWith('a')) {
    return `a${getAaveUnderlyingSymbol(_symbol)}`;
  }
  return _symbol;
};

export const getMerkleCampaigns = async (chainId: NetworkNumber): Promise<MerkleRewardMap> => {
  console.log('Fetching Merkle campaigns');
  try {
    const res = await fetch('https://api.merkl.xyz/v4/opportunities?mainProtocolId=aave', {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });
    if (!res.ok) throw new Error('Failed to fetch Merkle campaigns');
    const opportunities = await res.json() as MerklOpportunity[];
    const relevantOpportunities = opportunities
      .filter((o: MerklOpportunity) => o.chainId === chainId)
      .filter((o: MerklOpportunity) => o.status === OpportunityStatus.LIVE);
    return relevantOpportunities.reduce((acc, opportunity) => {
      const rewardToken = opportunity.rewardsRecord.breakdowns[0].token;
      const description = `Eligible for ${formatAaveAsset(rewardToken.symbol)} rewards through Merkl. ${opportunity.description ? `\n${opportunity.description}` : ''}`;
      if (opportunity.action === OpportunityAction.LEND && opportunity.explorerAddress) {
        const supplyAToken = opportunity.explorerAddress?.toLowerCase() as EthAddress;
        if (!acc[supplyAToken]) acc[supplyAToken] = {};
        acc[supplyAToken].supply = {
          apy: aprToApy(opportunity.apr),
          // rewardToken: rewardToken.address,
          rewardTokenSymbol: rewardToken.symbol,
          description,
          identifier: opportunity.identifier,
        };
      }
      if (opportunity.action === OpportunityAction.BORROW && opportunity.explorerAddress) {
        const borrowAToken = opportunity.explorerAddress?.toLowerCase() as EthAddress;
        if (!acc[borrowAToken]) acc[borrowAToken] = {};
        acc[borrowAToken].borrow = {
          apy: aprToApy(opportunity.apr),
          // rewardToken: rewardToken.address,
          rewardTokenSymbol: rewardToken.symbol,
          description,
          identifier: opportunity.identifier,
        };
      }
      return acc;
    }, {} as MerkleRewardMap);
  } catch (e) {
    console.error('Failed to fetch Merkle campaigns', e);
    return {};
  }
};

