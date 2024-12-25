import Web3 from 'web3';
import Dec from 'decimal.js';
import { getAssetInfo } from '@defisaver/tokens';
import {
  COMPPriceFeedContract,
  ETHPriceFeedContract,
  USDCPriceFeedContract,
  WstETHPriceFeedContract,
} from '../contracts';
import { NetworkNumber } from '../types/common';
import { multicall } from '../multicall';

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

export const getWstETHPrice = async (web3: Web3) => {
  const wstETHFeedContract = WstETHPriceFeedContract(web3, NetworkNumber.Eth);
  const ethFeedContract = ETHPriceFeedContract(web3, NetworkNumber.Eth);
  const calls = [
    {
      target: ethFeedContract.options.address,
      abiItem: ethFeedContract.options.jsonInterface.find(({ name }) => name === 'latestAnswer'),
      params: [],
    },
    {
      target: wstETHFeedContract.options.address,
      abiItem: wstETHFeedContract.options.jsonInterface.find(({ name }) => name === 'latestRoundData'),
      params: [],
    },
  ];

  const multicallRes = await multicall(calls, web3);

  const ethPrice = new Dec(multicallRes[0][0]).div(1e8);

  const wstETHRate = new Dec(multicallRes[1].answer).div(1e8);

  return new Dec(ethPrice).mul(wstETHRate).toString();
};

// chainlink price feed available only on mainnet
export const getChainlinkAssetAddress = (symbol: string, network: NetworkNumber) => {
  // Chainlink only has BTC/USD feed so we use that for BTC derivatives
  if (['WBTC', 'RENBTC'].includes(symbol?.toUpperCase())) return '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';
  if (symbol?.toUpperCase() === 'WETH') return getAssetInfo('ETH').addresses[network];
  return getAssetInfo(symbol).addresses[network];
};
