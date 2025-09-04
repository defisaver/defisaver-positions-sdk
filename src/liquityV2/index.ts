import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { Client, PublicClient } from 'viem';
import {
  createViemContractFromConfigFunc, LiquityV2LegacyViewContractViem, LiquityV2ViewContractViem,
} from '../contracts';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import {
  LIQUITY_V2_TROVE_STATUS_ENUM,
  LiquityV2AssetsData, LiquityV2MarketData, LiquityV2MarketInfo, LiquityV2TroveData, LiquityV2UsedAssets,
  LiquityV2Versions,
} from '../types';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { getLiquityV2AggregatedPositionData } from '../helpers/liquityV2Helpers';
import { compareAddresses, ethToWeth, MAXUINT } from '../services/utils';
import { ZERO_ADDRESS } from '../constants';
import { LiquityV2Markets } from '../markets';
import { getViemProvider } from '../services/viem';

const getLiquityV2ViewContract = (provider: Client, network: NetworkNumber, isLegacy: boolean) => {
  if (isLegacy) return LiquityV2LegacyViewContractViem(provider, network);
  return LiquityV2ViewContractViem(provider, network);
};


export const _getLiquityV2MarketData = async (provider: Client, network: NetworkNumber, selectedMarket: LiquityV2MarketInfo): Promise<LiquityV2MarketData> => {
  const {
    marketAddress, debtToken, collateralToken, isLegacy,
  } = selectedMarket;
  const viewContract = getLiquityV2ViewContract(provider, network, isLegacy);
  const data = await viewContract.read.getMarketData([marketAddress]);
  const hintHelperAddress = data.hintHelpers;
  const troveNFTAddress = data.troveNFT;
  const borrowerOperationsAddress = data.borrowerOperations;
  const troveManagerAddress = data.troveManager;
  const stabilityPoolAddress = data.stabilityPool;
  const collSurplusPoolAddress = data.collSurplusPool;
  const activePoolAddress = data.activePool;

  const minCollRatio = new Dec(data.MCR).div(1e16).toString();
  const criticalCollRatio = new Dec(data.CCR).div(1e18).toString();
  // @ts-ignore
  const batchCollRatio = new Dec(data.BCR ?? '0').div(1e16).toString();

  const totalMarketBorrow = assetAmountInEth(data.entireSystemDebt.toString());
  const totalMarketSupply = assetAmountInEth(data.entireSystemColl.toString());
  const collPrice = assetAmountInEth(data.collPrice.toString());

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
    assetsData[collateralToken].incentiveSupplyApy = await getStakingApy(collateralToken);
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

export const getLiquityV2MarketData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  selectedMarket: LiquityV2MarketInfo,
): Promise<LiquityV2MarketData> => _getLiquityV2MarketData(getViemProvider(provider, network), network, selectedMarket);

const getUserTroves = async (
  provider: Client,
  network: NetworkNumber,
  isLegacy: boolean,
  account: EthAddress,
  marketAddress: EthAddress,
  startIndex = 0,
  endIndex = 100,
  troves: { troveId: string, ownedByUser: boolean }[] = [],
): Promise<{ troves: { troveId: string, ownedByUser: boolean }[], nextFreeTroveIndex: string }> => {
  const viewContract = getLiquityV2ViewContract(provider, network, isLegacy);
  const result = await viewContract.read.getUserTroves([account, marketAddress, BigInt(startIndex), BigInt(endIndex)]);
  const newStartIndex = endIndex + 1;
  const nextFreeTroveIndex = result[1].toString();
  const existingTroves = [...troves, ...result[0].map((trove: any) => ({ ...trove, troveId: trove.troveId.toString() }))];
  if (nextFreeTroveIndex !== '-1') return { troves: existingTroves.filter((trove) => trove.ownedByUser), nextFreeTroveIndex };
  return getUserTroves(provider, network, isLegacy, account, marketAddress, newStartIndex, newStartIndex + 100, existingTroves);
};

const nftContractCreationBlockMapping = {
  [LiquityV2Versions.LiquityV2Eth]: 22516079,
  [LiquityV2Versions.LiquityV2WstEth]: 22516099,
  [LiquityV2Versions.LiquityV2REth]: 22516118,
  // legacy
  [LiquityV2Versions.LiquityV2EthLegacy]: 21686215,
  [LiquityV2Versions.LiquityV2WstEthLegacy]: 21686238,
  [LiquityV2Versions.LiquityV2REthLegacy]: 21686257,
};

