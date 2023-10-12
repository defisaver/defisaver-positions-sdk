import Web3 from 'web3';
import Dec from 'decimal.js';

import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import {
  Blockish, NetworkNumber, PositionBalances,
} from '../types/common';

import { ChickenBondsManagerContract, ChickenBondsViewContract } from '../contracts';
import { BondInfoBasic, ChickenBondsSystemInfoBasic } from '../types';
import { multicall } from '../multicall';
import { calcAverageBondAgeMs, calcCBondsBLUSDFloorPrice, decodeTokenURIToSvg } from '../helpers/chickenBondsHelpers';

export const getChickenBondsAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, bondId: string): Promise<PositionBalances> => {
  const viewContract = ChickenBondsViewContract(web3, network, block);

  const fullBondInfo = await viewContract.methods.getBondFullInfo(bondId).call({}, block);

  return {
    deposited: {
      [addressMapping ? getAssetInfo('LUSD', network).address.toLowerCase() : 'LUSD']: fullBondInfo.lusdAmount,
    },
  };
};

export const fetchCBondsSystemInfo = async (web3: Web3, network: NetworkNumber): Promise<ChickenBondsSystemInfoBasic> => {
  const cBondsView = ChickenBondsViewContract(web3, network);
  const cBondsManager = ChickenBondsManagerContract(web3, network);
  const multicallData = [
    {
      target: cBondsView.options.address,
      abiItem: cBondsView.options.jsonInterface.find(({ name }) => name === 'getSystemInfo'),
      params: [],
    },
    {
      target: cBondsManager.options.address,
      abiItem: cBondsManager.options.jsonInterface.find(({ name }) => name === 'totalWeightedStartTimes'),
      params: [],
    },
    {
      target: cBondsManager.options.address,
      abiItem: cBondsManager.options.jsonInterface.find(({ name }) => name === 'getAcquiredLUSDInSP'),
      params: [],
    },
    {
      target: cBondsManager.options.address,
      abiItem: cBondsManager.options.jsonInterface.find(({ name }) => name === 'getAcquiredLUSDInCurve'),
      params: [],
    },
    {
      target: cBondsManager.options.address,
      abiItem: cBondsManager.options.jsonInterface.find(({ name }) => name === 'yTokensHeldByCBM'),
      params: [],
    },
  ];
  const [{ 0: systemInfo }, { 0: totalWeightedStartTimes }, { 0: acquiredLUSDInSP }, { 0: acquiredLUSDInCurve }, { 0: yTokensHeldByCBM }] = await multicall(multicallData, web3, network);
  const payload = {
    numPendingBonds: systemInfo.numPendingBonds,
    numChickenInBonds: systemInfo.numChickenInBonds,
    numChickenOutBonds: systemInfo.numChickenOutBonds,
    accrualParameter: new Dec(assetAmountInEth(systemInfo.accrualParameter)).mul(1000).toString(),
    bLUSDSupply: assetAmountInEth(systemInfo.bLUSDSupply, 'bLUSD'),
    chickenInAMMFee: assetAmountInEth(systemInfo.chickenInAMMFee),
    ownedLUSDInCurve: assetAmountInEth(systemInfo.ownedLUSDInCurve, 'LUSD'),
    systemBackingRatio: assetAmountInEth(systemInfo.systemBackingRatio),
    ownedLUSDInSP: assetAmountInEth(systemInfo.ownedLUSDInSP, 'LUSD'),
    totalPendingLUSD: assetAmountInEth(systemInfo.totalPendingLUSD, 'LUSD'),
    totalPermanentLUSD: assetAmountInEth(systemInfo.totalPermanentLUSD, 'LUSD'),
    totalReserveLUSD: assetAmountInEth(systemInfo.totalReserveLUSD, 'LUSD'),
    targetAverageAgeMs: 1296000000,
    totalWeightedStartTimes: assetAmountInEth(totalWeightedStartTimes),
    acquiredLUSDInSP: assetAmountInEth(acquiredLUSDInSP, 'LUSD'),
    acquiredLUSDInCurve: assetAmountInEth(acquiredLUSDInCurve, 'LUSD'),
    yTokensHeldByCBM: assetAmountInEth(yTokensHeldByCBM, 'ETH'), // yTokens is 18 decimals
  };

  const floorPrice = calcCBondsBLUSDFloorPrice(payload.bLUSDSupply, payload.totalReserveLUSD);
  const averageBondAgeMs = calcAverageBondAgeMs(payload.totalWeightedStartTimes, payload.totalPendingLUSD);

  return {
    ...payload,
    floorPrice,
    averageBondAgeMs,
  };
};

export const fetchCBondsForUser = async (web3: Web3, network: NetworkNumber, address: string): Promise<BondInfoBasic[]> => {
  const cBondsView = ChickenBondsViewContract(web3, network);

  const bonds = await cBondsView.methods.getUsersBonds(address).call();

  return bonds.map(({
    bondID, accruedBLUSD, claimedBLUSD, endTime, lusdAmount, maxAmountBLUSD, startTime, status, tokenURI,
  }) => ({
    bondId: bondID,
    status,
    tokenURI: decodeTokenURIToSvg(tokenURI),
    startTime: new Date(+startTime * 1000),
    endTime: new Date(+endTime * 1000),
    accruedBLUSD: assetAmountInEth(accruedBLUSD, 'bLUSD'),
    claimedBLUSD: assetAmountInEth(claimedBLUSD, 'bLUSD'),
    lusdAmount: assetAmountInEth(lusdAmount, 'LUSD'),
    maxAmountBLUSD: assetAmountInEth(maxAmountBLUSD, 'bLUSD'),
  }));
};

export const fetchCBondForId = async (web3: Web3, network: NetworkNumber, bondId: string): Promise<BondInfoBasic> => {
  const cBondsView = ChickenBondsViewContract(web3, network);

  const bond = await cBondsView.methods.getBondFullInfo(bondId).call();

  return {
    bondId,
    status: bond.status,
    startTime: new Date(+bond.startTime * 1000),
    endTime: new Date(+bond.endTime * 1000),
    accruedBLUSD: assetAmountInEth(bond.accruedBLUSD, 'bLUSD'),
    claimedBLUSD: assetAmountInEth(bond.claimedBLUSD, 'bLUSD'),
    lusdAmount: assetAmountInEth(bond.lusdAmount, 'LUSD'),
    maxAmountBLUSD: assetAmountInEth(bond.maxAmountBLUSD, 'bLUSD'),
    tokenURI: decodeTokenURIToSvg(bond.tokenURI),
  };
};
