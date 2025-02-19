import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import { EthAddress, NetworkNumber } from '../types/common';
import {
  FluidAggregatedVaultData,
  FluidAssetData, FluidAssetsData,
  FluidMarketData,
  FluidMarketInfo,
  FluidUsedAsset,
  FluidUsedAssets,
  FluidVaultData,
  FluidVaultType, InnerFluidMarketData,
} from '../types';
import { DFSFeedRegistryContract, FeedRegistryContract, FluidViewContract } from '../contracts';
import { getEthAmountForDecimals, isMainnetNetwork } from '../services/utils';
import { getFluidAggregatedData } from '../helpers/fluidHelpers';
import { FluidView } from '../types/contracts/generated';
import { chunkAndMulticall } from '../multicall';
import { getFluidMarketInfoById, getFluidVersionsDataForNetwork, getFTokenAddress } from '../markets';
import { USD_QUOTE } from '../constants';
import { getChainlinkAssetAddress, getWstETHPriceFluid } from '../services/priceService';

export const EMPTY_USED_ASSET = {
  isSupplied: false,
  isBorrowed: false,
  supplied: '0',
  suppliedUsd: '0',
  borrowed: '0',
  borrowedUsd: '0',
  symbol: '',
  collateral: false,
};

const parseVaultType = (vaultType: number) => {
  switch (vaultType) {
    case 10000: return FluidVaultType.T1;
    case 20000: return FluidVaultType.T2;
    case 30000: return FluidVaultType.T3;
    case 40000: return FluidVaultType.T4;
    default: return FluidVaultType.Unknown;
  }
};

const parseMarketData = async (web3: Web3, data: FluidView.VaultDataStructOutputStruct, network: NetworkNumber) => {
  const collAsset = getAssetInfoByAddress(data.supplyToken0, network);
  const debtAsset = getAssetInfoByAddress(data.borrowToken0, network);

  const supplyRate = new Dec(data.supplyRateVault).div(100).toString();
  const borrowRate = new Dec(data.borrowRateVault).div(100).toString();

  const oracleScaleFactor = new Dec(27).add(debtAsset.decimals).sub(collAsset.decimals).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();
  const oraclePrice = new Dec(data.oraclePriceOperate).div(oracleScale).toString();

  const isTokenUSDA = debtAsset.symbol === 'USDA';
  const isMainnet = isMainnetNetwork(network);
  const loanTokenFeedAddress = getChainlinkAssetAddress(debtAsset.symbol, network);

  let loanTokenPrice;
  if (debtAsset.symbol === 'wstETH') {
    // need to handle wstETH for l2s inside getWstETHPrice
    loanTokenPrice = await getWstETHPriceFluid(web3, network);
  } else if (isMainnet) {
    const feedRegistryContract = FeedRegistryContract(web3, NetworkNumber.Eth);
    loanTokenPrice = isTokenUSDA ? '100000000' : await feedRegistryContract.methods.latestAnswer(loanTokenFeedAddress, USD_QUOTE).call();
  } else {
    // Currently only base network is supported
    const feedRegistryContract = DFSFeedRegistryContract(web3, network);
    const roundPriceData = isTokenUSDA ? { answer: '100000000' } : await feedRegistryContract.methods.latestRoundData(loanTokenFeedAddress, USD_QUOTE).call();
    loanTokenPrice = roundPriceData.answer;
  }

  const debtPriceParsed = new Dec(loanTokenPrice).div(1e8).toString();

  const collAssetData: FluidAssetData = {
    symbol: collAsset.symbol,
    address: collAsset.address,
    price: new Dec(debtPriceParsed).mul(oraclePrice).toString(),
    totalSupply: data.totalSupplyVault,
    totalBorrow: data.totalBorrowVault,
    canBeSupplied: true,
    canBeBorrowed: false,
    supplyRate,
    borrowRate: '0',
  };

  const debtAssetData: FluidAssetData = {
    symbol: debtAsset.symbol,
    address: debtAsset.address,
    price: debtPriceParsed,
    totalSupply: data.totalSupplyVault,
    totalBorrow: data.totalBorrowVault,
    canBeSupplied: false,
    canBeBorrowed: true,
    supplyRate: '0',
    borrowRate,
  };

  const assetsData = {
    [collAsset.symbol]: collAssetData,
    [debtAsset.symbol]: debtAssetData,
  };
  const marketInfo = getFluidMarketInfoById(+data.vaultId, network);
  const totalSupplyVault = getEthAmountForDecimals(data.totalSupplyVault, collAsset.decimals);
  const totalBorrowVault = getEthAmountForDecimals(data.totalBorrowVault, debtAsset.decimals);

  const liqRatio = new Dec(data.liquidationThreshold).div(100).toString();
  const liquidationMaxLimit = new Dec(data.liquidationMaxLimit).div(100).toString();
  const liqFactor = new Dec(data.liquidationThreshold).div(10_000).toString();

  const marketData = {
    vaultId: +data.vaultId,
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+data.vaultType),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: liqRatio,
    liqFactor,
    minRatio: new Dec(1).div(liqFactor).mul(100).toString(),
    collAsset0: collAsset.symbol,
    debtAsset0: debtAsset.symbol,
    totalPositions: data.totalPositions,
    totalSupplyVault,
    totalBorrowVault,
    totalSupplyVaultUsd: new Dec(totalSupplyVault).mul(collAssetData.price).toString(),
    totalBorrowVaultUsd: new Dec(totalBorrowVault).mul(debtAssetData.price).toString(),
    withdrawalLimit: getEthAmountForDecimals(data.withdrawalLimit, collAsset.decimals),
    withdrawableUntilLimit: getEthAmountForDecimals(data.withdrawableUntilLimit, collAsset.decimals),
    withdrawable: getEthAmountForDecimals(data.withdrawable, collAsset.decimals),
    borrowLimit: getEthAmountForDecimals(data.borrowLimit, debtAsset.decimals),
    borrowableUntilLimit: getEthAmountForDecimals(data.borrowableUntilLimit, debtAsset.decimals),
    borrowable: getEthAmountForDecimals(data.borrowable, debtAsset.decimals),
    borrowLimitUtilization: getEthAmountForDecimals(data.borrowLimitUtilization, debtAsset.decimals),
    maxBorrowLimit: getEthAmountForDecimals(data.maxBorrowLimit, debtAsset.decimals),
    baseBorrowLimit: getEthAmountForDecimals(data.baseBorrowLimit, debtAsset.decimals),
    minimumBorrowing: getEthAmountForDecimals(data.minimumBorrowing, debtAsset.decimals),
    liquidationMaxLimit,
    borrowRate,
    supplyRate,
  };

  return {
    assetsData,
    marketData,
  } as FluidMarketData;
};

