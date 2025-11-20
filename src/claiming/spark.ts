import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import Dec from 'decimal.js';
import { Client } from 'viem';
import {
  createViemContractFromConfigFunc,
  SparkIncentiveDataProviderContractViem,
  SparkRewardsControllerViem,
} from '../contracts';
import { EthAddress, NetworkNumber } from '../types/common';
import { ClaimType, SparkAirdropType, SparkRewardsClaimableToken } from '../types/claiming';
import { compareAddresses, getEthAmountForDecimals } from '../services/utils';

const IGNITION_REWARDS = '0xCBA0C0a2a0B6Bb11233ec4EA85C5bFfea33e724d';
const PFL3_REWARDS = '0x7ac96180C4d6b2A328D3a19ac059D0E7Fc3C6d41';

export const fetchSpkAirdropRewards = async (walletAddress: EthAddress) => {
  try {
    const res = await fetch(`https://fe.defisaver.com/api/spark/get-spk-airdrop-rewards/${walletAddress}`,
      { signal: AbortSignal.timeout(3000) });

    if (!res.ok) throw new Error(await res.text());

    return await res.json();
  } catch (err) {
    console.error('External API Error: Error fetching SPK airdrop rewards:', err);
    return [];
  }
};

type CumulativeClaimedSpkAirdropFuncProp = {
  user: string, tokenAddress: string, epoch: number, type: SparkAirdropType,
};

const getCumulativeClaimedSpkAirdrop = async (provider: Client, network: NetworkNumber, data: CumulativeClaimedSpkAirdropFuncProp[]) => {
  const contractIgnition = createViemContractFromConfigFunc('SparkAirdrop', IGNITION_REWARDS)(provider, network);
  const contractPFL = createViemContractFromConfigFunc('SparkAirdrop', PFL3_REWARDS)(provider, network);

  const cumulativeAmounts = await Promise.all(data.map((airdrop) => {
    const {
      user, tokenAddress, epoch, type,
    } = airdrop;
    const contract = type === SparkAirdropType.SPARK_IGNITION ? contractIgnition : contractPFL;
    return contract.read.cumulativeClaimed([user as EthAddress, tokenAddress as EthAddress, BigInt(epoch)]);
  }));

  return cumulativeAmounts.map((amount: bigint, i: number) => assetAmountInEth(amount.toString(), getAssetInfoByAddress(data[i].tokenAddress).symbol).toString());
};

export const fetchSparkAirdropRewards = async (
  provider: Client,
  network: NetworkNumber,
  walletAddresses: EthAddress[],
) => {
  // Fetch all API data in parallel (these are external API calls, can't be batched with multicall)
  const apiDataPromises = walletAddresses.map(address => fetchSpkAirdropRewards(address));
  const apiDataArray = await Promise.all(apiDataPromises);

  // Process API data and collect contract call data
  const allClaimData: Array<{ walletAddress: EthAddress; data: any[] }> = [];
  const contractCallsData: CumulativeClaimedSpkAirdropFuncProp[] = [];

  for (let i = 0; i < walletAddresses.length; i++) {
    const walletAddress = walletAddresses[i];
    const data = apiDataArray[i];

    const falseResponse: boolean = !data;
    const emptyResponse: boolean = data && data.length === 0;
    const singleResponseWithoutAmount: boolean = data && data.length === 1 && !+data[0].amount;

    if (falseResponse || emptyResponse || singleResponseWithoutAmount) {
      allClaimData.push({ walletAddress, data: [] });
      continue;
    }

    // Filter out IGNITION_REWARDS since they are no longer active
    const filteredData = data.filter((rewardInfo: { type: SparkAirdropType; }) => rewardInfo.type !== SparkAirdropType.SPARK_IGNITION);

    allClaimData.push({ walletAddress, data: filteredData });

    // Collect contract call data
    filteredData.forEach((airdropInfo: { wallet_address: any; token_address: any; epoch: any; type: any; }) => {
      contractCallsData.push({
        user: airdropInfo.wallet_address,
        tokenAddress: airdropInfo.token_address,
        epoch: airdropInfo.epoch,
        type: airdropInfo.type,
      });
    });
  }

  // Batch all contract calls
  const cumulativeClaimedAmounts = await getCumulativeClaimedSpkAirdrop(provider, network, contractCallsData);

  // Process results
  const results: Record<string, any[]> = {};
  let contractCallIndex = 0;

  for (const { walletAddress, data } of allClaimData) {
    if (data.length === 0) {
      results[walletAddress.toLowerCase() as EthAddress] = [];
      continue;
    }

    const processedRewards = [];
    for (let i = 0; i < data.length; i++) {
      const rewardInfo = data[i];
      const assetInfo = getAssetInfoByAddress(rewardInfo.token_address);
      const claimedAmount = cumulativeClaimedAmounts[contractCallIndex];
      contractCallIndex++;

      const amount = new Dec(rewardInfo.amount_normalized).minus(claimedAmount).toString();

      if (new Dec(amount).gt('0')) {
        processedRewards.push({
          symbol: assetInfo.symbol,
          underlyingSymbol: assetInfo.symbol,
          amount,
          claimType: ClaimType.SPARK_AIRDROP,
          tokenAddress: rewardInfo.token_address,
          walletAddress: rewardInfo.wallet_address,
          label: 'Spark Airdrop',
          additionalClaimFields: {
            merkleRoot: rewardInfo.root_hash,
            merkleProofs: rewardInfo.proof,
            epoch: rewardInfo.epoch,
            rewardType: rewardInfo.type,
            allRewardsAmount: rewardInfo.amount_normalized,
          },
        });
      }
    }

    results[walletAddress.toLowerCase() as EthAddress] = processedRewards;
  }

  return results;
};


