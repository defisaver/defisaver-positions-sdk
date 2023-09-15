import Dec from 'decimal.js';
import { getWeb3 } from '../web3';
import { CbEthContract, LidoContract, REthContract } from '../contracts';
import { NetworkNumber } from '../types/common';
import { TokenRebased } from '../types/contracts/generated/Lido';
import { ContractEventLog } from '../types/contracts/generated/types';
import { AaveV3AssetsData, AaveV3MarketData, AaveV3UsedAssets } from '../aaveV3';

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

export const calculateNetApy = (usedAssets: AaveV3UsedAssets, assetsData: AaveV3AssetsData, isMorpho = false) => {
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