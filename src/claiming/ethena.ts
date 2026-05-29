import { getAssetInfo } from '@defisaver/tokens';
import Dec from 'decimal.js';
import { getAddress } from 'viem';
import { EthAddress } from '../types/common';
import { ClaimType } from '../types/claiming';
import { getEthAmountForDecimals } from '../services/utils';

export const fetchEthenaAirdropReward = async (address: EthAddress) => {
  try {
    const checksumAddress = getAddress(address);
    const response = await fetch(`https://d1o76ps6187jke.cloudfront.net/${checksumAddress}/0xb92954d91aa2793b3718414d8df2413d5bd648955dec4a75471e86ded263d585-${checksumAddress}.json`);
    if (!response.ok) {
      if (response.status === 403) {
        // This is also okay, means that there are no rewards for the address
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Ethena airdrop rewards:', error);
  }
};

export const fetchEthenaAirdropRewards = async (walletAddresses: EthAddress[]): Promise<Record<string, any[]>> => {
  const apiDataPromises = walletAddresses.map(address => fetchEthenaAirdropReward(address));
  const apiDataArray = await Promise.all(apiDataPromises);

  const results: Record<string, any[]> = {};
  for (let i = 0; i < walletAddresses.length; i++) {
    const walletAddress = walletAddresses[i];
    const data = apiDataArray[i];

    if (!data || data.claimed) {
      continue;
    }

    const processedRewards = [];
    const assetInfo = getAssetInfo('sENA');

    const amount = getEthAmountForDecimals(data.events[0].awardAmount, assetInfo.decimals);

    if (new Dec(amount).gt('0')) {
      processedRewards.push({
        symbol: assetInfo.symbol,
        underlyingSymbol: assetInfo.symbol,
        amount,
        claimType: ClaimType.ETHENA_AIRDROP,
        tokenAddress: assetInfo.address,
        walletAddress,
        label: 'Ethena Airdrop',
      });
    }

    results[walletAddress.toLowerCase() as EthAddress] = processedRewards;
  }

  return results;
};
