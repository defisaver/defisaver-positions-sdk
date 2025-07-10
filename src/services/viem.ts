import { createPublicClient, custom } from 'viem';
import {
  arbitrum, base, mainnet, optimism,
} from 'viem/chains';
import { Blockish, EthereumProvider, NetworkNumber } from '../types/common';

export const getViemChain = (network: NetworkNumber) => {
  switch (network) {
    case NetworkNumber.Eth:
      return mainnet;
    case NetworkNumber.Opt:
      return optimism;
    case NetworkNumber.Arb:
      return arbitrum;
    case NetworkNumber.Base:
      return base;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
};

export const getViemProvider = (provider: EthereumProvider, network: NetworkNumber, options?: any) => createPublicClient({
  transport: custom(provider),
  chain: getViemChain(network),
  ...options,
});

export const setViemBlockNumber = (block: Blockish) => {
  if (block === 'latest') return {};
  return { blockNumber: BigInt(block) };
};