import Dec from 'decimal.js';
import { Client } from 'viem';
import { assetAmountInEth } from '@defisaver/tokens';
import { EthAddress, NetworkNumber } from '../types';
import { UniswapTokenDistributorViem } from '../contracts';
import { ClaimType, UniswapAirdropClaimableToken } from '../types/claiming';

const EMPTY_DATA = (walletAddress: EthAddress) => ({
  address: walletAddress, index: 0, amount: '0x0', proof: [],
});

export const fetchUniswapRewardsData = async (walletAddress: EthAddress) => {
  try {
    const res = await fetch(`http://localhost:8888/api/rewards/uniswap?user=${walletAddress}`,
      { signal: AbortSignal.timeout(5000) });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    if (data.data.error) return EMPTY_DATA(walletAddress);

    return data.data;
  } catch (err) {
    console.error('External API Error: Error fetching Uniswap rewards:', err);
    return EMPTY_DATA(walletAddress);
  }
};

export const getUniswapRewards = async (provider: Client, network: NetworkNumber, walletAddresses: EthAddress[]): Promise<Record<string, UniswapAirdropClaimableToken[]>> => {
  // Fetch all API data in parallel (these are external API calls, can't be batched with multicall)
  const apiDataPromises = walletAddresses.map(address => fetchUniswapRewardsData(address));
  const apiDataArray = await Promise.all(apiDataPromises);

  // Batch all contract calls using multicall
  const contract = UniswapTokenDistributorViem(provider, network);
  const cumulativePromises = apiDataArray.map(data => (data.index ? contract.read.isClaimed([data.index]) : Promise.resolve(false)),
  );
  const cumulativeResults = await Promise.all(cumulativePromises);

  // Process results
  const results: Record<string, UniswapAirdropClaimableToken[]> = {};

  for (let i = 0; i < walletAddresses.length; i++) {
    const walletAddress = walletAddresses[i];
    const data = apiDataArray[i];
    const cumulative = cumulativeResults[i];

    const amountToClaim = new Dec(data.amount);

    if (amountToClaim.lessThanOrEqualTo('0')) {
      results[walletAddress.toLowerCase() as EthAddress] = [];
    } else {
      results[walletAddress.toLowerCase() as EthAddress] = [{
        symbol: 'UNI',
        underlyingSymbol: 'UNI',
        label: 'Uniswap Airdrop',
        tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        amount: assetAmountInEth(amountToClaim.toString(), 'UNI'),
        walletAddress,
        claimType: ClaimType.UNI_REWARDS,
        additionalClaimFields: {
          index: data.index,
          isClaimed: cumulative,
          proof: data.proof,
        },
      }];
    }
  }

  return results;
};