const getTransferredTroves = async (provider: PublicClient, network: NetworkNumber, troveNFTAddress: EthAddress, limitBlocksForEventFetching: boolean, market: LiquityV2Versions, account: EthAddress): Promise<{ troveId: string }[]> => {
  const nftContract = createViemContractFromConfigFunc('LiquityV2TroveNFT', troveNFTAddress)(provider, network);
  const nftContractCreationBlock = nftContractCreationBlockMapping[market];
  const currentBlock = +(await provider.getBlockNumber()).toString();
  const _events = await nftContract.getEvents.Transfer({}, { fromBlock: limitBlocksForEventFetching ? BigInt(currentBlock - 1000) : BigInt(nftContractCreationBlock) });
  const events = _events.map((event) => ({
    from: event.args.from, to: event.args.to, tokenId: event.args.tokenId!.toString(), blockNumber: +(event.blockNumber.toString()),
  }));
  const userTransferredTroves = events.filter((event) => compareAddresses(event.to, account));

  // check if the last know transfer address is the user
  userTransferredTroves.forEach((event, index) => {
    const otherTransfers = events.filter((e) => event.blockNumber < e.blockNumber && e.tokenId === event.tokenId);
    // @ts-ignore
    userTransferredTroves[index].invalid = !!otherTransfers.length;
  });
  // @ts-ignore
  return userTransferredTroves.filter((event) => !event.invalid).map((event) => ({ troveId: event.tokenId }));
};

export const _getLiquityV2UserTroveIds = async (provider: PublicClient, network: NetworkNumber, selectedMarket: LiquityV2MarketInfo, troveNFTAddress: EthAddress, limitBlocksForEventFetching: boolean, account: EthAddress): Promise<{ troves: { troveId: string }[], nextFreeTroveIndex: string }> => {
  const [{ troves: userTroves, nextFreeTroveIndex }, userTransferredTroves] = await Promise.all([
    getUserTroves(provider, network, selectedMarket.isLegacy, account, selectedMarket.marketAddress),
    getTransferredTroves(provider, network, troveNFTAddress, limitBlocksForEventFetching, selectedMarket.value, account),
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

export const getLiquityV2UserTroveIds = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  selectedMarket: LiquityV2MarketInfo,
  troveNFTAddress: EthAddress,
  limitBlocksForEventFetching: boolean,
  account: EthAddress,
): Promise<{ troves: { troveId: string }[], nextFreeTroveIndex: string }> => _getLiquityV2UserTroveIds(getViemProvider(provider, network), network, selectedMarket, troveNFTAddress, limitBlocksForEventFetching, account);

const getDebtInFrontForSingleMarketLiquityV2 = async (
  provider: Client,
  network: NetworkNumber,
  isLegacy: boolean,
  marketAddress: EthAddress,
  troveId: string,
  accumulatedSum = '0',
  iterations = 2000,
): Promise<string> => {
  const viewContract = getLiquityV2ViewContract(provider, network, isLegacy);
  const res = await viewContract.read.getDebtInFront([marketAddress, BigInt(troveId), BigInt(accumulatedSum), BigInt(iterations)]);
  const next = res[0].toString();
  const debt = res[1].toString();
  if (next === '0') return assetAmountInEth(debt);
  return getDebtInFrontForSingleMarketLiquityV2(provider, network, isLegacy, marketAddress, next, debt, iterations);
};

const getDebtInFrontForInterestRateSingleMarketLiquityV2 = async (
  provider: Client,
  network: NetworkNumber,
  isLegacy: boolean,
  marketAddress: EthAddress,
  interestRate: string,
  troveId = '0',
  accumulatedSum = '0',
  iterations = 2000,
): Promise<string> => {
  const viewContract = getLiquityV2ViewContract(provider, network, isLegacy);
  if (+interestRate === 0 || !interestRate) return '0';
  const interestRateWei = new Dec(interestRate).times(1e16).toFixed(0).toString();
  const res = await viewContract.read.getDebtInFrontByInterestRate([marketAddress, BigInt(troveId), BigInt(accumulatedSum), BigInt(iterations), BigInt(interestRateWei)]);
  const next = res[0].toString();
  const debt = res[1].toString();
  if (next === '0') return assetAmountInEth(debt);
  return getDebtInFrontForInterestRateSingleMarketLiquityV2(provider, network, isLegacy, marketAddress, interestRate, next, debt, iterations);
};

const getUnbackedDebtForSingleMarket = async (totalBorrowed: string, provider: Client, network: NetworkNumber, stabilityPoolAddress: EthAddress) => {
  const stabilityPoolContract = createViemContractFromConfigFunc('LiquityV2StabilityPool', stabilityPoolAddress)(provider, network);
  const totalBoldDeposits = await stabilityPoolContract.read.getTotalBoldDeposits();
  const totalBoldDepositsInEth = assetAmountInEth(totalBoldDeposits.toString());

  return Dec.max(new Dec(totalBorrowed).sub(totalBoldDepositsInEth), 0).toString();
};

const getAllMarketsUnbackedDebts = async (markets: Record<LiquityV2Versions, LiquityV2MarketData>, isLegacy: boolean, provider: Client, network: NetworkNumber): Promise<Record<LiquityV2Versions, string>> => {
  const allMarketsUnbackedDebt = await Promise.all(Object.entries(markets).map(async ([version, market]) => {
    const { assetsData, marketData } = market;
    const { debtToken, isLegacy: isLegacyMarket } = LiquityV2Markets(network)[version as LiquityV2Versions];
    if (isLegacyMarket !== isLegacy) return [version, '0'];
    const unbackedDebt = await getUnbackedDebtForSingleMarket(assetsData[debtToken].totalBorrow, provider, network, marketData.stabilityPoolAddress);
    return [version, unbackedDebt];
  }));

  return Object.fromEntries(allMarketsUnbackedDebt) as Record<LiquityV2Versions, string>;
};

export const calculateDebtInFrontLiquityV2 = (markets: Record<LiquityV2Versions, LiquityV2MarketData>, selectedMarket: LiquityV2Versions, allMarketsUnbackedDebts: Record<LiquityV2Versions, string>, interestRateDebtInFront: string): string => {
  // Sanity check to avoid division by 0. Very unlikely to ever happen.
  const selectedMarketTotalBorrow = new Dec(markets[selectedMarket].assetsData[LiquityV2Markets(NetworkNumber.Eth)[selectedMarket].debtToken].totalBorrow);
  if (selectedMarketTotalBorrow.eq(0)) return new Dec(0).toString();

  const selectedMarketUnbackedDebt = new Dec(allMarketsUnbackedDebts[selectedMarket]);
  const { isLegacy } = LiquityV2Markets(NetworkNumber.Eth)[selectedMarket];
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
      const { isLegacy: isLegacyMarket } = LiquityV2Markets(NetworkNumber.Eth)[version as LiquityV2Versions];
      if (version === selectedMarket && isLegacyMarket !== isLegacy) return new Dec(interestRateDebtInFront);
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
    const { isLegacy: isLegacyMarket } = LiquityV2Markets(NetworkNumber.Eth)[version as LiquityV2Versions];
    if (version === selectedMarket && isLegacyMarket !== isLegacy) return new Dec(interestRateDebtInFront);
    const { assetsData } = market;
    const { debtToken } = LiquityV2Markets(NetworkNumber.Eth)[version as LiquityV2Versions];
    const unbackedDebt = new Dec(allMarketsUnbackedDebts[version as LiquityV2Versions]);
    const totalBorrow = new Dec(assetsData[debtToken].totalBorrow);
    const amountToRedeem = new Dec(interestRateDebtInFront).mul(unbackedDebt).div(selectedMarketUnbackedDebt);
    return Dec.min(amountToRedeem, totalBorrow);
  });

  return amountBeingRedeemedOnEachMarketByUnbackedDebt.reduce((acc, val) => acc.plus(val), new Dec(0)).toString();
};