export const EMPTY_FLUID_DATA = {
  usedAssets: {},
  suppliedUsd: '0',
  borrowedUsd: '0',
  borrowLimitUsd: '0',
  leftToBorrowUsd: '0',
  ratio: '0',
  minRatio: '0',
  netApy: '0',
  incentiveUsd: '0',
  totalInterestUsd: '0',
  isSubscribedToAutomation: false,
  automationResubscribeRequired: false,
  lastUpdated: Date.now(),
};

const parseUserData = (userPositionData: FluidView.UserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
  const {
    assetsData,
    marketData,
  } = vaultData;

  const payload = {
    owner: userPositionData.owner,
    vaultId: marketData.vaultId,
    ...EMPTY_FLUID_DATA,
    lastUpdated: Date.now(),
  };
  const collAsset = getAssetInfo(marketData.collAsset0);
  const debtAsset = getAssetInfo(marketData.debtAsset0);

  const supplied = getEthAmountForDecimals(userPositionData.supply, collAsset.decimals);
  const borrowed = getEthAmountForDecimals(userPositionData.borrow, debtAsset.decimals);

  const collUsedAsset: FluidUsedAsset = {
    ...EMPTY_USED_ASSET,
    symbol: collAsset.symbol,
    collateral: true,
    supplied,
    suppliedUsd: new Dec(supplied).mul(assetsData[collAsset.symbol].price).toString(),
    isSupplied: new Dec(supplied).gt(0),
  };

  const debtUsedAsset: FluidUsedAsset = {
    ...EMPTY_USED_ASSET,
    symbol: debtAsset.symbol,
    collateral: false,
    borrowed,
    borrowedUsd: new Dec(borrowed).mul(assetsData[debtAsset.symbol].price).toString(),
    isBorrowed: new Dec(borrowed).gt(0),
  };

  const usedAssets: FluidUsedAssets = {
    [collAsset.symbol]: collUsedAsset,
    [debtAsset.symbol]: debtUsedAsset,
  };

  return {
    ...payload,
    usedAssets,
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }) as FluidAggregatedVaultData),
  };
};

export const getFluidMarketData = async (web3: Web3, network: NetworkNumber, market: FluidMarketInfo) => {
  const view = FluidViewContract(web3, network);

  const data = await view.methods.getVaultData(market.marketAddress).call();

  return parseMarketData(web3, data, network);
};

