import Web3 from 'web3';
import {} from 'dotenv/config';
import { NetworkNumber, Networkish } from '../types/common';

const getRpcUrl = (network: Networkish): string => {
  switch (network) {
    case 'mainnet':
    case NetworkNumber.Eth:
      return process.env.RPC || '';
    case 'optimism':
    case NetworkNumber.Opt:
      return process.env.RPCOPT || '';
    case 'arbitrum':
    case NetworkNumber.Arb:
      return process.env.RPCARB || '';
    case 'base':
    case NetworkNumber.Base:
      return process.env.RPCBASE || '';
    default:
      return '';
  }
};

export const getWeb3 = (network: Networkish) => {
  const web3 = new Web3(getRpcUrl(network));
  return web3;
};