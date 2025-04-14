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
import { getEthAmountForDecimals } from './utils';

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

export const getWstETHChainLinkPriceCalls = (web3: Web3, network: NetworkNumber) => {
  const wstETHFeedContract = WstETHPriceFeedContract(web3, network);
  const ethFeedContract = ETHPriceFeedContract(web3, network);
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
    {
      target: wstETHFeedContract.options.address,
      abiItem: wstETHFeedContract.options.jsonInterface.find(({ name }) => name === 'decimals'),
      params: [],
    },
  ];
  return calls;
};

export const parseWstETHPriceCalls = (_ethPrice: string, wstETHrate: { answer: string }, decimals: string) => {
  const ethPrice = new Dec(_ethPrice).div(1e8);
  const wstETHRate = getEthAmountForDecimals(wstETHrate.answer, decimals);
  return { ethPrice, wstETHRate };
};

// this is a fixed version, the original version is above but requires to refactor comp v3 function, so it's easier to just copy the function for now
export const getWstETHPriceFluid = async (web3: Web3, network: NetworkNumber) => {
  const calls = getWstETHChainLinkPriceCalls(web3, network);
  const multicallRes = await multicall(calls, web3, network);
  const { ethPrice, wstETHRate } = parseWstETHPriceCalls(multicallRes[0][0], multicallRes[1], multicallRes[2][0]);

  return new Dec(ethPrice).mul(wstETHRate).toString();
};

// chainlink price feed available only on mainnet
export const getChainlinkAssetAddress = (symbol: string, network: NetworkNumber) => {
  // Chainlink only has BTC/USD feed so we use that for BTC derivatives
  if (['WBTC', 'RENBTC'].includes(symbol?.toUpperCase())) return '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';
  if (symbol?.toUpperCase() === 'WETH') return getAssetInfo('ETH').addresses[network];
  return getAssetInfo(symbol).addresses[network];
};
