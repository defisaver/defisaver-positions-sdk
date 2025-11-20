import Dec from 'decimal.js';
import { getAssetInfo } from '@defisaver/tokens';
import { Client, PublicClient } from 'viem';
import {
  BTCPriceFeedContractViem,
  COMPPriceFeedContractViem,
  DFSFeedRegistryContractViem,
  ETHPriceFeedContractViem,
  USDCPriceFeedContractViem,
  WeETHPriceFeedContractViem,
  WstETHPriceFeedContractViem,
} from '../contracts';
import { EthAddress, NetworkNumber, HexString } from '../types/common';
import { getEthAmountForDecimals } from './utils';
import { USD_QUOTE } from '../constants';

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

export const getWsrETHPrice = async (client: Client, network: NetworkNumber = NetworkNumber.Eth) => {
  const feedRegistryContract = DFSFeedRegistryContractViem(client, network);
  const [ethPriceWei, wrsETHRateWei] = await Promise.all([
    feedRegistryContract.read.latestRoundData([getAssetInfo('WETH', network).address as HexString, USD_QUOTE]),
    feedRegistryContract.read.latestRoundData([getAssetInfo('wrsETH', network).address as HexString, getAssetInfo('WETH', network).address as HexString]),
  ]);

  const ethPrice = new Dec(ethPriceWei[1].toString()).div(1e8);

  const wrsETHRate = getEthAmountForDecimals(wrsETHRateWei[1].toString(), 18);

  return new Dec(ethPrice).mul(wrsETHRate).toString();
};

export const getSyrupUSDTPrice = async (client: Client, network: NetworkNumber = NetworkNumber.Eth) => {
  const feedRegistryContract = DFSFeedRegistryContractViem(client, network);
  const [usdtPriceWei, syrupUSDTRateWei] = await Promise.all([
    feedRegistryContract.read.latestRoundData([getAssetInfo('USDT', network).address as HexString, USD_QUOTE]),
    feedRegistryContract.read.latestRoundData([getAssetInfo('syrupUSDT', network).address as HexString, getAssetInfo('USDT', network).address as HexString]),
  ]);

  const usdtPrice = new Dec(usdtPriceWei[1].toString()).div(1e8);

  const syrupUSDTPrice = getEthAmountForDecimals(syrupUSDTRateWei[1].toString(), 18);

  return new Dec(usdtPrice).mul(syrupUSDTPrice).toString();
};

export const getWstUSRPrice = async (client: Client, network: NetworkNumber = NetworkNumber.Eth) => {
  const feedRegistryContract = DFSFeedRegistryContractViem(client, network);
  const [usrPriceWei, wstUSRRateWei] = await Promise.all([
    feedRegistryContract.read.latestRoundData([getAssetInfo('USR', network).address as HexString, USD_QUOTE]),
    feedRegistryContract.read.latestRoundData([getAssetInfo('wstUSR', network).address as HexString, getAssetInfo('USR', network).address as HexString]),
  ]);

  const usrPrice = new Dec(usrPriceWei[1].toString()).div(1e8);

  const wstUSRPrice = getEthAmountForDecimals(wstUSRRateWei[1].toString(), 18);

  return new Dec(usrPrice).mul(wstUSRPrice).toString();
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

export const getWsrETHChainLinkPriceCalls = (client: PublicClient, network: NetworkNumber) => {
  const feedRegistryContract = DFSFeedRegistryContractViem(client, network);
  const calls = [
    {
      address: feedRegistryContract.address,
      abi: feedRegistryContract.abi,
      functionName: 'latestRoundData',
      args: [getAssetInfo('WETH', network).address, USD_QUOTE],
    },
    {
      address: feedRegistryContract.address,
      abi: feedRegistryContract.abi,
      functionName: 'latestRoundData',
      args: [getAssetInfo('wrsETH', network).address, getAssetInfo('WETH', network).address],
    },
  ];
  return calls;
};

export const getSyrupUSDTChainLinkPriceCalls = (client: PublicClient, network: NetworkNumber) => {
  const feedRegistryContract = DFSFeedRegistryContractViem(client, network);
  const calls = [
    {
      address: feedRegistryContract.address,
      abi: feedRegistryContract.abi,
      functionName: 'latestRoundData',
      args: [getAssetInfo('USDT', network).address, USD_QUOTE],
    },
    {
      address: feedRegistryContract.address,
      abi: feedRegistryContract.abi,
      functionName: 'latestRoundData',
      args: [getAssetInfo('syrupUSDT', network).address, getAssetInfo('USDT', network).address],
    },
  ];
  return calls;
};

export const getWstUSRChainLinkPriceCalls = (client: PublicClient, network: NetworkNumber) => {
  const feedRegistryContract = DFSFeedRegistryContractViem(client, network);
  const calls = [
    {
      address: feedRegistryContract.address,
      abi: feedRegistryContract.abi,
      functionName: 'latestRoundData',
      args: [getAssetInfo('USR', network).address, USD_QUOTE],
    },
    {
      address: feedRegistryContract.address,
      abi: feedRegistryContract.abi,
      functionName: 'latestRoundData',
      args: [getAssetInfo('wstUSR', network).address, getAssetInfo('USR', network).address],
    },
  ];
  return calls;
};

export const parseWstETHPriceCalls = (_ethPrice: string, wstETHrateAnswer: string, decimals: string) => {
  const ethPrice = new Dec(_ethPrice).div(1e8);
  const wstETHRate = getEthAmountForDecimals(wstETHrateAnswer, decimals);
  return { ethPrice, wstETHRate };
};

export const parseWrsETHPriceCalls = (ethPriceAnswer: string, wrsETHrateAnswer: string) => {
  const ethPrice = new Dec(ethPriceAnswer).div(1e8);
  const wrsETHRate = new Dec(wrsETHrateAnswer).div(1e18);
  return { ethPrice, wrsETHRate };
};

export const parseSyrupUSDTPriceCalls = (usdtPriceAnswer: string, syrupUSDTRateAnswer: string) => {
  const syrupUSDTRate = new Dec(syrupUSDTRateAnswer).div(1e8);
  const USDTRate = new Dec(usdtPriceAnswer).div(1e18);
  return { syrupUSDTRate, USDTRate };
};

export const parseWstUSRPriceCalls = (usrPrice: string, _wstUSRRate: string) => {
  const wstUSRRate = new Dec(_wstUSRRate).div(1e8);
  const USRRate = new Dec(usrPrice).div(1e18);
  return { wstUSRRate, USRRate };
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
