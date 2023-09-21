import Web3 from 'web3';

import { assetAmountInEth } from '@defisaver/tokens';
import {
  Blockish, NetworkNumber, PositionBalances,
} from '../types/common';

import { ChickenBondsViewContract } from '../contracts';

export const getChickenBondsAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, bondId: string): Promise<PositionBalances> => {
  const viewContract = ChickenBondsViewContract(web3, network);

  const fullBondInfo = await viewContract.methods.getBondFullInfo(bondId).call({}, block);

  return {
    deposited: {
      LUSD: assetAmountInEth(fullBondInfo.lusdAmount, 'LUSD'),
    },
  };
};
