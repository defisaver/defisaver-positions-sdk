import Dec from 'decimal.js';
import { getWeb3 } from '../web3';
import { CbEthContract, LidoContract, REthContract } from '../contracts';
import { NetworkNumber } from '../types/common';
import { TokenRebased } from '../types/contracts/generated/Lido';
import { ContractEventLog } from '../types/contracts/generated/types';

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
const AVG_BLOCK_TIME = 12;
const BLOCKS_IN_A_YEAR = SECONDS_PER_YEAR / AVG_BLOCK_TIME;

export const getStETHApr = async (fromBlock = 17900000, blockNumber: 'latest' | number = 'latest') => {
  try {
    const web3 = getWeb3(NetworkNumber.Eth);
    const tokenRebasedEvents: ContractEventLog<{ [key: string]: any }>[] = await LidoContract(web3, NetworkNumber.Eth).getPastEvents('TokenRebased', { fromBlock, toBlock: blockNumber });
    tokenRebasedEvents.sort((a, b) => b.blockNumber - a.blockNumber); // sort from highest to lowest block number
    const movingAverage = 7;
    const aprs = tokenRebasedEvents.slice(0, movingAverage).map(({ returnValues: event }) => {
      const preShareRate = new Dec(event.preTotalEther.toString()).div(event.preTotalShares.toString());
      const postShareRate = new Dec(event.postTotalEther.toString()).div(event.postTotalShares.toString());
      return new Dec(SECONDS_PER_YEAR).mul(new Dec(postShareRate).sub(preShareRate).div(preShareRate))
        .div(event.timeElapsed.toString()).mul(100)
        .toNumber();
    });
    return aprs.reduce((a, b) => a + b, 0) / aprs.length;
  } catch (e) {
    console.warn('Failed to fetch stETH APY from events, falling back to Lido API');
    const res = await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma');
    const data = await res.json();
    return data.data.smaApr;
  }
};


export const getCbETHApr = async (blockNumber: 'latest' | number = 'latest') => {
  let currentBlock = blockNumber;
  const web3 = getWeb3(NetworkNumber.Eth);
  if (blockNumber === 'latest') currentBlock = await web3.eth.getBlockNumber();
  const blockDiff = 6 * 24 * 60 * 60 / AVG_BLOCK_TIME;
  const pastBlock = (currentBlock as number) - blockDiff;
  const contract = CbEthContract(web3, NetworkNumber.Eth);
  const [pastRate, currentRate] = await Promise.all([
    contract.methods.exchangeRate().call({}, pastBlock),
    contract.methods.exchangeRate().call({}, currentBlock),
  ]);
  const apr = new Dec(currentRate.toString()).sub(pastRate.toString()).div(currentRate.toString())
    .mul(BLOCKS_IN_A_YEAR / blockDiff)
    .mul(100)
    .toString();
  return apr;
};


export const getREthApr = async (blockNumber: 'latest' | number = 'latest') => {
  let currentBlock = blockNumber;
  const web3 = getWeb3(NetworkNumber.Eth);
  if (blockNumber === 'latest') currentBlock = await getWeb3(NetworkNumber.Eth).eth.getBlockNumber();
  const blockDiff = 8 * 24 * 60 * 60 / AVG_BLOCK_TIME;
  const pastBlock = (currentBlock as number) - blockDiff;
  const contract = REthContract(web3, NetworkNumber.Eth);
  const [pastRate, currentRate] = await Promise.all([
    contract.methods.getExchangeRate().call({}, pastBlock),
    contract.methods.getExchangeRate().call({}, currentBlock),
  ]);
  const apr = new Dec(currentRate.toString()).sub(pastRate.toString()).div(currentRate.toString())
    .mul(BLOCKS_IN_A_YEAR / blockDiff)
    .mul(100)
    .toString();

  return apr;
};

export const getStakingApy = (asset: string, blockNumber: 'latest' | number = 'latest', fromBlock: number | undefined = undefined) => {
  if (asset === 'stETH' || asset === 'wstETH') return getStETHApr(fromBlock, blockNumber);
  if (asset === 'cbETH') return getCbETHApr(blockNumber);
  if (asset === 'rETH') return getREthApr(blockNumber);
};