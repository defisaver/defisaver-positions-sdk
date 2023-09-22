import Web3 from 'web3';

import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import {
  Blockish, NetworkNumber, PositionBalances,
} from '../types/common';

import { ChickenBondsViewContract } from '../contracts';

export const getChickenBondsAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, bondId: string): Promise<PositionBalances> => {
  const viewContract = ChickenBondsViewContract(web3, network);

  const fullBondInfo = await viewContract.methods.getBondFullInfo(bondId).call({}, block);

  return {
    deposited: {
      [addressMapping ? getAssetInfo('LUSD', network).address.toLowerCase() : 'LUSD']: fullBondInfo.lusdAmount,
    },
  };
};
