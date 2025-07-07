import Web3 from 'web3';
import Dec from 'decimal.js';
import { getAssetInfo } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  COMPPriceFeedContractViem,
  ETHPriceFeedContract,
  BTCPriceFeedContract,
  USDCPriceFeedContract, WeETHPriceFeedContract,
  ETHPriceFeedContractViem,
  USDCPriceFeedContractViem,
  WstETHPriceFeedContract,
  WstETHPriceFeedContractViem,
} from '../contracts';
import { EthAddress, NetworkNumber } from '../types/common';
import { multicall } from '../multicall';
import { getEthAmountForDecimals } from './utils';

export const getEthPrice = async (web3: Web3) => {
  const contract = ETHPriceFeedContract(web3, NetworkNumber.Eth);
  const price = await contract.methods.latestAnswer().call();
  return new Dec(price).div(1e8).toString();
};

export const getEthPriceViem = async (client: Client) => {
  const contract = ETHPriceFeedContractViem(client, NetworkNumber.Eth);
  const price = await contract.read.latestAnswer();
  return new Dec(price.toString()).div(1e8).toString();
};

export const getUSDCPrice = async (client: Client) => {
  const contract = USDCPriceFeedContractViem(client, NetworkNumber.Eth);
  const price = await contract.read.latestAnswer();
  return new Dec(price.toString()).div(1e8).toString();
};

export const getCompPrice = async (client: Client) => {
  const contract = COMPPriceFeedContractViem(client, NetworkNumber.Eth);
  const price = await contract.read.latestAnswer();
  return new Dec(price.toString()).div(1e8).toString();
};

export const getWstETHPrice = async (client: Client) => {
  const wstETHFeedContract = WstETHPriceFeedContractViem(client, NetworkNumber.Eth);
  const ethFeedContract = ETHPriceFeedContractViem(client, NetworkNumber.Eth);

  const [ethPriceWei, wstETHRateWei] = await Promise.all([
    ethFeedContract.read.latestAnswer(),
    wstETHFeedContract.read.latestRoundData(),
  ]);

  const ethPrice = new Dec(ethPriceWei.toString()).div(1e8);

  const wstETHRate = new Dec(wstETHRateWei[1].toString()).div(1e8);

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

export const getWeETHChainLinkPriceCalls = (web3: Web3, network: NetworkNumber) => {
  const weETHFeedContract = WeETHPriceFeedContract(web3, network);
  const ethFeedContract = ETHPriceFeedContract(web3, network);
  const calls = [
    {
      target: ethFeedContract.options.address,
      abiItem: ethFeedContract.options.jsonInterface.find(({ name }) => name === 'latestAnswer'),
      params: [],
    },
    {
      target: weETHFeedContract.options.address,
      abiItem: weETHFeedContract.options.jsonInterface.find(({ name }) => name === 'latestRoundData'),
      params: [],
    },
    {
      target: weETHFeedContract.options.address,
      abiItem: weETHFeedContract.options.jsonInterface.find(({ name }) => name === 'decimals'),
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

export const parseWeETHPriceCalls = (_ethPrice: string, weETHrate: { answer: string }, decimals: string) => {
  const ethPrice = new Dec(_ethPrice).div(1e8);
  const weETHRate = getEthAmountForDecimals(weETHrate.answer, decimals);
  return { ethPrice, weETHRate };
};

// this is a fixed version, the original version is above but requires to refactor comp v3 function, so it's easier to just copy the function for now
export const getWstETHPriceFluid = async (web3: Web3, network: NetworkNumber) => {
  const calls = getWstETHChainLinkPriceCalls(web3, network);
  const multicallRes = await multicall(calls, web3, network);
  const { ethPrice, wstETHRate } = parseWstETHPriceCalls(multicallRes[0][0], multicallRes[1], multicallRes[2][0]);

  return new Dec(ethPrice).mul(wstETHRate).toString();
};

export const getBTCPriceForFluid = async (web3: Web3, network: NetworkNumber) => {
  const contract = BTCPriceFeedContract(web3, network);
  const price = await contract.methods.latestAnswer().call();
  return new Dec(price).div(1e8).toString();
};

export const getEthPriceForFluid = async (web3: Web3, network: NetworkNumber) => {
  const contract = ETHPriceFeedContract(web3, network);
  const price = await contract.methods.latestAnswer().call();
  return new Dec(price).div(1e8).toString();
};

// chainlink price feed available only on mainnet
export const getChainlinkAssetAddress = (symbol: string, network: NetworkNumber): EthAddress => {
  // Chainlink only has BTC/USD feed so we use that for BTC derivatives
  if (['WBTC', 'RENBTC'].includes(symbol?.toUpperCase())) return '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';
  if (symbol?.toUpperCase() === 'WETH') return getAssetInfo('ETH').addresses[network] as EthAddress;
  return getAssetInfo(symbol).addresses[network] as EthAddress;
};
