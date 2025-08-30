import { assetAmountInWei, getAssetInfoByAddress } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  Blockish, EthereumProvider, NetworkNumber, PositionBalances,
} from '../types/common';
import { wethToEthByAddress } from '../services/utils';
import { getViemProvider } from '../services/viem';

export const _getExchangeAccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, subData: any): Promise<PositionBalances> => {
  const fromToken = getAssetInfoByAddress(wethToEthByAddress(subData.fromToken, network), network);

  return {
    selling: {
      [addressMapping ? fromToken.address.toLowerCase() : fromToken.symbol]: assetAmountInWei(subData.amount, fromToken.symbol),
    },
  };
};

export const getExchangeAccountBalances = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  subData: any,
): Promise<PositionBalances> => _getExchangeAccountBalances(getViemProvider(provider, network), network, block, addressMapping, subData);
