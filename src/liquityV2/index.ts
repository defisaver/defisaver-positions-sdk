import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { createContractWrapper, LiquityV2ViewContract } from '../contracts';
import { EthAddress, NetworkNumber } from '../types/common';
import {
  InnerLiquityV2MarketData,
  LIQUITY_V2_TROVE_STATUS_ENUM,
  LiquityV2AssetsData, LiquityV2MarketData, LiquityV2MarketInfo, LiquityV2TroveData, LiquityV2UsedAssets,
} from '../types';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { getLiquityV2AggregatedPositionData } from '../helpers/liquityV2Helpers';
import { compareAddresses, ethToWeth } from '../services/utils';
import { LiquityV2View } from '../types/contracts/generated';
import { ZERO_ADDRESS } from '../constants';


export const getLiquityV2MarketData = async (web3: Web3, network: NetworkNumber, selectedMarket: LiquityV2MarketInfo, mainnetWeb3: Web3): Promise<LiquityV2MarketData> => {
  const viewContract = LiquityV2ViewContract(web3, network);
  const { marketAddress, debtToken, collateralToken } = selectedMarket;
  const data = await viewContract.methods.getMarketData(marketAddress).call();
  const hintHelperAddress = data.hintHelpers;
  const troveNFTAddress = data.troveNFT;
  const borrowerOperationsAddress = data.borrowerOperations;
  const troveManagerAddress = data.troveManager;
  const stabilityPoolAddress = data.stabilityPool;
  const collSurplusPoolAddress = data.collSurplusPool;
  const activePoolAddress = data.activePool;
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
  return {
    assetsData,
    marketData: {
      minCollRatio,
      hintHelperAddress,
      troveNFTAddress,
      borrowerOperationsAddress,
      troveManagerAddress,
      stabilityPoolAddress,
      collSurplusPoolAddress,
      activePoolAddress,
    },
  };
};

const _getUserTroves = async (viewContract: any, account: EthAddress, marketAddress: EthAddress, startIndex = 0, endIndex = 100) => viewContract.methods.getUserTroves(account, marketAddress, startIndex, endIndex).call();

const getUserTroves = async (viewContract: any, account: EthAddress, marketAddress: EthAddress, startIndex = 0, endIndex = 100, troves: LiquityV2View.ExistingTroveStructOutput[] = []): Promise<{ troves: LiquityV2View.ExistingTroveStructOutput[], nextFreeTroveIndex: string }> => {
  const result = await _getUserTroves(viewContract, account, marketAddress, startIndex, endIndex);
  const newStartIndex = endIndex + 1;
  const nextFreeTroveIndex = result.nextFreeTroveIndex;
  const existingTroves = [...troves, ...result.troves];
  if (nextFreeTroveIndex !== '-1') return { troves: existingTroves.filter((trove) => trove.ownedByUser), nextFreeTroveIndex };
  return getUserTroves(viewContract, account, marketAddress, newStartIndex, newStartIndex + 100, existingTroves);
};

const TransferEventSig = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const getTransferredTroves = async (web3: Web3, network: NetworkNumber, troveNFTAddress: EthAddress, account: EthAddress): Promise<{ troveId: string }[]> => {
  const nftContract = createContractWrapper(web3, network, 'LiquityV2TroveNFT', troveNFTAddress);
  const currentBlock = await web3.eth.getBlockNumber();
  const events = await nftContract.getPastEvents(
    TransferEventSig,
    {
      fromBlock: currentBlock - 1000,
    },
  );
  const userTransferredTroves = events.filter((event) => !compareAddresses(event.returnValues.from, ZERO_ADDRESS) && compareAddresses(event.returnValues.to, account));
  return userTransferredTroves.map((event) => ({ troveId: event.returnValues.tokenId }));
};

export const getLiquityV2UserTroveIds = async (web3: Web3, network: NetworkNumber, selectedMarket: LiquityV2MarketInfo, troveNFTAddress: EthAddress, account: EthAddress): Promise<{ troves: { troveId: string }[], nextFreeTroveIndex: string }> => {
  const viewContract = LiquityV2ViewContract(web3, network);
  const [{ troves: userTroves, nextFreeTroveIndex }, userTransferredTroves] = await Promise.all([
    getUserTroves(viewContract, account, selectedMarket.marketAddress),
    getTransferredTroves(web3, network, troveNFTAddress, account),
  ]);
  const troves = [...userTroves.map(({ troveId }) => ({ troveId })), ...userTransferredTroves];
  const filteredTroves = troves.filter((value, index, self) => index === self.findIndex((t) => (
    t.troveId === value.troveId
  )),
  );
  return { troves: filteredTroves, nextFreeTroveIndex };
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
    interestRate,
    interestBatchManager,
    debtInFront,
    troveStatus: LIQUITY_V2_TROVE_STATUS_ENUM[parseInt(data.status, 10)],
    ...getLiquityV2AggregatedPositionData({
      usedAssets, assetsData, minCollRatio, interestRate,
    }),
    collRatio,
  };

  return payload;
};

export const getLiquityV2ClaimableCollateral = async (collSurplusPoolAddress: EthAddress, account: EthAddress, web3: Web3, network: NetworkNumber): Promise<string> => {
  const collSurplusPoolContract = createContractWrapper(web3, network, 'LiquityV2CollSurplusPool', collSurplusPoolAddress);
  const claimableCollateral = await collSurplusPoolContract.methods.getCollateral(account).call();
  return claimableCollateral;
};