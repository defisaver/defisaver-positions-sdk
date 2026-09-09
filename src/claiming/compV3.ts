import { BaseError, Client, ContractFunctionRevertedError } from 'viem';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { EthAddress, NetworkNumber } from '../types/common';
import { CompV3ViewContractViem } from '../contracts';
import { ClaimType } from '../types/claiming';

// `CometRewards.NotSupported(address)`. CometRewards reverts with it for any Comet that has no
// `rewardConfig` set - such a market never accrues COMP, so there is nothing to claim.
// Not decodable by name, since the error lives in CometRewards' ABI and we call through CompV3View.
const NOT_SUPPORTED_ERROR_SIG = '0x9c58e3b6';

const isMarketWithoutRewardsConfig = (err: unknown) => {
  if (!(err instanceof BaseError)) return false;
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
  return revert instanceof ContractFunctionRevertedError && !!revert.raw?.startsWith(NOT_SUPPORTED_ERROR_SIG);
};

export const getCompoundV3Rewards = async (provider: Client, network: NetworkNumber, user: EthAddress, market: any) => {
  const compV3View = CompV3ViewContractViem(provider, network);
  const rewards = await compV3View.read.getRewardsOwed([market, user]).catch((err) => {
    if (isMarketWithoutRewardsConfig(err)) return null;
    throw err;
  });
  if (!rewards || rewards.owed.toString() === '0' || getAssetInfoByAddress(rewards.token, network).symbol !== 'COMP') return [];
  return [{
    symbol: 'COMP',
    underlyingSymbol: 'COMP',
    tokenAddress: rewards.token,
    amount: assetAmountInEth(rewards.owed.toString() || 0, 'COMP'),
    walletAddress: user,
    label: 'Compound V3',
    claimType: ClaimType.COMPOUND_V3_COMP,
    additionalClaimFields: {
      marketAddress: market,
    },
  }];
};