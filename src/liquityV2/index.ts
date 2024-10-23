import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { LiquityV2ViewContract } from '../contracts';
import { NetworkNumber } from '../types/common';
import {
  InnerLiquityV2MarketData,
  LIQUITY_TROVE_STATUS_ENUM,
  LiquityV2AssetsData, LiquityV2MarketData, LiquityV2MarketInfo, LiquityV2TroveData, LiquityV2UsedAssets,
} from '../types';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { getLiquityV2AggregatedPositionData } from '../helpers/liquityV2Helpers';
import { ethToWeth } from '../services/utils';


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

  const minRatio = new Dec(data.MCR).div(1e16).toString();
  return { assetsData, marketData: { minRatio } };
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
  const { minRatio } = marketData;
  const { collateralToken, marketAddress, debtToken } = selectedMarket;
  const data = await viewContract.methods.getTroveInfo(marketAddress, troveId).call();
  const usedAssets: LiquityV2UsedAssets = {};

  const debtAssetData = assetsData[debtToken];
  const borrowed = assetAmountInEth(data.debtAmount);
  usedAssets[debtToken] = {
    symbol: debtToken,
    address: debtAssetData.address,
    price: debtAssetData.price,
    supplied: '0',
    suppliedUsd: '0',
    borrowed,
    borrowedUsd: new Dec(borrowed).mul(debtAssetData.price).toString(),
  };

  const collAssetData = assetsData[collateralToken];
  const suppliedColl = assetAmountInEth(data.collAmount);
  usedAssets[collateralToken] = {
    symbol: collateralToken,
    address: collAssetData.address,
    price: collAssetData.price,
    supplied: suppliedColl,
    suppliedUsd: new Dec(suppliedColl).mul(collAssetData.price).toString(),
    borrowed: '0',
    borrowedUsd: '0',
  };

  const ratio = new Dec(data.TCRatio).div(1e16).toString();
  const interestRate = new Dec(data.annualInterestRate).div(1e16).toString();
  const interestBatchManager = data.interestBatchManager;

  const payload: LiquityV2TroveData = {
    usedAssets,
    troveId,
    ratio,
    interestRate,
    interestBatchManager,
    troveStatus: LIQUITY_TROVE_STATUS_ENUM[parseInt(data.status, 10)],
    ...getLiquityV2AggregatedPositionData({
      usedAssets, assetsData, minRatio, interestRate,
    }),
  };

  return payload;
};