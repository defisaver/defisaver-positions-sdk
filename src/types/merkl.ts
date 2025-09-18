import { EthAddress } from './common';

export enum OpportunityAction {
  LEND = 'LEND',
  BORROW = 'BORROW',
}

export enum OpportunityStatus {
  LIVE = 'LIVE',
  PAST = 'PAST',
  UPCOMING = 'UPCOMING',
}

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