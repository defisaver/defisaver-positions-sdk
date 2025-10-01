import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  LlamaLendAssetsData,
  LlamaLendGlobalMarketData, LlamaLendMarketData, LlamaLendStatus, LlamaLendUsedAssets, LlamaLendUserData,
} from '../types';
import {
  Blockish, EthAddress, EthereumProvider, IncentiveKind, NetworkNumber, PositionBalances,
} from '../types/common';
import { LlamaLendViewContractViem } from '../contracts';
import { getLlamaLendAggregatedData } from '../helpers/llamaLendHelpers';
import { getEthAmountForDecimals, wethToEth } from '../services/utils';
import { getLlamaLendMarketFromControllerAddress } from '../markets/llamaLend';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

const getAndFormatBands = async (provider: Client, network: NetworkNumber, selectedMarket: LlamaLendMarketData, _minBand: string, _maxBand: string) => {
  const contract = LlamaLendViewContractViem(provider, network);
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

export const _getLlamaLendGlobalData = async (provider: Client, network: NetworkNumber, selectedMarket: LlamaLendMarketData): Promise<LlamaLendGlobalMarketData> => {
  const contract = LlamaLendViewContractViem(provider, network);

  const collAsset = selectedMarket.collAsset;
  const debtAsset = selectedMarket.baseAsset;

  const data = await contract.read.globalData([selectedMarket.controllerAddress]);

  // all prices are in 18 decimals
  const oraclePrice = getEthAmountForDecimals(data.oraclePrice.toString(), 18);
  const collPriceUsd = collAsset === 'crvUSD' ? '1' : new Dec(1).mul(oraclePrice).toDP(18).toString();
  const debtPriceUsd = debtAsset === 'crvUSD' ? '1' : new Dec(1).div(oraclePrice).toDP(18).toString();

  const totalDebt = assetAmountInEth(data.totalDebt.toString(), debtAsset);
  const totalDebtSupplied = assetAmountInEth(data.debtTokenTotalSupply.toString(), debtAsset);
  const utilization = new Dec(totalDebtSupplied).gt(0)
    ? new Dec(totalDebt).div(totalDebtSupplied).mul(100).toString()
    : '0';
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
  const cap = assetAmountInEth(data.debtTokenTotalSupply.toString(), debtAsset);
  const leftToBorrow = getEthAmountForDecimals(data.debtTokenLeftToBorrow.toString(), 18);

  const debtInAYearBN = new Dec(totalDebt).mul(new Dec(2.718281828459).pow(exponentRate).toNumber());
  const lendRate = debtInAYearBN.minus(totalDebt).div(cap).mul(100).toString();

  const assetsData: LlamaLendAssetsData = {};
  assetsData[debtAsset] = {
    symbol: debtAsset,
    address: data.debtToken,
    price: debtPriceUsd,
    supplyRate: lendRate,
    borrowRate,
    canBeSupplied: true,
    canBeBorrowed: true,
    supplyIncentives: [],
    borrowIncentives: [],
  };

  assetsData[collAsset] = {
    symbol: collAsset,
    address: data.collateralToken,
    price: collPriceUsd,
    supplyRate: '0',
    borrowRate: '0',
    canBeSupplied: true,
    canBeBorrowed: false,
    supplyIncentives: [],
    borrowIncentives: [],
  };

  if (STAKING_ASSETS.includes(collAsset)) {
    assetsData[collAsset].supplyIncentives.push({
      apy: await getStakingApy(collAsset),
      token: collAsset,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${collAsset} yield.`,
    });
  }

  return {
    A: data.A.toString(),
    loanDiscount: data.loanDiscount.toString(),
    activeBand: data.activeBand.toString(),
    monetaryPolicyRate: data.monetaryPolicyRate.toString(),
    ammRate: data.ammRate.toString(),
    minBand: data.minBand.toString(),
    maxBand: data.maxBand.toString(),
    assetsData,
    totalDebt,
    totalDebtSupplied,
    utilization,
    ammPrice,
    oraclePrice: assetAmountInEth(data.oraclePrice.toString(), debtAsset),
    basePrice: assetAmountInEth(data.basePrice.toString(), debtAsset),
    minted: assetAmountInEth(data.minted.toString(), debtAsset),
    redeemed: assetAmountInEth(data.redeemed.toString(), debtAsset),
    borrowRate,
    lendRate,
    futureBorrowRate,
    bands: bandsData,
    leftToBorrow,
  };
};

export const getLlamaLendGlobalData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  selectedMarket: LlamaLendMarketData,
): Promise<LlamaLendGlobalMarketData> => _getLlamaLendGlobalData(getViemProvider(provider, network), network, selectedMarket);

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

export const _getLlamaLendAccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress, controllerAddress: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const contract = LlamaLendViewContractViem(provider, network, block);

  const selectedMarket = getLlamaLendMarketFromControllerAddress(controllerAddress, network);
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

export const getLlamaLendAccountBalances = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  address: EthAddress,
  controllerAddress: EthAddress,
): Promise<PositionBalances> => _getLlamaLendAccountBalances(getViemProvider(provider, network), network, block, addressMapping, address, controllerAddress);

export const _getLlamaLendUserData = async (provider: Client, network: NetworkNumber, address: EthAddress, selectedMarket: LlamaLendMarketData, marketData: LlamaLendGlobalMarketData): Promise<LlamaLendUserData> => {
  const contract = LlamaLendViewContractViem(provider, network);
  const { assetsData } = marketData;

  const data = await contract.read.userData([selectedMarket.controllerAddress, address]);
  const collAsset = selectedMarket.collAsset;
  const debtAsset = selectedMarket.baseAsset;

  const collPrice = assetsData[collAsset].price;
  const debtPrice = assetsData[debtAsset].price;

  const health = assetAmountInEth(data.health.toString());
  const healthPercent = new Dec(health).mul(100).toString();

  const collSupplied = assetAmountInEth(data.marketCollateralAmount.toString(), collAsset);
  const collSuppliedUsd = new Dec(collSupplied).mul(collPrice).toString();

  const debtSupplied = assetAmountInEth(data.debtTokenCollateralAmount.toString(), debtAsset);
  const debtSuppliedUsd = new Dec(debtSupplied).mul(debtPrice).toString();

  const debtSuppliedForYield = assetAmountInEth(data.debtTokenSuppliedAssets.toString(), debtAsset);
  const debtSuppliedForYieldUsd = new Dec(debtSupplied).mul(debtPrice).toString();

  const debtBorrowed = assetAmountInEth(data.debtAmount.toString(), debtAsset);
  const debtBorrowedUsd = new Dec(debtBorrowed).mul(debtPrice).toString();
  const shares = assetAmountInEth(data.debtTokenSuppliedShares.toString(), debtAsset);

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
      borrowedUsd: debtBorrowedUsd,
      isBorrowed: new Dec(debtBorrowed).gt('0'),
      symbol: debtAsset,
      price: debtPrice,
      shares,
    },
  };

  const priceHigh = assetAmountInEth(data.priceHigh.toString());
  const priceLow = assetAmountInEth(data.priceLow.toString());

  const _userBands = data.loanExists ? (await getAndFormatBands(provider, network, selectedMarket, data.bandRange[0].toString(), data.bandRange[1].toString())) : [];

  const status = data.loanExists ? getStatusForUser(data.bandRange.map(b => b.toString()), marketData.activeBand, debtSupplied, collSupplied, healthPercent) : LlamaLendStatus.Nonexistant;

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
    ...getLlamaLendAggregatedData({
      loanExists: data.loanExists, usedAssets, network: NetworkNumber.Eth, selectedMarket, numOfBands: data.N.toString(), assetsData,
    }),
    userBands,
  };
};

export const getLlamaLendUserData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  address: EthAddress,
  selectedMarket: LlamaLendMarketData,
  marketData: LlamaLendGlobalMarketData,
): Promise<LlamaLendUserData> => _getLlamaLendUserData(getViemProvider(provider, network), network, address, selectedMarket, marketData);

export const getLlamaLendFullPositionData = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress, selectedMarket: LlamaLendMarketData): Promise<LlamaLendUserData> => {
  const marketData = await getLlamaLendGlobalData(provider, network, selectedMarket);
  const positionData = await getLlamaLendUserData(provider, network, address, selectedMarket, marketData);
  return positionData;
};
