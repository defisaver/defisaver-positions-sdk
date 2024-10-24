import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { LiquityV2ViewContract } from '../contracts';
import { EthAddress, NetworkNumber } from '../types/common';
import {
  InnerLiquityV2MarketData,
  LIQUITY_TROVE_STATUS_ENUM,
  LiquityV2AssetsData, LiquityV2MarketData, LiquityV2MarketInfo, LiquityV2TroveData, LiquityV2UsedAssets,
} from '../types';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { getLiquityV2AggregatedPositionData } from '../helpers/liquityV2Helpers';
import { ethToWeth } from '../services/utils';
import { ZERO_ADDRESS } from '../constants';


export const getLiquityV2MarketData = async (web3: Web3, network: NetworkNumber, selectedMarket: LiquityV2MarketInfo, mainnetWeb3: Web3): Promise<LiquityV2MarketData> => {
  const viewContract = LiquityV2ViewContract(web3, network);
  const { marketAddress, debtToken, collateralToken } = selectedMarket;
  const data = await viewContract.methods.getMarketData(marketAddress).call();
  const assetsData: LiquityV2AssetsData = {};
  assetsData[debtToken] = {
    symbol: debtToken,
    address: getAssetInfo(debtToken, network).address,
    price: '1',
    totalSupply: '0',
    totalBorrow: assetAmountInEth(data.entireSystemDebt),
    canBeSupplied: false,
    canBeBorrowed: true,
  };
  assetsData[collateralToken] = {
    symbol: collateralToken,
    address: getAssetInfo(ethToWeth(collateralToken), network).address,
    price: assetAmountInEth(data.collPrice),
    totalSupply: assetAmountInEth(data.entireSystemColl),
    totalBorrow: '0',
    canBeSupplied: true,
    canBeBorrowed: false,
  };
  if (STAKING_ASSETS.includes(collateralToken)) {
    assetsData[collateralToken].incentiveSupplyApy = await getStakingApy(collateralToken, mainnetWeb3);
    assetsData[collateralToken].incentiveSupplyToken = collateralToken;
  }

  const minCollRatio = new Dec(data.MCR).div(1e16).toString();
  return { assetsData, marketData: { minCollRatio } };
};

const _getDebtInFront = async (viewContract: any, marketAddress: EthAddress, troveId: string, accumulatedSum = '0', iterations = 2000) => viewContract.methods.getDebtInFront(marketAddress, troveId, accumulatedSum, iterations).call();

export const getDebtInFrontLiquityV2 = async (viewContract: any, marketAddress: EthAddress, troveId: string, accumulatedSum = '0', iterations = 2000): Promise<string> => {
  const { debt, next } = await _getDebtInFront(viewContract, marketAddress, troveId, accumulatedSum, iterations);
  if (next === '0') return assetAmountInEth(debt);
  return getDebtInFrontLiquityV2(viewContract, marketAddress, next, debt, iterations);
};

export const getLiquityV2TroveData = async (
  web3: Web3,
  network: NetworkNumber,
  {
    selectedMarket,
    assetsData,
    marketData,
    troveId,
  }:
  {
    selectedMarket: LiquityV2MarketInfo,
    assetsData: LiquityV2AssetsData,
    marketData: InnerLiquityV2MarketData,
    troveId: string
  },
): Promise<LiquityV2TroveData> => {
  const viewContract = LiquityV2ViewContract(web3, network);
  const { minCollRatio } = marketData;
  const { collateralToken, marketAddress, debtToken } = selectedMarket;
  const [data, debtInFront] = await Promise.all([
    viewContract.methods.getTroveInfo(marketAddress, troveId).call(),
    getDebtInFrontLiquityV2(viewContract, marketAddress, troveId),
  ]);
  const usedAssets: LiquityV2UsedAssets = {};

  const debtAssetData = assetsData[debtToken];
  const borrowed = assetAmountInEth(data.debtAmount);
  usedAssets[debtToken] = {
    symbol: debtToken,
    supplied: '0',
    suppliedUsd: '0',
    borrowed,
    borrowedUsd: new Dec(borrowed).mul(debtAssetData.price).toString(),
    isBorrowed: true,
    isSupplied: false,
  };

  const collAssetData = assetsData[collateralToken];
  const suppliedColl = assetAmountInEth(data.collAmount);
  usedAssets[collateralToken] = {
    symbol: collateralToken,
    supplied: suppliedColl,
    suppliedUsd: new Dec(suppliedColl).mul(collAssetData.price).toString(),
    borrowed: '0',
    borrowedUsd: '0',
    isBorrowed: false,
    isSupplied: true,
    collateral: true,
  };

  const collRatio = new Dec(data.TCRatio).div(1e16).toString();
  const interestRate = new Dec(data.annualInterestRate).div(1e16).toString();
  const interestBatchManager = data.interestBatchManager;

  const payload: LiquityV2TroveData = {
    usedAssets,
    troveId,
    collRatio,
    interestRate,
    interestBatchManager,
    debtInFront,
    troveStatus: LIQUITY_TROVE_STATUS_ENUM[parseInt(data.status, 10)],
    ...getLiquityV2AggregatedPositionData({
      usedAssets, assetsData, minCollRatio, interestRate,
    }),
  };

  return payload;
};