export const fetchSparkRewards = async (
  provider: Client,
  network: NetworkNumber,
  walletAddress: EthAddress,
  marketAddress: EthAddress,
): Promise<SparkRewardsClaimableToken[]> => {
  const contract = SparkIncentiveDataProviderContractViem(provider, network);
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
  }, [] as EthAddress[]);

  type RewardsPerAAsset = {
    amount: string,
    symbol: string,
    underlyingAsset: string,
    rewardTokenAddress: EthAddress,
    aTokenAddress: string,
  };
  const rewardsPerAAsset = await Promise.all(allATokens.map((token: EthAddress) => {
    const sparkRewardsContract = SparkRewardsControllerViem(provider, network);
    return sparkRewardsContract.read.getAllUserRewards([[token], walletAddress]);
  }));

  // match amounts to token symbol, parse decimal amounts
  const rewardsPerAAssetWithInfo = rewardsPerAAsset.map((rewardForAAsset, aaIndex) => {
    const rewardsList = rewardForAAsset[0];
    const amounts = rewardForAAsset[1];
    const rewardsDataArraysForAAsset = allTokensDataArrays[aaIndex];
    const aTokenAddress = allATokens[aaIndex];
    return rewardsList.map((rewardTokenAddress: EthAddress, rewardIndex: number) => {
      const dataArrIndex = rewardsDataArraysForAAsset.findIndex((arr: { rewardTokenAddress: string | undefined; }) => compareAddresses(arr.rewardTokenAddress, rewardTokenAddress));
      const amountWei = amounts[rewardIndex];
      const amount = getEthAmountForDecimals(amountWei.toString(), rewardsDataArraysForAAsset[dataArrIndex]?.rewardTokenDecimals);
      const symbol = rewardsDataArraysForAAsset[dataArrIndex]?.rewardTokenSymbol || '';
      const underlyingAsset = symbol;
      return ({
        amount,
        symbol,
        underlyingAsset,
        rewardTokenAddress,
        aTokenAddress,
      });
    }) as RewardsPerAAsset[];
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

  return Object.values(totalUnclaimedPerRewardToken).map((reward: any) => ({
    symbol: reward.symbol,
    amount: reward.amount,
    claimType: ClaimType.SPARK_REWARDS,
    tokenAddress: reward.rewardTokenAddress,
    underlyingSymbol: reward.underlyingAsset,
    walletAddress,
    label: 'Spark',
    additionalClaimFields: {
      sparkAssetAddresses: reward.aTokenAddresses,
    },
  }));
};