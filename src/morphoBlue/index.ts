import Web3 from 'web3';
import Dec from 'decimal.js';
import { getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import { MMUsedAssets, NetworkNumber } from '../types/common';
import {
  MorphoBlueViewContract,
  getConfigContractAbi, getConfigContractAddress,
} from '../contracts';
import {
  MorphoBlueAssetsData, MorphoBlueMarketData, MorphoBlueMarketInfo, MorphoBluePositionData,
} from '../types';
import { WAD, SECONDS_PER_YEAR, USD_QUOTE } from '../constants';
import { getStakingApy } from '../staking';
import { getAbiItem, wethToEth } from '../services/utils';
import { multicall } from '../multicall';
import { getMorphoBlueAggregatedPositionData } from '../helpers/morphoBlueHelpers';


const compound = (ratePerSeconds: string) => {
  const compounding = new Dec(ratePerSeconds).mul(SECONDS_PER_YEAR).toString();
  const apyNumber = Math.expm1(new Dec(compounding).div(WAD).toNumber());
  return new Dec(apyNumber).mul(WAD).floor().toString();
};

const getSupplyRate = (totalSupplyAssets: string, totalBorrowAssets: string, borrowRate: string, fee: string) => {
  if (totalBorrowAssets === '0' || totalSupplyAssets === '0') {
    return 0;
  }
  const utillization = new Dec(totalBorrowAssets).mul(WAD).div(totalSupplyAssets).ceil()
    .toString();
  const supplyRate = new Dec(utillization).mul(borrowRate).div(WAD).ceil()
    .toString();
  const ratePerSecond = new Dec(supplyRate).mul(new Dec(WAD).minus(fee)).div(WAD).ceil()
    .toString();
  return compound(ratePerSecond);
};

const getBorrowRate = (borrowRate: string, totalBorrowShares: string) => {
  if (totalBorrowShares === '0') {
    return 0;
  }
  return compound(borrowRate);
};


export async function getMorphoBlueMarketData(web3: Web3, network: NetworkNumber, selectedMarket: MorphoBlueMarketData, mainnetWeb3: Web3): Promise<MorphoBlueMarketInfo> {
  const {
    loanToken, collateralToken, oracle, irm, lltv,
  } = selectedMarket;
  const lltvInWei = new Dec(lltv).mul(WAD).toString();
  const loanTokenInfo = getAssetInfoByAddress(loanToken);
  const collateralTokenInfo = getAssetInfoByAddress(collateralToken);
  let loanTokenFeedAddress = loanToken;
  if (loanTokenInfo.symbol === 'WETH') {
    const ethAddress = getAssetInfo('ETH').address;
    loanTokenFeedAddress = ethAddress;
  }

  const FeedRegistryAddress = getConfigContractAddress('FeedRegistry', network);
  const FeedRegistryAbi = getConfigContractAbi('FeedRegistry');

  const viewContractAddress = getConfigContractAddress('MorphoBlueView', network);
  const viewContractAbi = getConfigContractAbi('MorphoBlueView');

  const multicallCallsObject = [
    {
      target: FeedRegistryAddress,
      abiItem: getAbiItem(FeedRegistryAbi, 'latestAnswer'),
      params: [loanTokenFeedAddress, USD_QUOTE],
    },
    {
      target: viewContractAddress,
      abiItem: getAbiItem(viewContractAbi, 'getMarketInfoNotTuple'),
      params: [loanToken, collateralToken, oracle, irm, lltvInWei],
    },
  ];

  const multicallData = await multicall(multicallCallsObject, web3, network);
  const loanTokenPrice = multicallData[0][0];
  const marketInfo = multicallData[1][0];

  const supplyRate = getSupplyRate(marketInfo.totalSupplyAssets, marketInfo.totalBorrowAssets, marketInfo.borrowRate, marketInfo.fee);
  const compoundedBorrowRate = getBorrowRate(marketInfo.borrowRate, marketInfo.totalBorrowShares);
  const utillization = new Dec(marketInfo.totalBorrowAssets).div(marketInfo.totalSupplyAssets).mul(100).toString();

  const oracleRate = new Dec(marketInfo.oracle).div(1e36).toString();
  const assetsData: MorphoBlueAssetsData = {};
  assetsData[wethToEth(loanTokenInfo.symbol)] = {
    symbol: wethToEth(loanTokenInfo.symbol),
    address: loanToken,
    price: new Dec(loanTokenPrice).div(1e8).toString(),
    supplyRate: new Dec(supplyRate).div(WAD).mul(100).toString(),
    borrowRate: new Dec(compoundedBorrowRate).div(WAD).mul(100).toString(),
  };

  assetsData[wethToEth(collateralTokenInfo.symbol)] = {
    symbol: wethToEth(collateralTokenInfo.symbol),
    address: collateralToken,
    price: new Dec(loanTokenPrice).div(1e8).mul(oracleRate).toString(),
    supplyRate: '0',
    borrowRate: '0',
  };

  if (['wstETH', 'cbETH', 'rETH'].includes(collateralTokenInfo.symbol)) {
    assetsData[collateralTokenInfo.symbol].incentiveSupplyApy = await getStakingApy(collateralTokenInfo.symbol, mainnetWeb3);
    assetsData[collateralTokenInfo.symbol].incentiveSupplyToken = collateralTokenInfo.symbol;
  }

  return {
    id: marketInfo.id,
    totalSupplyAssets: new Dec(marketInfo.totalSupplyAssets).div(WAD).toString(),
    totalBorrowAssets: new Dec(marketInfo.totalBorrowAssets).div(WAD).toString(),
    fee: new Dec(marketInfo.fee).div(WAD).toString(),
    loanToken: wethToEth(loanTokenInfo.symbol),
    collateralToken: wethToEth(collateralTokenInfo.symbol),
    utillization,
    oracle: oracleRate,
    lltv: new Dec(lltv).toString(),
    assetsData,
  };
}

export async function getMorphoBlueAccountData(web3: Web3, network: NetworkNumber, account: string, selectedMarket: MorphoBlueMarketData, marketInfo: MorphoBlueMarketInfo): Promise<MorphoBluePositionData> {
  const {
    loanToken, collateralToken, oracle, irm, lltv,
  } = selectedMarket;
  const lltvInWei = new Dec(lltv).mul(WAD).toString();
  const marketObject = {
    loanToken, collateralToken, oracle, irm, lltv: lltvInWei,
  };
  const viewContract = MorphoBlueViewContract(web3, network);
  const loanInfo = await viewContract.methods.getUserInfo(marketObject, account).call();
  const usedAssets: MMUsedAssets = {};

  const loanTokenInfo = marketInfo.assetsData[marketInfo.loanToken];
  const loanTokenSupplied = new Dec(loanInfo.suppliedInAssets).div(WAD).toString();
  const loanTokenBorrowed = new Dec(loanInfo.borrowedInAssets).div(WAD).toString();
  usedAssets[marketInfo.loanToken] = {
    symbol: loanTokenInfo.symbol,
    supplied: loanTokenSupplied,
    borrowed: loanTokenBorrowed,
    isSupplied: new Dec(loanInfo.suppliedInAssets).gt(0),
    isBorrowed: new Dec(loanInfo.borrowedInAssets).gt(0),
    collateral: false,
    suppliedUsd: new Dec(loanTokenSupplied).mul(loanTokenInfo.price).toString(),
    borrowedUsd: new Dec(loanTokenBorrowed).mul(loanTokenInfo.price).toString(),
  };

  const collateralTokenInfo = marketInfo.assetsData[marketInfo.collateralToken];
  const collateralTokenSupplied = new Dec(loanInfo.collateral).div(WAD).toString();
  usedAssets[marketInfo.collateralToken] = {
    symbol: collateralTokenInfo.symbol,
    supplied: collateralTokenSupplied,
    borrowed: '0',
    isSupplied: new Dec(loanInfo.collateral).gt(0),
    isBorrowed: false,
    collateral: true,
    suppliedUsd: new Dec(collateralTokenSupplied).mul(collateralTokenInfo.price).toString(),
    borrowedUsd: '0',
  };

  return {
    usedAssets,
    ...getMorphoBlueAggregatedPositionData({ usedAssets, marketInfo }),
  };
}