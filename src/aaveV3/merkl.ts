import { aprToApy } from '../moneymarket';
import { DEFAULT_TIMEOUT, wethToEth } from '../services/utils';
import { EthAddress, NetworkNumber } from '../types/common';

enum OpportunityAction {
  LEND = 'LEND',
  BORROW = 'BORROW',
}

enum OpportunityStatus {
  LIVE = 'LIVE',
  PAST = 'PAST',
  UPCOMING = 'UPCOMING',
}

type MerklOpportunity = {
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

type RewardInfo = { apy: string; rewardTokenSymbol: string, description: string };
type MerkleRewardMap = Record<EthAddress, { supply?: RewardInfo; borrow?: RewardInfo }>;

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
        };
      }
      return acc;
    }, {} as MerkleRewardMap);
  } catch (e) {
    console.error('Failed to fetch Merkle campaigns', e);
    return {};
  }
};

