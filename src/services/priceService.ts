import Dec from 'decimal.js';
import { getAssetInfo } from '@defisaver/tokens';
import { Client, PublicClient } from 'viem';
import {
  BTCPriceFeedContractViem,
  COMPPriceFeedContractViem,
  ETHPriceFeedContractViem,
  USDCPriceFeedContractViem,
  WeETHPriceFeedContractViem,
  WstETHPriceFeedContractViem,
} from '../contracts';
import { EthAddress, NetworkNumber } from '../types/common';
import { getEthAmountForDecimals } from './utils';

export const getEthPrice = async (client: Client) => {
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

export const getWstETHPrice = async (client: Client, network: NetworkNumber = NetworkNumber.Eth) => {
  const wstETHFeedContract = WstETHPriceFeedContractViem(client, network);
  const ethFeedContract = ETHPriceFeedContractViem(client, network);

  const [ethPriceWei, wstETHRateWei, decimals] = await Promise.all([
    ethFeedContract.read.latestAnswer(),
    wstETHFeedContract.read.latestRoundData(),
    wstETHFeedContract.read.decimals(),
  ]);

  const ethPrice = new Dec(ethPriceWei.toString()).div(1e8);

  const wstETHRate = getEthAmountForDecimals(wstETHRateWei[1].toString(), decimals);

  return new Dec(ethPrice).mul(wstETHRate).toString();
};

export const getWeETHPrice = async (client: Client, network: NetworkNumber = NetworkNumber.Eth) => {
  const weETHFeedContract = WeETHPriceFeedContractViem(client, network);
  const ethFeedContract = ETHPriceFeedContractViem(client, network);

  const [ethPriceWei, weETHRateWei, decimals] = await Promise.all([
    ethFeedContract.read.latestAnswer(),
    weETHFeedContract.read.latestRoundData(),
    weETHFeedContract.read.decimals(),
  ]);

  const ethPrice = new Dec(ethPriceWei.toString()).div(1e8);

  const weETHRate = getEthAmountForDecimals(weETHRateWei[1].toString(), decimals);

  return new Dec(ethPrice).mul(weETHRate).toString();
};

export const getWstETHChainLinkPriceCalls = (client: PublicClient, network: NetworkNumber) => {
  const wstETHFeedContract = WstETHPriceFeedContractViem(client, network);
  const ethFeedContract = ETHPriceFeedContractViem(client, network);
  const calls = [
    {
      address: ethFeedContract.address,
      abi: ethFeedContract.abi,
      functionName: 'latestAnswer',
      args: [],
    },
    {
      address: wstETHFeedContract.address,
      abi: wstETHFeedContract.abi,
      functionName: 'latestRoundData',
      args: [],
    },
    {
      address: wstETHFeedContract.address,
      abi: wstETHFeedContract.abi,
      functionName: 'decimals',
      args: [],
    },
  ];
  return calls;
};

export const getWeETHChainLinkPriceCalls = (client: PublicClient, network: NetworkNumber) => {
  const weETHFeedContract = WeETHPriceFeedContractViem(client, network);
  const ethFeedContract = ETHPriceFeedContractViem(client, network);
  const calls = [
    {
      address: ethFeedContract.address,
      abi: ethFeedContract.abi,
      functionName: 'latestAnswer',
      args: [],
    },
    {
      address: weETHFeedContract.address,
      abi: weETHFeedContract.abi,
      functionName: 'latestRoundData',
      args: [],
    },
    {
      address: weETHFeedContract.address,
      abi: weETHFeedContract.abi,
      functionName: 'decimals',
      args: [],
    },
  ];
  return calls;
};

export const parseWstETHPriceCalls = (_ethPrice: string, wstETHrateAnswer: string, decimals: string) => {
  const ethPrice = new Dec(_ethPrice).div(1e8);
  const wstETHRate = getEthAmountForDecimals(wstETHrateAnswer, decimals);
  return { ethPrice, wstETHRate };
};

export const parseWeETHPriceCalls = (_ethPrice: string, weETHrateAnswer: string, decimals: string) => {
  const ethPrice = new Dec(_ethPrice).div(1e8);
  const weETHRate = getEthAmountForDecimals(weETHrateAnswer, decimals);
  return { ethPrice, weETHRate };
};

// this is a fixed version, the original version is above but requires to refactor comp v3 function, so it's easier to just copy the function for now
export const getWstETHPriceFluid = async (client: PublicClient, network: NetworkNumber) => {
  const calls = getWstETHChainLinkPriceCalls(client, network);
  const results = await client.multicall({ contracts: calls });
  // @ts-ignore
  const { ethPrice, wstETHRate } = parseWstETHPriceCalls(results[0].result!.toString(), results[1].result[1]!.toString(), results[2].result!.toString());

  return new Dec(ethPrice).mul(wstETHRate).toString();
};

export const getBTCPriceForFluid = async (client: PublicClient, network: NetworkNumber) => {
  const contract = BTCPriceFeedContractViem(client, network);
  const price = await contract.read.latestAnswer();
  return new Dec(price).div(1e8).toString();
};

export const getEthPriceForFluid = async (client: PublicClient, network: NetworkNumber) => {
  const contract = ETHPriceFeedContractViem(client, network);
  const price = await contract.read.latestAnswer();
  return new Dec(price).div(1e8).toString();
};

// chainlink price feed available only on mainnet
export const getChainlinkAssetAddress = (symbol: string, network: NetworkNumber): EthAddress => {
  // Chainlink only has BTC/USD feed so we use that for BTC derivatives
  if (['WBTC', 'RENBTC'].includes(symbol?.toUpperCase())) return '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';
  if (symbol?.toUpperCase() === 'WETH' && network !== NetworkNumber.Plasma) return getAssetInfo('ETH').addresses[network] as EthAddress;
  return getAssetInfo(symbol).addresses[network] as EthAddress;
};
