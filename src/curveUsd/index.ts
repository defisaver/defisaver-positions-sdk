import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import Web3 from 'web3';
import {
  BandData, CrvUSDGlobalMarketData, CrvUSDMarketData, CrvUSDStatus, CrvUSDUsedAssets, CrvUSDUserData, CrvUSDVersions,
} from '../types';
import { multicall } from '../multicall';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import { CrvUSDFactoryContract, CrvUSDViewContract } from '../contracts';
import { getCrvUsdAggregatedData } from '../helpers/curveUsdHelpers';
import { CrvUsdMarkets } from '../markets';
import { wethToEth } from '../services/utils';

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

const getStatusForUser = (bandRange: string[], activeBand: string, crvUSDSupplied: string, collSupplied: string, healthPercent: string) => {
  // if bands are equal, that can only be [0,0] which means user doesn't have loan (min number of bands is 4)
  if (new Dec(bandRange[0]).eq(bandRange[1])) return CrvUSDStatus.Nonexistant;
  // if user doesn't have crvUSD as collateral, then his position is not in soft liquidation
  if (new Dec(crvUSDSupplied).lte(0)) {
    const isHealthRisky = new Dec(healthPercent).lt(10);
    if (new Dec(bandRange[0]).minus(activeBand).lte(3) || isHealthRisky) return CrvUSDStatus.Risk; // if user band is less than 3 bands away from active band, his position is at risk
    return CrvUSDStatus.Safe;
  }
  if (new Dec(bandRange[0]).lte(activeBand) && new Dec(bandRange[1]).gte(activeBand)) return CrvUSDStatus.SoftLiquidating; // user has crvUSD as coll so he is in soft liquidation
  if (new Dec(collSupplied).lte(0) || new Dec(bandRange[1]).lte(activeBand)) return CrvUSDStatus.SoftLiquidated; // or is fully soft liquidated
  return CrvUSDStatus.Nonexistant;
};

export const getCrvUsdAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress, controllerAddress: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const contract = CrvUSDViewContract(web3, network, block);
  const selectedMarket = Object.values(CrvUsdMarkets(network)).find(i => i.controllerAddress.toLowerCase() === controllerAddress.toLowerCase()) as CrvUSDMarketData;

  const data = await contract.methods.userData(selectedMarket.controllerAddress, address).call({}, block);

  balances = {
    collateral: {
      [addressMapping ? getAssetInfo(wethToEth(selectedMarket.collAsset), network).address.toLowerCase() : wethToEth(selectedMarket.collAsset)]: data.marketCollateralAmount,
    },
    debt: {
      [addressMapping ? getAssetInfo(wethToEth(selectedMarket.baseAsset), network).address.toLowerCase() : wethToEth(selectedMarket.baseAsset)]: data.debtAmount,
    },
  };

  return balances;
};

export const getCurveUsdUserData = async (web3: Web3, network: NetworkNumber, address: string, selectedMarket: CrvUSDMarketData, activeBand: string): Promise<CrvUSDUserData> => {
  const contract = CrvUSDViewContract(web3, network);

  const data = await contract.methods.userData(selectedMarket.controllerAddress, address).call();
  const collAsset = selectedMarket.collAsset;
  const debtAsset = selectedMarket.baseAsset;

  const health = assetAmountInEth(data.health);
  const healthPercent = new Dec(health).mul(100).toString();
  const collPrice = assetAmountInEth(data.collateralPrice, debtAsset);
  const collSupplied = assetAmountInEth(data.marketCollateralAmount, collAsset);
  const collSuppliedUsd = new Dec(collSupplied).mul(collPrice).toString();
  const crvUSDSupplied = assetAmountInEth(data.curveUsdCollateralAmount, debtAsset);
  const debtBorrowed = assetAmountInEth(data.debtAmount, debtAsset);
  const usedAssets: CrvUSDUsedAssets = data.loanExists ? {
    [collAsset]: {
      isSupplied: true,
      supplied: collSupplied,
      suppliedUsd: collSuppliedUsd, // need oracle price, or amm price
      borrowed: '0',
      borrowedUsd: '0',
      isBorrowed: false,
      symbol: collAsset,
      collateral: true,
      price: collPrice, // price_amm
    },
    [debtAsset]: {
      isSupplied: new Dec(crvUSDSupplied).gt('0'),
      collateral: new Dec(crvUSDSupplied).gt('0'),
      supplied: crvUSDSupplied,
      suppliedUsd: crvUSDSupplied,
      borrowed: debtBorrowed,
      borrowedUsd: debtBorrowed,
      isBorrowed: new Dec(debtBorrowed).gt('0'),
      symbol: 'crvUSD',
      price: '1',
      interestRate: '0',
    },
  } : {};

  const priceHigh = assetAmountInEth(data.priceHigh);
  const priceLow = assetAmountInEth(data.priceLow);

  const _userBands = data.loanExists ? (await getAndFormatBands(web3, network, selectedMarket, data.bandRange[0], data.bandRange[1])) : [];

  const status = data.loanExists ? getStatusForUser(data.bandRange, activeBand, crvUSDSupplied, collSupplied, healthPercent) : CrvUSDStatus.Nonexistant;

  const userBands = _userBands.map((band, index) => ({
    ...band,
    userDebtAmount: assetAmountInEth(data.usersBands[0][index], debtAsset),
    userCollAmount: assetAmountInEth(data.usersBands[1][index], collAsset),
  })).sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));

  return {
    ...data,
    debtAmount: assetAmountInEth(data.debtAmount, debtAsset),
    health,
    healthPercent,
    priceHigh,
    priceLow,
    liquidationDiscount: assetAmountInEth(data.liquidationDiscount),
    numOfBands: data.N,
    usedAssets,
    status,
    ...getCrvUsdAggregatedData({
      loanExists: data.loanExists, usedAssets, network: NetworkNumber.Eth, selectedMarket, numOfBands: data.N,
    }),
    userBands,
  };
};

export const getCurveUsdFullPositionData = async (web3: Web3, network: NetworkNumber, address: string, selectedMarket: CrvUSDMarketData): Promise<CrvUSDUserData> => {
  const marketData = await getCurveUsdGlobalData(web3, network, selectedMarket);
  const positionData = await getCurveUsdUserData(web3, network, address, selectedMarket, marketData.activeBand);
  return positionData;
};