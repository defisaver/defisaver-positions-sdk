import Web3 from 'web3';
import Dec from 'decimal.js';
import { COMPPriceFeedContract, ETHPriceFeedContract, USDCPriceFeedContract } from '../contracts';
import { NetworkNumber } from '../types/common';

export const getEthPrice = async (web3: Web3) => {
  const contract = ETHPriceFeedContract(web3, NetworkNumber.Eth);
  const price = await contract.methods.latestAnswer().call();
  return new Dec(price).div(1e8).toString();
};

export const getUSDCPrice = async (web3: Web3) => {
  const contract = USDCPriceFeedContract(web3, NetworkNumber.Eth);
  const price = await contract.methods.latestAnswer().call();
  return new Dec(price).div(1e8).toString();
};

export const getCompPrice = async (web3: Web3) => {
  const contract = COMPPriceFeedContract(web3, NetworkNumber.Eth);
  const price = await contract.methods.latestAnswer().call();
  return new Dec(price).div(1e8).toString();
};