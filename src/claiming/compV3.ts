import { Client } from 'viem';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { EthAddress, NetworkNumber } from '../types/common';
import { CompV3ViewContractViem } from '../contracts';
import { ClaimType } from '../types/claiming';

export const getCompoundV3Rewards = async (provider: Client, network: NetworkNumber, user: EthAddress, market: any) => {
  // TODO type ??
  const compV3View = CompV3ViewContractViem(provider, network);
  const rewards = await compV3View.read.getRewardsOwed([market, user]);
  if (!rewards || !rewards || rewards.owed.toString() === '0' || getAssetInfoByAddress(rewards.token).symbol !== 'COMP') return [];
  return [{
    symbol: 'COMP',
    underlyingSymbol: 'COMP',
    // @ts-ignore
    tokenAddress: rewards.token,
    // @ts-ignore
    amount: assetAmountInEth(rewards.owed.toString() || 0, 'COMP'),
    walletAddress: user,
    label: 'Compound V3',
    claimType: ClaimType.COMPOUND_V3_COMP,
    additionalClaimFields: {
      marketAddress: market,
    },
  }];
};