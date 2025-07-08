import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  CrvUSDGlobalMarketData, CrvUSDMarketData, CrvUSDStatus, CrvUSDUsedAssets, CrvUSDUserData,
} from '../types';
import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  createViemContractFromConfigFunc, CrvUSDFactoryContractViem, CrvUSDViewContractViem,
} from '../contracts';
import { getCrvUsdAggregatedData } from '../helpers/curveUsdHelpers';
import { CrvUsdMarkets } from '../markets';
import { wethToEth } from '../services/utils';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

const getAndFormatBands = async (provider: Client, network: NetworkNumber, selectedMarket: CrvUSDMarketData, _minBand: string, _maxBand: string) => {
  const contract = CrvUSDViewContractViem(provider, network);
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
    const pivotedBandsData = await contract.read.getBandsData([selectedMarket.controllerAddress, BigInt(start), BigInt(pivot)]);
    return pivotedBandsData;
  }))).flat();

  return bandsData.map((band) => ({
    id: band.id.toString(),
    collAmount: assetAmountInEth(band.collAmount.toString()),
    debtAmount: assetAmountInEth(band.debtAmount.toString()),
    lowPrice: assetAmountInEth(band.lowPrice.toString()),
    highPrice: assetAmountInEth(band.highPrice.toString()),
  }));
};

export const _getCurveUsdGlobalData = async (provider: Client, network: NetworkNumber, selectedMarket: CrvUSDMarketData): Promise<CrvUSDGlobalMarketData> => {
  const contract = CrvUSDViewContractViem(provider, network);
  const factoryContract = CrvUSDFactoryContractViem(provider, network);
  const cntrollerContract = createViemContractFromConfigFunc('crvUSDwstETHController', selectedMarket.controllerAddress)(provider, network);
  const debtAsset = selectedMarket.baseAsset;

  const [debtCeiling, _, data, loanDiscountWei] = await Promise.all([
    factoryContract.read.debt_ceiling([selectedMarket.controllerAddress]),
    factoryContract.read.total_debt(),
    contract.read.globalData([selectedMarket.controllerAddress]),
    cntrollerContract.read.loan_discount(),
  ]);

  // all prices are in 18 decimals
  const totalDebt = assetAmountInEth(data.totalDebt.toString(), debtAsset);
  const ammPrice = assetAmountInEth(data.ammPrice.toString(), debtAsset);

  const rate = assetAmountInEth(data.ammRate.toString());
  const futureRate = assetAmountInEth(data.monetaryPolicyRate.toString());

  const exponentRate = new Dec(rate).mul(365).mul(86400);
  const exponentFutureRate = new Dec(futureRate).mul(365).mul(86400);
  const borrowRate = new Dec(new Dec(2.718281828459).pow(exponentRate).minus(1)).mul(100)
    .toString();
  const futureBorrowRate = new Dec(new Dec(2.718281828459).pow(exponentFutureRate).minus(1)).mul(100)
    .toString();

  const bandsData = await getAndFormatBands(provider, network, selectedMarket, data.minBand.toString(), data.maxBand.toString());

  const leftToBorrow = new Dec(debtCeiling.toString()).minus(totalDebt).toString();

  const loanDiscount = assetAmountInEth(loanDiscountWei.toString(), debtAsset);

  return {
    ...data,
    decimals: data.decimals.toString(),
    activeBand: data.activeBand.toString(),
    monetaryPolicyRate: data.monetaryPolicyRate.toString(),
    ammRate: data.ammRate.toString(),
    minBand: data.minBand.toString(),
    maxBand: data.maxBand.toString(),
    debtCeiling: debtCeiling.toString(),
    totalDebt,
    ammPrice,
    oraclePrice: assetAmountInEth(data.oraclePrice.toString(), debtAsset),
    basePrice: assetAmountInEth(data.basePrice.toString(), debtAsset),
    minted: assetAmountInEth(data.minted.toString(), debtAsset),
    redeemed: assetAmountInEth(data.redeemed.toString(), debtAsset),
    borrowRate,
    futureBorrowRate,
    bands: bandsData,
    leftToBorrow,
    loanDiscount,
  };
};

export const getCurveUsdGlobalData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  selectedMarket: CrvUSDMarketData,
): Promise<CrvUSDGlobalMarketData> => _getCurveUsdGlobalData(getViemProvider(provider, network), network, selectedMarket);

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