export const getFluidVaultIdsForUser = async (web3: Web3,
  network:NetworkNumber,
  user: EthAddress): Promise<string[]> => {
  const view = FluidViewContract(web3, network);

  return view.methods.getUserNftIds(user).call();
};


export const getFluidPosition = async (
  web3: Web3,
  network: NetworkNumber,
  vaultId: string,
  extractedState: {
    assetsData: FluidAssetsData
    marketData: InnerFluidMarketData,
  },
): Promise<FluidVaultData> => {
  const view = FluidViewContract(web3, network);

  const data = await view.methods.getPositionByNftId(vaultId).call();

  const userPositionData = data[0];

  return parseUserData(userPositionData, extractedState);
};

export const getFluidPositionWithMarket = async (web3: Web3, network: NetworkNumber, vaultId: string) => {
  const view = FluidViewContract(web3, network);
  const data = await view.methods.getPositionByNftId(vaultId).call();
  const marketData = await parseMarketData(web3, data.vault, network);
  const userData = parseUserData(data.position, marketData);

  return {
    userData,
    marketData,
  };
};

export const getAllFluidMarketDataChunked = async (network: NetworkNumber, web3: Web3) => {
  const versions = getFluidVersionsDataForNetwork(network);
  const view = FluidViewContract(web3, network);
  const calls = versions.map((version) => ({
    target: view.options.address,
    abiItem: view.options.jsonInterface.find((item) => item.name === 'getVaultData'),
    params: [version.marketAddress],
  }));

  const data = await chunkAndMulticall(calls, 10, 'latest', web3, network);
  // @ts-ignore
  return Promise.all(data.map(async (item, i) => parseMarketData(web3, item.vaultData, network)));
};

export const getFluidTokenData = async (web3: Web3, network: NetworkNumber, token: string) => {
  const view = FluidViewContract(web3, network);
  const fTokenAddress = getFTokenAddress(token, network);
  const data = await view.methods.getFTokenData(fTokenAddress).call();
  const supplyRate = new Dec(data.supplyRate).div(100).toString();
  const rewardsRate = new Dec(data.rewardsRate).div(1e12).toString();
  const decimals = data.decimals;

  const depositRate = new Dec(getEthAmountForDecimals(data.convertToShares, decimals)).toString();
  const withdrawRate = new Dec(getEthAmountForDecimals(data.convertToAssets, decimals)).toString();

  return {
    fTokenAddress,
    fTokenSymbol: data.symbol,
    decimals,
    totalDeposited: getEthAmountForDecimals(data.totalAssets, decimals),
    withdrawable: getEthAmountForDecimals(data.withdrawable, decimals),
    apy: new Dec(supplyRate).add(rewardsRate).toString(),
    depositRate,
    withdrawRate,
  };
};

export const getFluidDepositData = async (web3: Web3, network: NetworkNumber, token: string, address: EthAddress) => {
  const view = FluidViewContract(web3, network);
  const fTokenAddress = getFTokenAddress(token, network);
  const { fTokenData, userPosition } = await view.methods.getUserEarnPositionWithFToken(fTokenAddress, address).call();

  const supplyRate = new Dec(fTokenData.supplyRate).div(100).toString();
  const rewardsRate = new Dec(fTokenData.rewardsRate).div(1e12).toString();
  const decimals = fTokenData.decimals;

  const depositRate = new Dec(getEthAmountForDecimals(fTokenData.convertToShares, decimals)).toString();
  const withdrawRate = new Dec(getEthAmountForDecimals(fTokenData.convertToAssets, decimals)).toString();

  return {
    fTokenAddress,
    fTokenSymbol: fTokenData.symbol,
    decimals,
    totalDeposited: getEthAmountForDecimals(fTokenData.totalAssets, decimals),
    withdrawable: getEthAmountForDecimals(fTokenData.withdrawable, decimals),
    apy: new Dec(supplyRate).add(rewardsRate).toString(),
    depositRate,
    withdrawRate,
    deposited: getEthAmountForDecimals(userPosition.underlyingAssets, decimals),
    depositedShares: getEthAmountForDecimals(userPosition.fTokenShares, decimals),
  };
};

export const getUserPositions = async (web3: Web3, network: NetworkNumber, user: EthAddress) => {
  const view = FluidViewContract(web3, network);

  const data = await view.methods.getUserPositions(user).call();

  const parsedMarketData = await Promise.all(data.vaults.map(async (vaultData) => parseMarketData(web3, vaultData, network)));

  const userData = data.positions.map((position, i) => parseUserData(position, parsedMarketData[i]));

  return parsedMarketData.map((market, i) => ({
    marketData: market,
    userData: userData[i],
  }));
};