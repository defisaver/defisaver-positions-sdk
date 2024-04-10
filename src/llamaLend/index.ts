import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import Web3 from 'web3';
import {
  BandData, LlamaLendGlobalMarketData, LlamaLendMarketData, LlamaLendStatus, LlamaLendUsedAssets, LlamaLendUserData,
} from '../types';
import { multicall } from '../multicall';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import { getConfigContractAbi, getConfigContractAddress, LlamaLendViewContract } from '../contracts';
import { getLlamaLendAggregatedData } from '../helpers/llamaLendHelpers';
import { getAbiItem, getEthAmountForDecimals, wethToEth } from '../services/utils';
import { LlamaLendMarkets } from '../markets/llamaLend';
import { USD_QUOTE } from '../constants';

const getAndFormatBands = async (web3: Web3, network: NetworkNumber, selectedMarket: LlamaLendMarketData, _minBand: string, _maxBand: string) => {
  const contract = LlamaLendViewContract(web3, network);
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

export const getLlamaLendGlobalData = async (web3: Web3, network: NetworkNumber, selectedMarket: LlamaLendMarketData): Promise<LlamaLendGlobalMarketData> => {
  const contract = LlamaLendViewContract(web3, network);
  const FeedRegistryAddress = getConfigContractAddress('FeedRegistry', network);
  const FeedRegistryAbi = getConfigContractAbi('FeedRegistry');

  const collAsset = selectedMarket.collAsset;
  const debtAsset = selectedMarket.baseAsset;

  // if something else is needed
  const multicallData = [
    {
      target: FeedRegistryAddress,
      abiItem: getAbiItem(FeedRegistryAbi, 'latestAnswer'),
      params: [getAssetInfo(debtAsset).address, USD_QUOTE],
    },
    {
      target: contract.options.address,
      abiItem: contract.options.jsonInterface.find(({ name }) => name === 'globalData'),
      params: [selectedMarket.controllerAddress],
    },
  ];

  const multiRes = await multicall(multicallData, web3, network);
  const data = multiRes[1][0];
  const debtUsdPrice = getEthAmountForDecimals(multiRes[0][0], 8);
  // all prices are in 18 decimals
  const totalDebt = assetAmountInEth(data.totalDebt, debtAsset);
  const totalDebtSupplied = assetAmountInEth(data.debtTokenTotalSupply, debtAsset);
  const utilization = new Dec(totalDebtSupplied).gt(0)
    ? new Dec(totalDebt).div(totalDebtSupplied).mul(100)
    : 0;
  const ammPrice = assetAmountInEth(data.ammPrice, debtAsset);
  const oraclePrice = getEthAmountForDecimals(data.oraclePrice, 18);

  const rate = assetAmountInEth(data.ammRate);
  const futureRate = assetAmountInEth(data.monetaryPolicyRate);

  const exponentRate = new Dec(rate).mul(365).mul(86400);
  const exponentFutureRate = new Dec(futureRate).mul(365).mul(86400);
  const borrowRate = new Dec(new Dec(2.718281828459).pow(exponentRate).minus(1)).mul(100)
    .toString();
  const futureBorrowRate = new Dec(new Dec(2.718281828459).pow(exponentFutureRate).minus(1)).mul(100)
    .toString();

  const bandsData = await getAndFormatBands(web3, network, selectedMarket, data.minBand, data.maxBand);
  const cap = assetAmountInEth(data.debtTokenTotalSupply, debtAsset);
  const leftToBorrow = getEthAmountForDecimals(data.debtTokenLeftToBorrow, 18);

  const debtInAYearBN = new Dec(totalDebt).mul(new Dec(2.718281828459).pow(exponentRate).toNumber());
  const lendRate = debtInAYearBN.minus(totalDebt).div(cap).mul(100).toString();

  const assetsData:any = {};
  assetsData[debtAsset] = {
    symbol: debtAsset,
    address: data.debtToken,
    price: debtUsdPrice,
    supplyRate: lendRate,
    borrowRate,
    canBeSupplied: true,
    canBeBorrowed: true,
  };

  assetsData[collAsset] = {
    symbol: collAsset,
    address: data.collateralToken,
    price: new Dec(debtUsdPrice).mul(oraclePrice).toString(),
    supplyRate: '0',
    borrowRate: '0',
    canBeSupplied: true,
    canBeBorrowed: false,
  };

  return {
    ...data,
    assetsData,
    totalDebt,
    totalDebtSupplied,
    utilization,
    ammPrice,
    oraclePrice: assetAmountInEth(data.oraclePrice, debtAsset),
    basePrice: assetAmountInEth(data.basePrice, debtAsset),
    minted: assetAmountInEth(data.minted, debtAsset),
    redeemed: assetAmountInEth(data.redeemed, debtAsset),
    borrowRate,
    lendRate,
    futureBorrowRate,
    bands: bandsData,
    leftToBorrow,
  };
};

const getStatusForUser = (bandRange: string[], activeBand: string, debtSupplied: string, collSupplied: string, healthPercent: string) => {
  // if bands are equal, that can only be [0,0] which means user doesn't have loan (min number of bands is 4)
  if (new Dec(bandRange[0]).eq(bandRange[1])) return LlamaLendStatus.Nonexistant;
  // if user doesn't have debtAsset as collateral, then his position is not in soft liquidation
  if (new Dec(debtSupplied).lte(0)) {
    const isHealthRisky = new Dec(healthPercent).lt(10);
    if (new Dec(bandRange[0]).minus(activeBand).lte(3) || isHealthRisky) return LlamaLendStatus.Risk; // if user band is less than 3 bands away from active band, his position is at risk
    return LlamaLendStatus.Safe;
  }
  if (new Dec(bandRange[0]).lte(activeBand) && new Dec(bandRange[1]).gte(activeBand)) return LlamaLendStatus.SoftLiquidating; // user has debtAsset as coll so he is in soft liquidation
  if (new Dec(collSupplied).lte(0) || new Dec(bandRange[1]).lte(activeBand)) return LlamaLendStatus.SoftLiquidated; // or is fully soft liquidated
  return LlamaLendStatus.Nonexistant;
};

export const getLlamaLendAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress, controllerAddress: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const contract = LlamaLendViewContract(web3, network, block);
  const selectedMarket = Object.values(LlamaLendMarkets(network)).find(i => i.controllerAddress.toLowerCase() === controllerAddress.toLowerCase()) as LlamaLendMarketData;

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

export const getLlamaLendUserData = async (web3: Web3, network: NetworkNumber, address: string, selectedMarket: LlamaLendMarketData, marketData: LlamaLendGlobalMarketData): Promise<LlamaLendUserData> => {
  const contract = LlamaLendViewContract(web3, network);
  const { assetsData } = marketData;

  const data = await contract.methods.userData(selectedMarket.controllerAddress, address).call();
  const collAsset = selectedMarket.collAsset;
  const debtAsset = selectedMarket.baseAsset;

  const collPrice = assetsData[collAsset].price;
  const debtPrice = assetsData[debtAsset].price;

  const health = assetAmountInEth(data.health);
  const healthPercent = new Dec(health).mul(100).toString();

  const collSupplied = assetAmountInEth(data.marketCollateralAmount, collAsset);
  const collSuppliedUsd = new Dec(collSupplied).mul(collPrice).toString();

  const debtSupplied = assetAmountInEth(data.debtTokenCollateralAmount, debtAsset);
  const debtSuppliedUsd = new Dec(debtSupplied).mul(debtPrice).toString();

  const debtSuppliedForYield = assetAmountInEth(data.debtTokenSuppliedAssets, debtAsset);
  const debtSuppliedForYieldUsd = new Dec(debtSupplied).mul(debtPrice).toString();

  const debtBorrowed = assetAmountInEth(data.debtAmount, debtAsset);
  const shares = assetAmountInEth(data.debtTokenSuppliedShares, debtAsset);

  const usedAssets: LlamaLendUsedAssets = {
    [collAsset]: {
      isSupplied: new Dec(collSupplied).gt('0'),
      supplied: collSupplied,
      suppliedUsd: collSuppliedUsd,
      borrowed: '0',
      borrowedUsd: '0',
      isBorrowed: false,
      symbol: collAsset,
      collateral: true,
      price: collPrice,
    },
    [debtAsset]: {
      isSupplied: new Dec(debtSupplied).gt('0') || new Dec(debtSuppliedForYield).gt('0'),
      collateral: new Dec(debtSupplied).gt('0'),
      supplied: debtSupplied,
      suppliedUsd: debtSuppliedUsd,
      suppliedForYield: debtSuppliedForYield,
      suppliedForYieldUsd: debtSuppliedForYieldUsd,
      borrowed: debtBorrowed,
      borrowedUsd: debtBorrowed,
      isBorrowed: new Dec(debtBorrowed).gt('0'),
      symbol: debtAsset,
      price: debtPrice,
      shares,
    },
  };

  const priceHigh = assetAmountInEth(data.priceHigh);
  const priceLow = assetAmountInEth(data.priceLow);

  const _userBands = data.loanExists ? (await getAndFormatBands(web3, network, selectedMarket, data.bandRange[0], data.bandRange[1])) : [];

  const status = data.loanExists ? getStatusForUser(data.bandRange, marketData.activeBand, debtSupplied, collSupplied, healthPercent) : LlamaLendStatus.Nonexistant;

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
    ...getLlamaLendAggregatedData({
      loanExists: data.loanExists, usedAssets, network: NetworkNumber.Eth, selectedMarket, numOfBands: data.N,
    }),
    userBands,
  };
};

export const getLlamaLendFullPositionData = async (web3: Web3, network: NetworkNumber, address: string, selectedMarket: LlamaLendMarketData): Promise<LlamaLendUserData> => {
  const marketData = await getLlamaLendGlobalData(web3, network, selectedMarket);
  const positionData = await getLlamaLendUserData(web3, network, address, selectedMarket, marketData);
  return positionData;
};