export const _getCrvUsdAccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress, controllerAddress: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const contract = CrvUSDViewContractViem(provider, network, block);
  const selectedMarket = Object.values(CrvUsdMarkets(network)).find(i => i.controllerAddress.toLowerCase() === controllerAddress.toLowerCase()) as CrvUSDMarketData;

  const data = await contract.read.userData([selectedMarket.controllerAddress, address], setViemBlockNumber(block));

  balances = {
    collateral: {
      [addressMapping ? getAssetInfo(wethToEth(selectedMarket.collAsset), network).address.toLowerCase() : wethToEth(selectedMarket.collAsset)]: data.marketCollateralAmount.toString(),
    },
    debt: {
      [addressMapping ? getAssetInfo(wethToEth(selectedMarket.baseAsset), network).address.toLowerCase() : wethToEth(selectedMarket.baseAsset)]: data.debtAmount.toString(),
    },
  };

  return balances;
};

export const getCrvUsdAccountBalances = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  address: EthAddress,
  controllerAddress: EthAddress,
): Promise<PositionBalances> => _getCrvUsdAccountBalances(getViemProvider(provider, network), network, block, addressMapping, address, controllerAddress);

export const _getCurveUsdUserData = async (provider: Client, network: NetworkNumber, address: EthAddress, selectedMarket: CrvUSDMarketData, activeBand: string): Promise<CrvUSDUserData> => {
  const contract = CrvUSDViewContractViem(provider, network);

  const data = await contract.read.userData([selectedMarket.controllerAddress, address]);
  const collAsset = selectedMarket.collAsset;
  const debtAsset = selectedMarket.baseAsset;

  const health = assetAmountInEth(data.health.toString());
  const healthPercent = new Dec(health).mul(100).toString();
  const collPrice = assetAmountInEth(data.collateralPrice.toString(), debtAsset);
  const collSupplied = assetAmountInEth(data.marketCollateralAmount.toString(), collAsset);
  const collSuppliedUsd = new Dec(collSupplied).mul(collPrice).toString();
  const crvUSDSupplied = assetAmountInEth(data.curveUsdCollateralAmount.toString(), debtAsset);
  const debtBorrowed = assetAmountInEth(data.debtAmount.toString(), debtAsset);
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

  const priceHigh = assetAmountInEth(data.priceHigh.toString());
  const priceLow = assetAmountInEth(data.priceLow.toString());

  const _userBands = data.loanExists ? (await getAndFormatBands(provider, network, selectedMarket, data.bandRange[0].toString(), data.bandRange[1].toString())) : [];

  const status = data.loanExists ? getStatusForUser(data.bandRange.map(b => b.toString()), activeBand, crvUSDSupplied, collSupplied, healthPercent) : CrvUSDStatus.Nonexistant;

  const userBands = _userBands.map((band, index) => ({
    ...band,
    userDebtAmount: assetAmountInEth(data.usersBands[0][index].toString(), debtAsset),
    userCollAmount: assetAmountInEth(data.usersBands[1][index].toString(), collAsset),
  })).sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));

  return {
    ...data,
    debtAmount: assetAmountInEth(data.debtAmount.toString(), debtAsset),
    health,
    healthPercent,
    priceHigh,
    priceLow,
    liquidationDiscount: assetAmountInEth(data.liquidationDiscount.toString()),
    numOfBands: data.N.toString(),
    usedAssets,
    status,
    ...getCrvUsdAggregatedData({
      loanExists: data.loanExists, usedAssets, network: NetworkNumber.Eth, selectedMarket, numOfBands: data.N.toString(),
    }),
    userBands,
  };
};

export const getCurveUsdUserData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  address: EthAddress,
  selectedMarket: CrvUSDMarketData,
  activeBand: string,
): Promise<CrvUSDUserData> => _getCurveUsdUserData(getViemProvider(provider, network), network, address, selectedMarket, activeBand);

export const getCurveUsdFullPositionData = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress, selectedMarket: CrvUSDMarketData): Promise<CrvUSDUserData> => {
  const marketData = await getCurveUsdGlobalData(provider, network, selectedMarket);
  const positionData = await getCurveUsdUserData(provider, network, address, selectedMarket, marketData.activeBand);
  return positionData;
};
