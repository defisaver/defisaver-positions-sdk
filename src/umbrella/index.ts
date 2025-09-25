import { Client } from 'viem';
import { AaveUmbrellaViewViem, AaveV3ViewContractViem } from '../contracts';
import { EthAddress, NetworkNumber } from '../types/common';
import { compareAddresses, convertHybridArraysToObjects, getEthAmountForDecimals } from '../services/utils';
import { findMatching, tokenEntries } from './umbrellaUtils';

const umbrella = '0xD400fc38ED4732893174325693a63C30ee3881a8';
const aaveOracle = '0x54586bE62E3c3580375aE3723C145253060Ca0C2';

export const getUmbrellaData = async (provider: Client, network: NetworkNumber, address: EthAddress) => {
  const umbrellaView = AaveUmbrellaViewViem(provider, network);
  const aaveV3View = AaveV3ViewContractViem(provider, network);
  const [tokensAggregatedData, additionalUmbrellaStakingData, userAggregatedData] = await Promise.all([
    umbrellaView.read.getTokensAggregatedData([umbrella, aaveOracle]),
    aaveV3View.read.getAdditionalUmbrellaStakingData([umbrella, address]),
    umbrellaView.read.getUserAggregatedData([umbrella, address]),
  ]);

  return Object.fromEntries(
    tokenEntries.map(([symbol, tokenAddr]) => {
      // @ts-ignore
      const fromTokens = convertHybridArraysToObjects(findMatching(tokensAggregatedData, tokenAddr));
      // @ts-ignore
      const fromUser = convertHybridArraysToObjects(findMatching(userAggregatedData, tokenAddr));
      // @ts-ignore
      const fromAdditionalData = convertHybridArraysToObjects(findMatching(additionalUmbrellaStakingData, tokenAddr));
      const data = {
        ...fromTokens,
        ...fromUser,
        ...fromAdditionalData,
        account: {
          stakeUserBalance: fromUser?.stakeUserBalance || '0',
          rewardsTokenUserData: convertHybridArraysToObjects(fromUser?.rewardsTokenUserData) || [],
          userCooldownAmount: fromAdditionalData?.userCooldownAmount || '0',
          userEndOfCooldown: fromAdditionalData?.userEndOfCooldown || '0',
          userWithdrawalWindow: fromAdditionalData?.userWithdrawalWindow || '0',
        },
      };

      const stakeTokenData = data.stakeTokenData;

      return [symbol, {
        ...data,
        stakeTokenData: { ...stakeTokenData, price: getEthAmountForDecimals(stakeTokenData.price, 8) },
        stkTokenToWaTokenRate: getEthAmountForDecimals(data.stkTokenToWaTokenRate, stakeTokenData.decimals),
        waTokenToATokenRate: getEthAmountForDecimals(data.waTokenToATokenRate, stakeTokenData.decimals),
        totalShares: getEthAmountForDecimals(data.totalShares, stakeTokenData.decimals),
        totalAssets: getEthAmountForDecimals(data.totalAssets, stakeTokenData.decimals),
        targetLiquidity: getEthAmountForDecimals(data.targetLiquidity, stakeTokenData.decimals),
        rewardsTokenData: data.rewardsTokenData.map((tokenData: { rewardTokenData: { price: string | number; }; }) => ({ ...tokenData, rewardTokenData: { ...tokenData.rewardTokenData, price: getEthAmountForDecimals(tokenData.rewardTokenData.price, 8) } })),
        rewardsEmissionRates: data.rewardsEmissionRates.map((rate: string, i: number) => {
          const tokenData = data.rewardsTokenData[i].rewardTokenData;
          return getEthAmountForDecimals(rate, tokenData.decimals);
        }),
        account: {
          ...data.account,
          stakeUserBalance: getEthAmountForDecimals(data.account.stakeUserBalance, stakeTokenData.decimals),
          userCooldownAmount: getEthAmountForDecimals(data.account.userCooldownAmount, stakeTokenData.decimals),
          rewardsTokenUserData: data.account.rewardsTokenUserData.map((reward: any) => {
            const tokenData = data.rewardsTokenData.find((tknData: { rewardTokenData: { token: string | undefined; }; }) => compareAddresses(tknData.rewardTokenData.token, reward.reward));
            return ({
              ...reward,
              currentReward: getEthAmountForDecimals(reward.currentReward, tokenData.rewardTokenData.decimals),
            });
          }),
        },
      }];
    }),
  );
};