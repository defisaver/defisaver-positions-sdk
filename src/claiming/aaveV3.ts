import { Client } from 'viem';
import Dec from 'decimal.js';
import { EthAddress, NetworkNumber } from '../types/common';
import { ClaimableToken, ClaimType } from '../types/claiming';
import {
  AaveIncentiveDataProviderV3ContractViem,
  AaveRewardsControllerViem,
} from '../contracts';
import { compareAddresses, getEthAmountForDecimals, wethToEth } from '../services/utils';

type AaveReward = {
  amount: string;
  symbol: string;
  underlyingAsset: string;
  rewardTokenAddress: string;
  aTokenAddresses: string[];
};

/**
 * won't cover all cases
 */
export const getAaveUnderlyingSymbol = (_symbol = '') => {
  let symbol = _symbol
    .replace(/^aEthLido/, '')
    .replace(/^aEthEtherFi/, '')
    .replace(/^aEth/, '')
    .replace(/^aArb/, '')
    .replace(/^aOpt/, '')
    .replace(/^aBas/, '');
  if (symbol.startsWith('a')) symbol = symbol.slice(1);
  return wethToEth(symbol);
};

const mapAaveRewardsToClaimableTokens = (aaveRewards: AaveReward[], marketAddress: EthAddress, walletAddress: EthAddress) => aaveRewards.map(reward => ({
  symbol: reward.symbol,
  amount: reward.amount,
  claimType: ClaimType.AAVE_REWARDS as const,
  tokenAddress: reward.rewardTokenAddress as EthAddress,
  underlyingSymbol: reward.underlyingAsset,
  walletAddress,
  label: 'AAVE Rewards',
  additionalClaimFields: {
    marketAddress,
    aTokenAddresses: reward.aTokenAddresses,
    isAaveToken: reward.symbol.startsWith('a'),
  },
}));

export async function getUnclaimedRewardsForAllMarkets(
  provider: Client,
  network: NetworkNumber,
  walletAddress: EthAddress,
  marketAddress: EthAddress,
): Promise<ClaimableToken[]> {
  const contract = AaveIncentiveDataProviderV3ContractViem(provider, network);
  const tokensData = await contract.read.getUserReservesIncentivesData([marketAddress, walletAddress]);
  const allTokensDataArrays = tokensData.reduce((acc: any[], val) => {
    acc.push(val.aTokenIncentivesUserData.userRewardsInformation);
    acc.push(val.vTokenIncentivesUserData.userRewardsInformation);
    return acc;
  }, []);
  const allATokens = tokensData.reduce((acc, val) => {
    acc.push(val.aTokenIncentivesUserData.tokenAddress);
    acc.push(val.vTokenIncentivesUserData.tokenAddress);
    return acc;
  }, [] as string[]);
  // array of rewards for each market (aToken/vToken)
  // reward can be any token like wstETH, but also aToken like aWETH
  const aaveRewardsController = AaveRewardsControllerViem(provider, network);
  const rewardsPerAAsset = await Promise.all(allATokens.map(
    (token: string) => aaveRewardsController.read.getAllUserRewards([[token as EthAddress], walletAddress])));

  // match amounts to token symbol, parse decimal amounts
  const rewardsPerAAssetWithInfo = rewardsPerAAsset.map((rewardForAAsset, aaIndex) => {
    const rewardsList = rewardForAAsset[0];
    const amounts = rewardForAAsset[1];

    const rewardsDataArraysForAAsset = allTokensDataArrays[aaIndex];
    const aTokenAddress = allATokens[aaIndex];
    return rewardsList.map((rewardTokenAddress, rewardIndex) => {
      const dataArrIndex = rewardsDataArraysForAAsset.findIndex((arr: { rewardTokenAddress: string | undefined; }) => compareAddresses(arr.rewardTokenAddress, rewardTokenAddress));
      const amountWei = amounts[rewardIndex];
      const amount = getEthAmountForDecimals(amountWei.toString(), rewardsDataArraysForAAsset[dataArrIndex]?.rewardTokenDecimals);
      const symbol = rewardsDataArraysForAAsset[dataArrIndex]?.rewardTokenSymbol || '';
      const underlyingAsset = getAaveUnderlyingSymbol(symbol);
      return ({
        amount,
        symbol,
        underlyingAsset,
        rewardTokenAddress,
        aTokenAddress,
      });
    });
  });

  // sum all unclaimed rewards of all markets per each token
  // (e.g. how much awstETH is claimable in total from both aUSDC and awstETH markets)
  const totalUnclaimedPerRewardToken: Record<string, any> = {};
  rewardsPerAAssetWithInfo
    .flat()
    .forEach(({
      amount, symbol, underlyingAsset, rewardTokenAddress, aTokenAddress,
    }) => {
      if (+amount > 0) {
        if (!totalUnclaimedPerRewardToken[symbol]) {
          totalUnclaimedPerRewardToken[symbol] = {
            amount, symbol, underlyingAsset, rewardTokenAddress, aTokenAddresses: [aTokenAddress],
          };
        } else {
          totalUnclaimedPerRewardToken[symbol].amount =
                new Dec(totalUnclaimedPerRewardToken[symbol].amount).add(amount).toString();
          totalUnclaimedPerRewardToken[symbol].aTokenAddresses.push(aTokenAddress);
        }
      }
    }, []);

  return mapAaveRewardsToClaimableTokens(Object.values(totalUnclaimedPerRewardToken), marketAddress, walletAddress);
}

export async function getMeritUnclaimedRewards(account: EthAddress, network: NetworkNumber, acceptMorpho: boolean = true): Promise<ClaimableToken[]> {
  const res = await fetch(`https://api.merkl.xyz/v4/users/${account}/rewards?chainId=${network}`,
    { signal: AbortSignal.timeout(3000) });
  const data = await res.json();

  const claimableTokens: ClaimableToken[] = [];

  data.forEach((item: { rewards: any[]; }) => {
    item.rewards.forEach(reward => {
      const {
        token,
        amount,
        claimed,
        proofs,
      } = reward;

      const isTokenMorpho = token.symbol === 'MORPHO';
      if (!token || !token.symbol || amount === '0' || (isTokenMorpho && !acceptMorpho)) return;

      const unclaimedAmount = new Dec(amount).minus(claimed || 0).toString();
      if (unclaimedAmount === '0') return;

      const unclaimed = getEthAmountForDecimals(unclaimedAmount, token.decimals);

      claimableTokens.push({
        claimType: ClaimType.AAVE_MERIT_REWARDS,
        amount: unclaimed,
        symbol: token.symbol,
        tokenAddress: token.address,
        walletAddress: account,
        label: 'AAVE Merit Rewards',
        underlyingSymbol: getAaveUnderlyingSymbol(token.symbol),
        additionalClaimFields: {
          accumulated: amount,
          proof: proofs,
          decimals: token.decimals,
          unclaimed: unclaimedAmount,
        },
      });
    });
  });

  return claimableTokens;
}