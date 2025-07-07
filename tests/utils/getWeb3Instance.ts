import Web3 from 'web3';
import { providerFromMiddleware } from '@metamask/eth-json-rpc-provider';
import { createFetchMiddleware } from '@metamask/eth-json-rpc-middleware';
import { AbstractProvider } from 'web3-core';

export const createProviderFromRpc = (rpcUrl: string) => providerFromMiddleware(
  createFetchMiddleware({
    fetch,
    btoa,
    rpcUrl,
  }));

export const getWeb3Instance = (envVar: string): Web3 => {
  const rpcUrl = process.env[envVar];
  if (!rpcUrl) {
    throw new Error(`${envVar} environment variable is not defined.`);
  }
  return new Web3(createProviderFromRpc(rpcUrl) as AbstractProvider);
};
