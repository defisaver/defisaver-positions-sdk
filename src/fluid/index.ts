import Web3 from 'web3';
import Dec from 'decimal.js';
import { getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
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
import { FluidViewContract } from '../contracts';
import { getEthAmountForDecimals } from '../services/utils';
import { getFluidAggregatedData } from '../helpers/fluidHelpers';
import { FluidView } from '../types/contracts/generated';

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

const parseMarketData = (data: FluidView.VaultDataStructOutputStruct) => {
  const collAsset = getAssetInfoByAddress(data.supplyToken0);
  const debtAsset = getAssetInfoByAddress(data.borrowToken0);

  const collAssetData: FluidAssetData = {
    symbol: collAsset.symbol,
    address: collAsset.address,
    price: getEthAmountForDecimals(data.priceOfSupplyToken0InUSD, 8),
    totalSupply: data.totalSupplyVault,
    totalBorrow: data.totalBorrowVault,
    canBeSupplied: true,
    canBeBorrowed: false,
    supplyRate: new Dec(data.supplyRateVault).div(100).toString(),
    borrowRate: '0',
  };

  const debtAssetData: FluidAssetData = {
    symbol: debtAsset.symbol,
    address: debtAsset.address,
    price: getEthAmountForDecimals(data.priceOfBorrowToken0InUSD, 8),
    totalSupply: data.totalSupplyVault,
    totalBorrow: data.totalBorrowVault,
    canBeSupplied: false,
    canBeBorrowed: true,
    supplyRate: '0',
    borrowRate: new Dec(data.borrowRateVault).div(100).toString(),
  };

  const assetsData = {
    [collAsset.symbol]: collAssetData,
    [debtAsset.symbol]: debtAssetData,
  };

  const marketData = {
    vaultId: +data.vaultId,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+data.vaultType),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: new Dec(data.liquidationThreshold).div(100).toString(),
    collAsset0: collAsset.symbol,
    debtAsset0: debtAsset.symbol,
    totalPositions: data.totalPositions,
    totalSupplyVault: getEthAmountForDecimals(data.totalSupplyVault, collAsset.decimals),
    totalBorrowVault: getEthAmountForDecimals(data.totalBorrowVault, debtAsset.decimals),
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

  return parseMarketData(data);
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
  const marketData = parseMarketData(data.vault);
  const userData = parseUserData(data.position, marketData);

  return {
    userData,
    marketData,
  };
};