export const getDebtInFrontForInterestRateIncludingNewDebtLiquityV2 = async (newDebt: string, markets: Record<LiquityV2Versions, LiquityV2MarketData>, selectedMarket: LiquityV2Versions, provider: Client, network: NetworkNumber, interestRate: string) => {
  const marketsWithNewDebt = JSON.parse(JSON.stringify(markets));
  const selectedMarketDebtToken = LiquityV2Markets(network)[selectedMarket].debtToken;
  const currentTotalBorrow = new Dec(marketsWithNewDebt[selectedMarket].assetsData[selectedMarketDebtToken].totalBorrow);
  marketsWithNewDebt[selectedMarket].assetsData[selectedMarketDebtToken].totalBorrow = currentTotalBorrow.add(newDebt).toString();

  const { isLegacy } = LiquityV2Markets(NetworkNumber.Eth)[selectedMarket];
  const allMarketsUnbackedDebts = await getAllMarketsUnbackedDebts(marketsWithNewDebt, isLegacy, provider, network);
  const interestRateDebtInFront = new Dec(await getDebtInFrontForInterestRateSingleMarketLiquityV2(provider, network, isLegacy, LiquityV2Markets(network)[selectedMarket].marketAddress, interestRate));

  return calculateDebtInFrontLiquityV2(marketsWithNewDebt, selectedMarket, allMarketsUnbackedDebts, interestRateDebtInFront.toString());
};


