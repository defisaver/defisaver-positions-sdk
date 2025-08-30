import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { createContractWrapper, LiquityV2LegacyViewContract, LiquityV2ViewContract } from '../contracts';
import { EthAddress, NetworkNumber } from '../types/common';
import {
  InnerLiquityV2MarketData,
  LIQUITY_V2_TROVE_STATUS_ENUM,
  LiquityV2AssetsData, LiquityV2MarketData, LiquityV2MarketInfo, LiquityV2TroveData, LiquityV2UsedAssets,
  LiquityV2Versions,
} from '../types';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { getLiquityV2AggregatedPositionData } from '../helpers/liquityV2Helpers';
import { compareAddresses, ethToWeth, MAXUINT } from '../services/utils';
import { LiquityV2View } from '../types/contracts/generated';
import { ZERO_ADDRESS } from '../constants';
import { LiquityV2Markets } from '../markets';
import { BaseContract } from '../types/contracts/generated/types';

const getLiquityV2ViewContract = (web3: Web3, network: NetworkNumber, isLegacy: boolean): BaseContract => {
  if (isLegacy) return LiquityV2LegacyViewContract(web3, network);
  return LiquityV2ViewContract(web3, network);
};


export const getLiquityV2MarketData = async (web3: Web3, network: NetworkNumber, selectedMarket: LiquityV2MarketInfo, mainnetWeb3: Web3): Promise<LiquityV2MarketData> => {
  const {
    marketAddress, debtToken, collateralToken, isLegacy,
  } = selectedMarket;
  const viewContract = getLiquityV2ViewContract(web3, network, isLegacy);
  const data = await viewContract.methods.getMarketData(marketAddress).call();
  const hintHelperAddress = data.hintHelpers;
  const troveNFTAddress = data.troveNFT;
  const borrowerOperationsAddress = data.borrowerOperations;
  const troveManagerAddress = data.troveManager;
  const stabilityPoolAddress = data.stabilityPool;
  const collSurplusPoolAddress = data.collSurplusPool;
  const activePoolAddress = data.activePool;

  const minCollRatio = new Dec(data.MCR).div(1e16).toString();
  const criticalCollRatio = new Dec(data.CCR).div(1e18).toString();
  const batchCollRatio = new Dec(data.BCR || '0').div(1e16).toString();

  const totalMarketBorrow = assetAmountInEth(data.entireSystemDebt);
  const totalMarketSupply = assetAmountInEth(data.entireSystemColl);
  const collPrice = assetAmountInEth(data.collPrice);

  const totalCollRatio = new Dec(totalMarketSupply).mul(collPrice).div(totalMarketBorrow).toString();
  const leftToBorrowGlobal = new Dec(totalMarketSupply).mul(collPrice).div(criticalCollRatio).sub(totalMarketBorrow)
    .toString();
  const minCollAmountForCurrentBorrow = new Dec(totalMarketBorrow).mul(criticalCollRatio).div(collPrice).toString();
  const leftToWithdrawGlobal = new Dec(totalMarketSupply).sub(minCollAmountForCurrentBorrow).toString();

  const assetsData: LiquityV2AssetsData = {};
  assetsData[debtToken] = {
    symbol: debtToken,
    address: getAssetInfo(debtToken, network).address,
    price: '1',
    totalSupply: '0',
    totalBorrow: totalMarketBorrow,
    canBeSupplied: false,
    canBeBorrowed: true,
    leftToBorrowGlobal,
    leftToWithdrawGlobal: '0',
  };
  assetsData[collateralToken] = {
    symbol: collateralToken,
    address: getAssetInfo(ethToWeth(collateralToken), network).address,
    price: collPrice,
    totalSupply: totalMarketSupply,
    totalBorrow: '0',
    canBeSupplied: true,
    canBeBorrowed: false,
    leftToBorrowGlobal: '0',
    leftToWithdrawGlobal,
  };
  if (STAKING_ASSETS.includes(collateralToken)) {
    assetsData[collateralToken].incentiveSupplyApy = await getStakingApy(collateralToken, mainnetWeb3);
    assetsData[collateralToken].incentiveSupplyToken = collateralToken;
  }

  return {
    assetsData,
    marketData: {
      minCollRatio,
      totalCollRatio: new Dec(totalCollRatio).mul(100).toString(),
      criticalCollRatio: new Dec(criticalCollRatio).mul(100).toString(),
      batchCollRatio,
      isUnderCollateralized: new Dec(totalCollRatio).lt(criticalCollRatio),
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

const nftContractCreationBlockMapping = {
  [LiquityV2Versions.LiquityV2Eth]: 22516079,
  [LiquityV2Versions.LiquityV2WstEth]: 22516099,
  [LiquityV2Versions.LiquityV2REth]: 22516118,
  // legacy
  [LiquityV2Versions.LiquityV2EthLegacy]: 21686215,
  [LiquityV2Versions.LiquityV2WstEthLegacy]: 21686238,
  [LiquityV2Versions.LiquityV2REthLegacy]: 21686257,
};

const getTransferredTroves = async (web3: Web3, network: NetworkNumber, troveNFTAddress: EthAddress, limitBlocksForEventFetching: boolean, market: LiquityV2Versions, account: EthAddress): Promise<{ troveId: string }[]> => {
  const nftContract = createContractWrapper(web3, network, 'LiquityV2TroveNFT', troveNFTAddress);
  const nftContractCreationBlock = nftContractCreationBlockMapping[market];
  const currentBlock = await web3.eth.getBlockNumber();
  const events = await nftContract.getPastEvents(
    TransferEventSig,
    {
      fromBlock: limitBlocksForEventFetching ? (currentBlock - 1000) : nftContractCreationBlock,
    },
  );
  const userTransferredTroves = events.filter((event) => compareAddresses(event.returnValues.to, account));

  // check if the last know transfer address is the user
  userTransferredTroves.forEach((event, index) => {
    const otherTransfers = events.filter((e) => event.blockNumber < e.blockNumber && e.returnValues.tokenId === event.returnValues.tokenId);
    // @ts-ignore
    userTransferredTroves[index].invalid = !!otherTransfers.length;
  });
  // @ts-ignore
  return userTransferredTroves.filter((event) => !event.invalid).map((event) => ({ troveId: event.returnValues.tokenId }));
};

export const getLiquityV2UserTroveIds = async (web3: Web3, network: NetworkNumber, selectedMarket: LiquityV2MarketInfo, troveNFTAddress: EthAddress, limitBlocksForEventFetching: boolean, account: EthAddress): Promise<{ troves: { troveId: string }[], nextFreeTroveIndex: string }> => {
  const viewContract = getLiquityV2ViewContract(web3, network, selectedMarket.isLegacy);
  const [{ troves: userTroves, nextFreeTroveIndex }, userTransferredTroves] = await Promise.all([
    getUserTroves(viewContract, account, selectedMarket.marketAddress),
    getTransferredTroves(web3, network, troveNFTAddress, limitBlocksForEventFetching, selectedMarket.value, account),
  ]);
  const troves = [...userTroves.map(({ troveId }) => ({ troveId })), ...userTransferredTroves];
  const filteredTroves = troves.filter((value, index, self) => index === self.findIndex((t) => (
    t.troveId === value.troveId
  )),
  );
  const troveIds = filteredTroves.map((trove) => trove.troveId);
  const troveIdsSet = new Set(troveIds);
  const troveIdsArray = Array.from(troveIdsSet);
  const trovesNoDuplicates = troveIdsArray.map((troveId) => troves.find((trove) => trove.troveId === troveId)) as { troveId: string }[];
  return { troves: trovesNoDuplicates, nextFreeTroveIndex };
};

const _getDebtInFrontForSingleMarket = async (viewContract: any, marketAddress: EthAddress, troveId: string, accumulatedSum = '0', iterations = 2000) => viewContract.methods.getDebtInFront(marketAddress, troveId, accumulatedSum, iterations).call();

export const getDebtInFrontForSingleMarketLiquityV2 = async (viewContract: any, marketAddress: EthAddress, troveId: string, accumulatedSum = '0', iterations = 2000): Promise<string> => {
  const { debt, next } = await _getDebtInFrontForSingleMarket(viewContract, marketAddress, troveId, accumulatedSum, iterations);
  if (next === '0') return assetAmountInEth(debt);
  return getDebtInFrontForSingleMarketLiquityV2(viewContract, marketAddress, next, debt, iterations);
};

const _getDebtInFrontForInterestRateSingleMarketLiquityV2 = async (viewContract: any, marketAddress: EthAddress, troveId = '0', accumulatedSum = '0', iterations = 2000, interestRate: string) => viewContract.methods.getDebtInFrontByInterestRate(marketAddress, troveId, accumulatedSum, iterations, interestRate).call();

export const getDebtInFrontForInterestRateSingleMarketLiquityV2 = async (viewContract: any, marketAddress: EthAddress, interestRate: string, troveId = '0', accumulatedSum = '0', iterations = 2000): Promise<string> => {
  if (+interestRate === 0 || !interestRate) return '0';
  const interestRateWei = new Dec(interestRate).times(1e16).toFixed(0).toString();
  const res = await _getDebtInFrontForInterestRateSingleMarketLiquityV2(viewContract, marketAddress, troveId, accumulatedSum, iterations, interestRateWei);
  const { debt, next } = res;
  if (next === '0') return assetAmountInEth(debt);
  return getDebtInFrontForInterestRateSingleMarketLiquityV2(viewContract, marketAddress, interestRate, next, debt, iterations);
};

const getUnbackedDebtForSingleMarket = async (totalBorrowed: string, web3: Web3, network: NetworkNumber, stabilityPoolAddress: EthAddress) => {
  const stabilityPoolContract = createContractWrapper(web3, network, 'LiquityV2StabilityPool', stabilityPoolAddress);
  const totalBoldDeposits = await stabilityPoolContract.methods.getTotalBoldDeposits().call();
  const totalBoldDepositsInEth = assetAmountInEth(totalBoldDeposits);

  return Dec.max(new Dec(totalBorrowed).sub(totalBoldDepositsInEth), 0).toString();
};

export const getAllMarketsUnbackedDebts = async (markets: Record<LiquityV2Versions, LiquityV2MarketData>, web3: Web3, network: NetworkNumber): Promise<Record<LiquityV2Versions, string>> => {
  const allMarketsUnbackedDebt = await Promise.all(Object.entries(markets).map(async ([version, market]) => {
    const { assetsData, marketData } = market;
    const { debtToken } = LiquityV2Markets(network)[version as LiquityV2Versions];
    const unbackedDebt = await getUnbackedDebtForSingleMarket(assetsData[debtToken].totalBorrow, web3, network, marketData.stabilityPoolAddress);
    return [version, unbackedDebt];
  }));

  return Object.fromEntries(allMarketsUnbackedDebt) as Record<LiquityV2Versions, string>;
};

export const calculateDebtInFrontLiquityV2 = (markets: Record<LiquityV2Versions, LiquityV2MarketData>, selectedMarket: LiquityV2Versions, allMarketsUnbackedDebts: Record<LiquityV2Versions, string>, interestRateDebtInFront: string): string => {
  // Sanity check to avoid division by 0. Very unlikely to ever happen.
  const selectedMarketTotalBorrow = new Dec(markets[selectedMarket].assetsData[LiquityV2Markets(NetworkNumber.Eth)[selectedMarket].debtToken].totalBorrow);
  if (selectedMarketTotalBorrow.eq(0)) return new Dec(0).toString();

  const selectedMarketUnbackedDebt = new Dec(allMarketsUnbackedDebts[selectedMarket]);
  const totalUnbackedDebt = Object.values(allMarketsUnbackedDebts).reduce((acc, val) => acc.plus(new Dec(val)), new Dec(0));

  // When totalUnbackedDebt is 0, redemptions will be proportional with the branch size and not to unbacked debt.
  // When unbacked debt is 0 for branch, next redemption call won't touch that branch, so in order to estimate total debt in front we will:
  // - First add up all the unbacked debt from other branches, as that will be the only debt that will be redeemed on the fist redemption call
  // - Perform split the same way as we would do when totalUnbackedDebt == 0, this would represent the second call to the redemption function
  if (selectedMarketUnbackedDebt.eq(0)) {
    // Special case if the branch debt in front is 0, it means that all debt in front is unbacked debt from other branches.
    if (new Dec(interestRateDebtInFront).eq(0)) return totalUnbackedDebt.toString();

    // Then calculate how much of that estimated amount would go to each branch
    const amountBeingRedeemedOnEachMarketByTotalBorrow = Object.entries(markets).map(([version, market]) => {
      if (version === selectedMarket) return new Dec(interestRateDebtInFront);
      const { assetsData } = market;
      const { debtToken } = LiquityV2Markets(NetworkNumber.Eth)[version as LiquityV2Versions];
      const totalBorrow = new Dec(assetsData[debtToken].totalBorrow);
      const amountToRedeem = new Dec(interestRateDebtInFront).mul(totalBorrow).div(selectedMarketTotalBorrow);
      return Dec.min(amountToRedeem, totalBorrow);
    });

    const redemptionAmount = amountBeingRedeemedOnEachMarketByTotalBorrow.reduce((acc, val) => acc.plus(val), new Dec(0));
    return totalUnbackedDebt.plus(redemptionAmount).toString();
  }

  const amountBeingRedeemedOnEachMarketByUnbackedDebt = Object.entries(markets).map(([version, market]) => {
    if (version === selectedMarket) return new Dec(interestRateDebtInFront);
    const { assetsData } = market;
    const { debtToken } = LiquityV2Markets(NetworkNumber.Eth)[version as LiquityV2Versions];
    const unbackedDebt = new Dec(allMarketsUnbackedDebts[version as LiquityV2Versions]);
    const totalBorrow = new Dec(assetsData[debtToken].totalBorrow);
    const amountToRedeem = new Dec(interestRateDebtInFront).mul(unbackedDebt).div(selectedMarketUnbackedDebt);
    return Dec.min(amountToRedeem, totalBorrow);
  });

  return amountBeingRedeemedOnEachMarketByUnbackedDebt.reduce((acc, val) => acc.plus(val), new Dec(0)).toString();
};

export const getDebtInFrontLiquityV2 = async (markets: Record<LiquityV2Versions, LiquityV2MarketData>, selectedMarket: LiquityV2Versions, web3: Web3, network: NetworkNumber, viewContract: any, troveId: string) => {
  const allMarketsUnbackedDebts = await getAllMarketsUnbackedDebts(markets, web3, network);
  const interestRateDebtInFront = await getDebtInFrontForSingleMarketLiquityV2(viewContract, LiquityV2Markets(network)[selectedMarket].marketAddress, troveId);

  return calculateDebtInFrontLiquityV2(markets, selectedMarket, allMarketsUnbackedDebts, interestRateDebtInFront.toString());
};

export const getDebtInFrontForInterestRateLiquityV2 = async (markets: Record<LiquityV2Versions, LiquityV2MarketData>, selectedMarket: LiquityV2Versions, web3: Web3, network: NetworkNumber, viewContract: any, interestRate: string) => {
  const allMarketsUnbackedDebts = await getAllMarketsUnbackedDebts(markets, web3, network);
  const interestRateDebtInFront = new Dec(await getDebtInFrontForInterestRateSingleMarketLiquityV2(viewContract, LiquityV2Markets(network)[selectedMarket].marketAddress, interestRate));

  return calculateDebtInFrontLiquityV2(markets, selectedMarket, allMarketsUnbackedDebts, interestRateDebtInFront.toString());
};

export const getDebtInFrontForInterestRateIncludingNewDebtLiquityV2 = async (newDebt: string, markets: Record<LiquityV2Versions, LiquityV2MarketData>, selectedMarket: LiquityV2Versions, web3: Web3, network: NetworkNumber, viewContract: any, interestRate: string) => {
  const marketsWithNewDebt = JSON.parse(JSON.stringify(markets));
  const selectedMarketDebtToken = LiquityV2Markets(network)[selectedMarket].debtToken;
  const currentTotalBorrow = new Dec(marketsWithNewDebt[selectedMarket].assetsData[selectedMarketDebtToken].totalBorrow);
  marketsWithNewDebt[selectedMarket].assetsData[selectedMarketDebtToken].totalBorrow = currentTotalBorrow.add(newDebt).toString();

  const allMarketsUnbackedDebts = await getAllMarketsUnbackedDebts(marketsWithNewDebt, web3, network);
  const interestRateDebtInFront = new Dec(await getDebtInFrontForInterestRateSingleMarketLiquityV2(viewContract, LiquityV2Markets(network)[selectedMarket].marketAddress, interestRate));

  return calculateDebtInFrontLiquityV2(marketsWithNewDebt, selectedMarket, allMarketsUnbackedDebts, interestRateDebtInFront.toString());
};

export const getLiquityV2TroveData = async (
  web3: Web3,
  network: NetworkNumber,
  {
    selectedMarket,
    assetsData,
    troveId,
    allMarketsData,
  }:
  {
    selectedMarket: LiquityV2MarketInfo,
    assetsData: LiquityV2AssetsData,
    troveId: string,
    allMarketsData: Record<LiquityV2Versions, LiquityV2MarketData>,
  },
): Promise<LiquityV2TroveData> => {
  const viewContract = getLiquityV2ViewContract(web3, network, selectedMarket.isLegacy);
  const { minCollRatio, batchCollRatio } = allMarketsData[selectedMarket.value].marketData;
  const { collateralToken, marketAddress, debtToken } = selectedMarket;
  const [_data, debtInFront] = await Promise.all([
    viewContract.methods.getTroveInfo(marketAddress, troveId).call(),
    getDebtInFrontLiquityV2(allMarketsData, selectedMarket.value, web3, network, viewContract, troveId),
  ]);
  const data = {
    ..._data,
    TCRatio: _data.TCRatio === MAXUINT ? '0' : _data.TCRatio, // mistake on contract side when debt is 0
  };
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
  const lastInterestRateAdjTime = data.lastInterestRateAdjTime;

  const hasInterestBatchManager = !compareAddresses(interestBatchManager, ZERO_ADDRESS);
  const liqRatio = hasInterestBatchManager ? new Dec(minCollRatio).add(batchCollRatio).toString() : minCollRatio;

  const payload: LiquityV2TroveData = {
    usedAssets,
    troveId,
    interestRate,
    interestBatchManager,
    debtInFront,
    lastInterestRateAdjTime,
    liqRatio,
    troveStatus: LIQUITY_V2_TROVE_STATUS_ENUM[parseInt(data.status, 10)],
    ...getLiquityV2AggregatedPositionData({
      usedAssets, assetsData, minCollRatio: liqRatio, interestRate,
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
