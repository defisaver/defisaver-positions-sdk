import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { Client } from 'viem';
import Dec from 'decimal.js';
import { ClaimableToken, ClaimType } from '../types/claiming';
import { EthAddress, NetworkNumber } from '../types/common';
import { createViemContractFromConfigFunc } from '../contracts';
import { getMorphoUnderlyingSymbol } from '../helpers/morphoBlueHelpers';

const MORPHO_ALLOWED_CONTRACTS = [
  '0x330eefa8a787552DC5cAd3C3cA644844B1E61Ddb',
  '0x678dDC1d07eaa166521325394cDEb1E4c086DF43',
  '0x2efd4625d0c149ebadf118ec5446c6de24d916a4',
];

const MORPHO_ALLOWED_TOKENS = [
  'MORPHO',
  'MORPHO Legacy',
];


export const getMorphoBlueRewardsInfo = async (address: EthAddress) => {
  if (!address) return { claimable: '0' };

  try {
    const res = await fetch(`https://rewards.morpho.org/v1/users/${address}/distributions`,
      { signal: AbortSignal.timeout(3000) });

    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (error) {
    console.error('External API Failure: Morpho Merit', error);
    return { claimable: '0' };
  }
};

export const fetchMorphoBlueRewards = async (
  provider: Client,
  network: NetworkNumber,
  walletAddresses: EthAddress[],
): Promise<Record<string, ClaimableToken[]>> => {
  // Fetch all API data in parallel (these are external API calls, can't be batched with multicall)
  const apiDataPromises = walletAddresses.map(address => getMorphoBlueRewardsInfo(address));
  const apiDataArray = await Promise.all(apiDataPromises);

  // Process API data to get claimable tokens for each wallet
  const allClaimableTokens: Array<{ walletAddress: EthAddress; tokens: ClaimableToken[] }> = [];
  const contractCallsData: Array<{ walletAddress: EthAddress; tokenAddress: EthAddress; distributor: EthAddress }> = [];

  for (let i = 0; i < walletAddresses.length; i++) {
    const walletAddress = walletAddresses[i];
    const data = apiDataArray[i];

    const claimableTokens = data?.data?.reduce((acc: ClaimableToken[], reward: any) => {
      const token = getAssetInfoByAddress(reward.asset.address);
      if (!MORPHO_ALLOWED_CONTRACTS.includes(reward?.distributor?.address) || !MORPHO_ALLOWED_TOKENS.includes(token.symbol)) {
        return acc;
      }

      // Store contract call data for batching
      contractCallsData.push({
        walletAddress,
        tokenAddress: reward.asset.address,
        distributor: reward?.distributor?.address,
      });

      return [
        ...acc,
        {
          symbol: token.symbol,
          underlyingSymbol: getMorphoUnderlyingSymbol(token.symbol),
          tokenAddress: reward.asset.address,
          amount: assetAmountInEth(reward.claimable, token.symbol),
          walletAddress,
          label: token.symbol,
          claimType: ClaimType.MORPHO,
          additionalClaimFields: {
            originalAmount: reward.claimable,
            distributor: reward?.distributor?.address,
            merkleProofs: reward?.proof,
            isLegacy: token.symbol === 'MORPHO Legacy',
            txData: reward?.tx_data,
          },
        }];
    }, []) || [];

    allClaimableTokens.push({ walletAddress, tokens: claimableTokens });
  }

  // Batch all contract calls using multicall
  const contractPromises = contractCallsData.map(({ walletAddress, tokenAddress, distributor }) => {
    const distributorContract = createViemContractFromConfigFunc('MorphoDistributor', distributor)(provider, network);
    return distributorContract.read.claimed([walletAddress, tokenAddress]);
  });
  const contractResults = await Promise.all(contractPromises);

  // Process results
  const results: Record<string, ClaimableToken[]> = {};
  let contractCallIndex = 0;

  for (const { walletAddress, tokens } of allClaimableTokens) {
    const updatedTokens: ClaimableToken[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const claimableToken = tokens[i];
      const claimed = assetAmountInEth(contractResults[contractCallIndex].toString(), claimableToken.underlyingSymbol);
      contractCallIndex++;

      const updatedToken = { ...claimableToken };
      updatedToken.amount = new Dec(claimableToken.amount).sub(claimed).toString();
      updatedTokens.push(updatedToken);
    }

    results[walletAddress.toLowerCase() as EthAddress] = updatedTokens.filter(
      (claimableToken) => new Dec(claimableToken.amount).gt(0),
    );
  }

  return results;
};