import Web3 from 'web3';
import Dec from 'decimal.js';
import { NetworkNumber } from '../../types/common';
import {
  McdDogContract, McdJugContract, McdSpotterContract, McdVatContract,
} from '../../contracts';
import { multicall } from '../../multicall';
import { SECONDS_PER_YEAR } from '../../constants';
import { bytesToString } from '../../services/utils';
import { IlkInfo } from '../../types';

export const getUnclaimedCollateral = async (web3: Web3, network: NetworkNumber, urn: string, ilk: string) => {
  const vatContract = McdVatContract(web3, network);
  const coll = await vatContract.methods.gem(ilk, urn).call();
  return coll;
};

export const getCollateralInfo = async (ilk: string, web3: Web3, network: NetworkNumber): Promise<IlkInfo> => {
  const spotterContract = McdSpotterContract(web3, network);
  const vatContract = McdVatContract(web3, network);
  const dogContract = McdDogContract(web3, network);
  const jugContract = McdJugContract(web3, network);

  const multicallData = [
    {
      target: spotterContract.options.address,
      abiItem: spotterContract.options.jsonInterface.find(({ name }) => name === 'par'),
      params: [],
    },
    {
      target: spotterContract.options.address,
      abiItem: spotterContract.options.jsonInterface.find(({ name }) => name === 'ilks'),
      params: [ilk],
    },
    {
      target: vatContract.options.address,
      abiItem: vatContract.options.jsonInterface.find(({ name }) => name === 'ilks'),
      params: [ilk],
    },
    {
      target: jugContract.options.address,
      abiItem: jugContract.options.jsonInterface.find(({ name }) => name === 'ilks'),
      params: [ilk],
    },
    {
      target: jugContract.options.address,
      abiItem: jugContract.options.jsonInterface.find(({ name }) => name === 'drip'),
      params: [ilk],
    },
    {
      target: dogContract.options.address,
      abiItem: dogContract.options.jsonInterface.find(({ name }) => name === 'chop'),
      params: [ilk],
    },
  ];

  const multiRes = await multicall(multicallData, web3, network);

  const par = new Dec(multiRes[0][0].toString()).div(1e27).toString();
  const mat = new Dec(multiRes[1][1].toString()).div(1e27).toString();
  const art = new Dec(multiRes[2][0].toString()).toString();
  const rate = new Dec(multiRes[2][1].toString()).toString();
  const spot = new Dec(multiRes[2][2].toString()).div(1e27).toString();
  const line = new Dec(multiRes[2][3].toString()).div(1e45).toString();
  const dust = new Dec(multiRes[2][1].toString()).div(1e45).toString();
  const duty = new Dec(multiRes[3][0].toString()).toString();
  const futureRate = new Dec(multiRes[4][0].toString()).toString();
  const chop = new Dec(multiRes[5][0].toString()).div(1e18).toString();

  const stabilityFee = new Dec(duty.toString())
    .div(1e27)
    .pow(SECONDS_PER_YEAR)
    .minus(1)
    .mul(100)
    .toNumber();
  const liquidationFee = new Dec(chop).mul(100).sub(100).toString();
  const globalDebtCurrent = new Dec(art).div(1e18).mul(new Dec(futureRate).div(1e27)).toString();
  const globalDebtCeiling = line;
  const creatableDebt = new Dec(globalDebtCeiling).sub(globalDebtCurrent).toString();

  return {
    ilkLabel: bytesToString(ilk),
    currentRate: rate,
    futureRate,
    minDebt: dust,
    globalDebtCurrent,
    globalDebtCeiling,
    assetPrice: new Dec(spot).times(par).times(mat).toString(),
    liqRatio: mat,
    liqPercent: +mat * 100,
    stabilityFee,
    liquidationFee: new Dec(liquidationFee).lt(0) ? '0' : liquidationFee,
    creatableDebt,
  };
};