const getDebtInFrontLiquityV2 = async (markets: Record<LiquityV2Versions, LiquityV2MarketData>, selectedMarket: LiquityV2Versions, provider: Client, network: NetworkNumber, viewContract: any, troveId: string) => {
  const { isLegacy } = LiquityV2Markets(NetworkNumber.Eth)[selectedMarket];
  const allMarketsUnbackedDebts = await getAllMarketsUnbackedDebts(markets, isLegacy, provider, network);
  const interestRateDebtInFront = await getDebtInFrontForSingleMarketLiquityV2(provider, network, isLegacy, LiquityV2Markets(network)[selectedMarket].marketAddress, troveId);

  return calculateDebtInFrontLiquityV2(markets, selectedMarket, allMarketsUnbackedDebts, interestRateDebtInFront.toString());
};

/**
 * @param markets
 * @param selectedMarket
 * @param provider
 * @param network
 * @param viewContract
 * @param interestRate
 * @param debtInFrontBeingMoved - amound of debt being repositioned if interest rate is being increased (prevents including it as debt in front)
 */
const _getDebtInFrontForInterestRateLiquityV2 = async (markets: Record<LiquityV2Versions, LiquityV2MarketData>, selectedMarket: LiquityV2Versions, provider: Client, network: NetworkNumber, isLegacy: boolean, interestRate: string, debtInFrontBeingMoved: string = '0') => {
  const allMarketsUnbackedDebts = await getAllMarketsUnbackedDebts(markets, isLegacy, provider, network);
  const interestRateDebtInFront = new Dec(await getDebtInFrontForInterestRateSingleMarketLiquityV2(provider, network, isLegacy, LiquityV2Markets(network)[selectedMarket].marketAddress, interestRate))
    .sub(debtInFrontBeingMoved);

  return calculateDebtInFrontLiquityV2(markets, selectedMarket, allMarketsUnbackedDebts, interestRateDebtInFront.toString());
};

export const getDebtInFrontForInterestRateLiquityV2 = async (
  markets: Record<LiquityV2Versions, LiquityV2MarketData>,
  selectedMarket: LiquityV2Versions,
  provider: EthereumProvider,
  network: NetworkNumber,
  isLegacy: boolean,
  interestRate: string,
  debtInFrontBeingMoved: string = '0',
) => _getDebtInFrontForInterestRateLiquityV2(markets, selectedMarket, getViemProvider(provider, network), network, isLegacy, interestRate, debtInFrontBeingMoved);

export const _getLiquityV2TroveData = async (
  provider: Client,
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
  fetchDebtInFront: boolean = true,
): Promise<LiquityV2TroveData> => {
  const viewContract = getLiquityV2ViewContract(provider, network, selectedMarket.isLegacy);
  const { minCollRatio, batchCollRatio } = allMarketsData[selectedMarket.value].marketData;
  const { collateralToken, marketAddress, debtToken } = selectedMarket;
  const [_data, debtInFront] = await Promise.all([
    viewContract.read.getTroveInfo([marketAddress, BigInt(troveId)]),
    fetchDebtInFront ? getDebtInFrontLiquityV2(allMarketsData, selectedMarket.value, provider, network, selectedMarket.isLegacy, troveId) : Promise.resolve('0'),
  ]);
  const data = {
    ..._data,
    TCRatio: _data.TCRatio.toString() === MAXUINT ? '0' : _data.TCRatio.toString(), // mistake on contract side when debt is 0
  };
  const usedAssets: LiquityV2UsedAssets = {};

  const debtAssetData = assetsData[debtToken];
  const borrowed = assetAmountInEth(data.debtAmount.toString());
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
  const suppliedColl = assetAmountInEth(data.collAmount.toString());
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
  const lastInterestRateAdjTime = data.lastInterestRateAdjTime.toString();

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
    troveStatus: LIQUITY_V2_TROVE_STATUS_ENUM[parseInt(data.status.toString(), 10)],
    ...getLiquityV2AggregatedPositionData({
      usedAssets, assetsData, minCollRatio: liqRatio, interestRate,
    }),
    collRatio,
  };

  return payload;
};

export const getLiquityV2TroveData = async (
  provider: EthereumProvider,
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
  fetchDebtInFront: boolean = true,
): Promise<LiquityV2TroveData> => _getLiquityV2TroveData(
  getViemProvider(provider, network),
  network,
  {
    selectedMarket,
    assetsData,
    troveId,
    allMarketsData,
  },
  fetchDebtInFront,
);

export const getLiquityV2ClaimableCollateral = async (collSurplusPoolAddress: EthAddress, account: EthAddress, provider: EthereumProvider, network: NetworkNumber): Promise<string> => {
  const client = getViemProvider(provider, network);
  const collSurplusPoolContract = createViemContractFromConfigFunc('LiquityV2CollSurplusPool', collSurplusPoolAddress)(client, network);
  const claimableCollateral = await collSurplusPoolContract.read.getCollateral([account]);
  return claimableCollateral.toString();
};