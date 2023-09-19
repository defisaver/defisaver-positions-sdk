import Dec from 'decimal.js';
import Web3 from 'web3';
import { NetworkNumber } from '../types/common';
import { SECONDS_PER_YEAR } from '../constants';
import { PotContract } from '../contracts';


export const getDsrApy = async (web3: Web3, network: NetworkNumber) => {
  const potContract = PotContract(web3, network);
  return new Dec(await potContract.methods.dsr().call())
    .div(new Dec(1e27))
    .pow(SECONDS_PER_YEAR)
    .sub(1)
    .mul(100)
    .toString();
};