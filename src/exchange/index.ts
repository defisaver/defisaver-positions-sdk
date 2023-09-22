import Web3 from 'web3';

import { getAssetInfoByAddress } from '@defisaver/tokens';
import {
  Blockish, NetworkNumber, PositionBalances,
} from '../types/common';
import { wethToEthByAddress } from '../services/utils';

export const getExchangeAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, subData: any): Promise<PositionBalances> => {
  const fromToken = getAssetInfoByAddress(wethToEthByAddress(subData.fromToken, network), network);

  return {
    selling: {
      [addressMapping ? fromToken.address.toLowerCase() : fromToken.symbol]: subData.amount,
    },
  };
};
