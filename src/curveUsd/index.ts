import Dec from 'decimal.js';
import { assetAmountInEth } from '@defisaver/tokens';
import Web3 from 'web3';
import { BandData, CrvUSDGlobalMarketData, CrvUSDMarketData } from '../types';
import { multicall } from '../multicall';
import { NetworkNumber } from '../types/common';
import { CrvUSDFactoryContract, CrvUSDViewContract } from '../contracts';

const getAndFormatBands = async (web3: Web3, network: NetworkNumber, selectedMarket: CrvUSDMarketData, _minBand: string, _maxBand: string) => {
  const contract = CrvUSDViewContract(web3, network);
  const minBand = parseInt(_minBand, 10);
  const maxBand = parseInt(_maxBand, 10);
  const pivots: number[] = [];

  // getBandsData uses a lot of gas to get all of the bands at once, so we use pagination and fetch 200 bands at a time
  let i = minBand;
  while (i < maxBand) {
    i += 200;
    if (i > maxBand) {
      pivots.push(maxBand);
    } else {
      pivots.push(i);
    }
  }

  const bandsData = (await Promise.all(pivots.map(async (pivot, index) => {
    let start = 0;
    if (index === 0) {
      start = minBand;
    } else {
      start = pivots[index - 1] + 1;
    }
    // @ts-ignore
    const pivotedBandsData = await contract.methods.getBandsData(selectedMarket.controllerAddress, start, pivot).call();
    return pivotedBandsData;
  }))).flat();

  return bandsData.map((band: BandData) => ({
    id: band.id,
    collAmount: assetAmountInEth(band.collAmount),
    debtAmount: assetAmountInEth(band.debtAmount),
    lowPrice: assetAmountInEth(band.lowPrice),
    highPrice: assetAmountInEth(band.highPrice),
  }));
};

export const getCurveUsdGlobalData = async (web3: Web3, network: NetworkNumber, selectedMarket: CrvUSDMarketData): Promise<CrvUSDGlobalMarketData> => {
  const contract = CrvUSDViewContract(web3, network);
  const factoryContract = CrvUSDFactoryContract(web3, network);
  const collAsset = selectedMarket.collAsset;
  const debtAsset = selectedMarket.baseAsset;

  const multicallData = [
    {
      target: factoryContract.options.address,
      abiItem: factoryContract.options.jsonInterface.find(({ name }) => name === 'debt_ceiling'),
      params: [selectedMarket.controllerAddress],
    },
    {
      target: factoryContract.options.address,
      abiItem: factoryContract.options.jsonInterface.find(({ name }) => name === 'total_debt'),
      params: [],
    },
    {
      target: contract.options.address,
      abiItem: contract.options.jsonInterface.find(({ name }) => name === 'globalData'),
      params: [selectedMarket.controllerAddress],
    },
  ];
  const multiRes = await multicall(multicallData, web3, network);
  const data = multiRes[2][0];
  const debtCeiling = assetAmountInEth(multiRes[0][0], debtAsset);

  // all prices are in 18 decimals
  const totalDebt = assetAmountInEth(data.totalDebt, debtAsset);
  const ammPrice = assetAmountInEth(data.ammPrice, debtAsset);

  const rate = assetAmountInEth(data.ammRate);
  const futureRate = assetAmountInEth(data.monetaryPolicyRate);

  const exponentRate = new Dec(rate).mul(365).mul(86400);
  const exponentFutureRate = new Dec(futureRate).mul(365).mul(86400);
  const borrowRate = new Dec(new Dec(2.718281828459).pow(exponentRate).minus(1)).mul(100)
    .toString();
  const futureBorrowRate = new Dec(new Dec(2.718281828459).pow(exponentFutureRate).minus(1)).mul(100)
    .toString();

  const bandsData = await getAndFormatBands(web3, network, selectedMarket, data.minBand, data.maxBand);

  const leftToBorrow = new Dec(debtCeiling).minus(totalDebt).toString();
  return {
    ...data,
    debtCeiling,
    totalDebt,
    ammPrice,
    oraclePrice: assetAmountInEth(data.oraclePrice, debtAsset),
    basePrice: assetAmountInEth(data.basePrice, debtAsset),
    minted: assetAmountInEth(data.minted, debtAsset),
    redeemed: assetAmountInEth(data.redeemed, debtAsset),
    borrowRate,
    futureBorrowRate,
    bands: bandsData,
    leftToBorrow,
  };
};