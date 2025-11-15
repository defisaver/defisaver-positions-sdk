import Dec from 'decimal.js';
import { assetAmountInEth } from '@defisaver/tokens';
import { Client } from 'viem';
import { UUPSViem } from '../contracts';
import { EthAddress, HexString, NetworkNumber } from '../types/common';
import { ClaimType } from '../types/claiming';

export const fetchKingRewards = async (walletAddress: EthAddress) => {
  try {
    const res = await fetch(`https://fe.defisaver.com/api/etherfi/get-king-rewards/${walletAddress}`,
      { signal: AbortSignal.timeout(5000) });

    if (!res.ok) throw new Error(await res.text());

    return await res.json();
  } catch (err) {
    console.error('External API Error: Error fetching KING rewards:', err);
    return { Amount: '0', Root: '', Proofs: [] };
  }
};

export const getKingRewards = async (provider: Client, network: NetworkNumber, walletAddresses: EthAddress[]) => {
  // Fetch all API data in parallel (these are external API calls, can't be batched with multicall)
  const apiDataPromises = walletAddresses.map(address => fetchKingRewards(address));
  const apiDataArray = await Promise.all(apiDataPromises);

  // Batch all contract calls using multicall
  const contract = UUPSViem(provider, network);
  const cumulativePromises = walletAddresses.map(address => contract.read.cumulativeClaimed([address]),
  );
  const cumulativeResults = await Promise.all(cumulativePromises);

  // Process results
  const results: Record<string, any[]> = {};

  for (let i = 0; i < walletAddresses.length; i++) {
    const walletAddress = walletAddresses[i];
    const data = apiDataArray[i];
    const cumulative = cumulativeResults[i];

    const allRewardsAmount = assetAmountInEth(data.Amount, 'KING');
    const claimedAmount = assetAmountInEth(cumulative.toString(), 'KING');
    const amountToClaim = new Dec(allRewardsAmount).sub(claimedAmount);

    if (amountToClaim.lessThanOrEqualTo('0')) {
      results[walletAddress.toLowerCase() as EthAddress] = [];
    } else {
      results[walletAddress.toLowerCase() as EthAddress] = [{
        symbol: 'KING',
        underlyingSymbol: 'KING',
        tokenAddress: '0x8F08B70456eb22f6109F57b8fafE862ED28E6040',
        amount: amountToClaim.toString(),
        walletAddress,
        label: 'weETH',
        claimType: ClaimType.KING_REWARDS,
        additionalClaimFields: {
          allRewardsAmount,
          merkleRoot: data.Root,
          merkleProofs: data.Proofs,
        },
      }];
    }
  }

  return results;
};
