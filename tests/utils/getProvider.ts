import { providerFromMiddleware } from '@metamask/eth-json-rpc-provider';
import { createFetchMiddleware } from '@metamask/eth-json-rpc-middleware';
import { EthereumProvider } from '../../src/types/common';

export const createProviderFromRpc = (rpcUrl: string) => providerFromMiddleware(
  createFetchMiddleware({
    fetch,
    btoa,
    rpcUrl,
  }));

export const getProvider = (envVar: string): EthereumProvider => {
  const rpcUrl = process.env[envVar];
  if (!rpcUrl) {
    throw new Error(`${envVar} environment variable is not defined.`);
  }
  return createProviderFromRpc(rpcUrl);
};