import Dec from 'decimal.js';
import Web3 from 'web3';
import {
  CbEthContract, LidoContract, PotContract, REthContract, wstETHContract,
} from '../contracts';
import { MMAssetsData, MMUsedAssets, NetworkNumber } from '../types/common';
import { ContractEventLog } from '../types/contracts/generated/types';
import { BLOCKS_IN_A_YEAR, SECONDS_PER_YEAR, AVG_BLOCK_TIME } from '../constants';
import { multicall } from '../multicall';


export const getStETHApr = async (web3: Web3, fromBlock = 17900000, blockNumber: 'latest' | number = 'latest') => {
  try {
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


export const getCbETHApr = async (web3: Web3, blockNumber: 'latest' | number = 'latest') => {
  let currentBlock = blockNumber;
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


export const getREthApr = async (web3: Web3, blockNumber: 'latest' | number = 'latest') => {
  let currentBlock = blockNumber;
  if (blockNumber === 'latest') currentBlock = await web3.eth.getBlockNumber();
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

export const getDsrApy = async (web3: Web3, blockNumber: 'latest' | number = 'latest') => {
  const potContract = PotContract(web3, NetworkNumber.Eth);
  return new Dec(await potContract.methods.dsr().call())
    .div(new Dec(1e27))
    .pow(SECONDS_PER_YEAR)
    .sub(1)
    .mul(100)
    .toString();
};

const getSuperOETHApy = async () => {
  console.log('getSuperOETHApy');
  const res = await fetch('https://origin.squids.live/origin-squid/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: '\n    query OTokenApy($chainId: Int!, $token: String!) {\n  oTokenApies(\n    limit: 1\n    orderBy: timestamp_DESC\n    where: {chainId_eq: $chainId, otoken_containsInsensitive: $token}\n  ) {\n    apy7DayAvg\n    apy14DayAvg\n    apy30DayAvg\n    apr\n    apy\n  }\n}\n    ',
      variables: {
        token: '0xdbfefd2e8460a6ee4955a68582f85708baea60a3',
        chainId: 8453,
      },
    }),
  });

  const data = await res.json();
  return data.data.oTokenApies[0].apy.toString();
};

const getApyFromDfsApi = async (asset: string) => {
  const res = await fetch(`https://app.defisaver.com/api/staking/apy?asset=${asset}`);
  const data = await res.json();
  return data.apy;
};

export const STAKING_ASSETS = ['cbETH', 'wstETH', 'cbETH', 'rETH', 'sDAI', 'weETH', 'sUSDe', 'osETH', 'ezETH', 'ETHx', 'rsETH', 'pufETH', 'wrsETH', 'wsuperOETHb'];

export const getStakingApy = (asset: string, web3: Web3, blockNumber: 'latest' | number = 'latest', fromBlock: number | undefined = undefined) => {
  console.log('getStakingApy', asset, blockNumber, fromBlock);
  try {
    if (asset === 'stETH' || asset === 'wstETH') return getStETHApr(web3, fromBlock, blockNumber);
    if (asset === 'cbETH') return getCbETHApr(web3, blockNumber);
    if (asset === 'rETH') return getREthApr(web3, blockNumber);
    if (asset === 'sDAI') return getDsrApy(web3);
    if (asset === 'sUSDe') return getApyFromDfsApi('sUSDe');
    if (asset === 'weETH') return getApyFromDfsApi('weETH');
    if (asset === 'ezETH') return getApyFromDfsApi('ezETH');
    if (asset === 'osETH') return getApyFromDfsApi('osETH');
    if (asset === 'ETHx') return getApyFromDfsApi('ETHx');
    if (asset === 'rsETH' || asset === 'wrsETH') return getApyFromDfsApi('rsETH');
    if (asset === 'pufETH') return getApyFromDfsApi('pufETH');
    if (asset === 'wsuperOETHb') return getSuperOETHApy();
  } catch (e) {
    console.error(`Failed to fetch APY for ${asset}`);
    return '0';
  }
};

export const calculateInterestEarned = (principal: string, interest: string, type: string, apy = false) => {
  let interval = 1;

  if (+interest === 0) return 0;

  if (type === 'month') interval = 1 / 12;
  if (type === 'week') interval = 1 / 52.1429;

  if (apy) {
    // interest rate already compounded
    return (+principal * (1 + (+interest / 100 * interval))) - +principal;
  }

  return (+principal * (((1 + (+interest / 100) / BLOCKS_IN_A_YEAR)) ** (BLOCKS_IN_A_YEAR * interval))) - +principal; // eslint-disable-line
};

export const calculateNetApy = (usedAssets: MMUsedAssets, assetsData: MMAssetsData, isMorpho = false) => {
  const sumValues = Object.values(usedAssets).reduce((_acc, usedAsset) => {
    const acc = { ..._acc };
    const assetData = assetsData[usedAsset.symbol];

    if (usedAsset.isSupplied) {
      const amount = usedAsset.suppliedUsd;
      acc.suppliedUsd = new Dec(acc.suppliedUsd).add(amount).toString();
      const rate = isMorpho
        ? usedAsset.supplyRate === '0' ? assetData.supplyRateP2P : usedAsset.supplyRate
        : assetData.supplyRate;
      const supplyInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.supplyInterest = new Dec(acc.supplyInterest).add(supplyInterest.toString()).toString();
      if (assetData.incentiveSupplyApy) {
        // take COMP/AAVE yield into account
        const incentiveInterest = calculateInterestEarned(amount, assetData.incentiveSupplyApy, 'year', true);
        acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
      }
    }

    if (usedAsset.isBorrowed) {
      const amount = usedAsset.borrowedUsd;
      acc.borrowedUsd = new Dec(acc.borrowedUsd).add(amount).toString();
      const rate = isMorpho
        ? usedAsset.borrowRate === '0' ? assetData.borrowRateP2P : usedAsset.borrowRate
        : usedAsset.symbol === 'GHO'
          ? usedAsset.discountedBorrowRate
          : (usedAsset?.interestMode === '1' ? usedAsset.stableBorrowRate : assetData.borrowRate);
      const borrowInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.borrowInterest = new Dec(acc.borrowInterest).sub(borrowInterest.toString()).toString();
      if (assetData.incentiveBorrowApy) {
        // take COMP/AAVE yield into account
        const incentiveInterest = calculateInterestEarned(amount, assetData.incentiveBorrowApy, 'year', true);
        acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
      }
    }

    return acc;
  }, {
    borrowInterest: '0', supplyInterest: '0', incentiveUsd: '0', borrowedUsd: '0', suppliedUsd: '0',
  });

  const {
    borrowedUsd, suppliedUsd, borrowInterest, supplyInterest, incentiveUsd,
  } = sumValues;

  const totalInterestUsd = new Dec(borrowInterest).add(supplyInterest).add(incentiveUsd).toString();
  const balance = new Dec(suppliedUsd).sub(borrowedUsd);
  const netApy = new Dec(totalInterestUsd).div(balance).times(100).toString();

  return { netApy, totalInterestUsd, incentiveUsd };
};

export const getWstETHByStETH = async (stETHAmount: string | number, web3: Web3) => wstETHContract(web3, NetworkNumber.Eth).methods.getWstETHByStETH(stETHAmount).call();

export const getStETHByWstETH = async (wstETHAmount: string | number, web3: Web3) => wstETHContract(web3, NetworkNumber.Eth).methods.getStETHByWstETH(wstETHAmount).call();

export const getStETHByWstETHMultiple = async (wstEthAmounts: string[] | number[], web3: Web3) => {
  const contract = wstETHContract(web3, NetworkNumber.Eth);
  const calls = wstEthAmounts.map((amount) => ({
    target: contract.options.address,
    abiItem: contract.options.jsonInterface.find((i) => i.name === 'getStETHByWstETH'),
    params: [amount],
  }));
  const stEthAmounts = await multicall(calls, web3);
  return stEthAmounts.map((arr) => arr[0]);
};
