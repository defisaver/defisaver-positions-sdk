import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import {
  Blockish, EthAddress, MMUsedAssets, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  FeedRegistryContract,
  MorphoBlueViewContract,
} from '../contracts';
import {
  MorphoBlueAssetsData, MorphoBlueMarketData, MorphoBlueMarketInfo, MorphoBluePositionData,
} from '../types';
import { WAD, USD_QUOTE } from '../constants';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { wethToEth } from '../services/utils';
import {
  getBorrowRate, getMorphoBlueAggregatedPositionData, getRewardsForMarket, getSupplyRate,
} from '../helpers/morphoBlueHelpers';

export async function getMorphoBlueMarketData(web3: Web3, network: NetworkNumber, selectedMarket: MorphoBlueMarketData, mainnetWeb3: Web3): Promise<MorphoBlueMarketInfo> {
  const {
    loanToken, collateralToken, oracle, irm, lltv, oracleType,
  } = selectedMarket;
  const lltvInWei = new Dec(lltv).mul(WAD).toString();
  const loanTokenInfo = getAssetInfoByAddress(loanToken, network);
  const collateralTokenInfo = getAssetInfoByAddress(collateralToken, network);
  let loanTokenFeedAddress = loanTokenInfo.addresses[NetworkNumber.Eth];
  if (loanTokenInfo.symbol === 'WETH') {
    const ethAddress = getAssetInfo('ETH').address;
    loanTokenFeedAddress = ethAddress;
  }

  const feedRegistryContract = FeedRegistryContract(mainnetWeb3, NetworkNumber.Eth);
  const morphoBlueViewContract = MorphoBlueViewContract(web3, network);

  const [loanTokenPrice, marketInfo] = await Promise.all([
    loanTokenInfo.symbol === 'USDA' ? '100000000' : feedRegistryContract.methods.latestAnswer(loanTokenFeedAddress, USD_QUOTE).call(),
    morphoBlueViewContract.methods.getMarketInfoNotTuple(loanToken, collateralToken, oracle, irm, lltvInWei).call(),
  ]);

  let morphoSupplyApy = '0';
  let morphoBorrowApy = '0';
  try {
    const { supplyApy: _morphoSupplyApy, borrowApy: _morphoBorrowApy } = await getRewardsForMarket(selectedMarket.marketId);
    morphoSupplyApy = _morphoSupplyApy;
    morphoBorrowApy = _morphoBorrowApy;
  } catch (e) {
    console.error(e);
  }

  const supplyRate = getSupplyRate(marketInfo.totalSupplyAssets, marketInfo.totalBorrowAssets, marketInfo.borrowRate, marketInfo.fee);
  const compoundedBorrowRate = getBorrowRate(marketInfo.borrowRate, marketInfo.totalBorrowShares);
  const utillization = new Dec(marketInfo.totalBorrowAssets).div(marketInfo.totalSupplyAssets).mul(100).toString();

  const oracleScaleFactor = new Dec(36).add(loanTokenInfo.decimals).sub(collateralTokenInfo.decimals).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();

  const scale = new Dec(10).pow(loanTokenInfo.decimals).toString();

  const oracleRate = new Dec(marketInfo.oracle).div(oracleScale).toString();
  const assetsData: MorphoBlueAssetsData = {};
  assetsData[wethToEth(loanTokenInfo.symbol)] = {
    symbol: wethToEth(loanTokenInfo.symbol),
    address: loanToken,
    price: new Dec(loanTokenPrice).div(1e8).toString(),
    supplyRate,
    borrowRate: compoundedBorrowRate,
    totalSupply: new Dec(marketInfo.totalSupplyAssets).div(scale).toString(),
    totalBorrow: new Dec(marketInfo.totalBorrowAssets).div(scale).toString(),
    canBeSupplied: true,
    canBeBorrowed: true,
    incentiveSupplyApy: morphoSupplyApy,
    incentiveBorrowApy: morphoBorrowApy,
    incentiveSupplyToken: 'MORPHO',
    incentiveBorrowToken: 'MORPHO',
  };

  assetsData[wethToEth(collateralTokenInfo.symbol)] = {
    symbol: wethToEth(collateralTokenInfo.symbol),
    address: collateralToken,
    price: new Dec(assetsData[wethToEth(loanTokenInfo.symbol)].price).mul(oracleRate).toString(),
    supplyRate: '0',
    borrowRate: '0',
    canBeSupplied: true,
    canBeBorrowed: false,
  };
  if (STAKING_ASSETS.includes(collateralTokenInfo.symbol)) {
    assetsData[collateralTokenInfo.symbol].incentiveSupplyApy = await getStakingApy(collateralTokenInfo.symbol, mainnetWeb3);
    assetsData[collateralTokenInfo.symbol].incentiveSupplyToken = collateralTokenInfo.symbol;
  }

  return {
    id: marketInfo.id,
    fee: new Dec(marketInfo.fee).div(WAD).toString(),
    loanToken: wethToEth(loanTokenInfo.symbol),
    collateralToken: wethToEth(collateralTokenInfo.symbol),
    utillization,
    oracle: oracleRate,
    oracleType,
    lltv: new Dec(lltv).toString(),
    minRatio: new Dec(1).div(lltv).mul(100).toString(),
    assetsData,
  };
}

export const getMorphoBlueAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress, selectedMarket: MorphoBlueMarketData): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const viewContract = MorphoBlueViewContract(web3, network, block);
  const {
    loanToken, collateralToken, oracle, irm, lltv,
  } = selectedMarket;
  const lltvInWei = new Dec(lltv).mul(WAD).toString();
  const marketObject = {
    loanToken, collateralToken, oracle, irm, lltv: lltvInWei,
  };

  const loanInfo = await viewContract.methods.getUserInfo(marketObject, address).call({}, block);
  const loanTokenInfo = getAssetInfoByAddress(selectedMarket.loanToken, network);
  const collateralTokenInfo = getAssetInfoByAddress(selectedMarket.collateralToken, network);

  balances = {
    collateral: {
      [addressMapping ? collateralTokenInfo.address.toLowerCase() : wethToEth(collateralTokenInfo.symbol)]: assetAmountInEth(loanInfo.collateral, collateralTokenInfo.symbol),
    },
    debt: {
      [addressMapping ? loanTokenInfo.address.toLowerCase() : wethToEth(loanTokenInfo.symbol)]: assetAmountInEth(loanInfo.borrowedInAssets, loanTokenInfo.symbol),
    },
  };

  return balances;
};

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
  const loanTokenSupplied = assetAmountInEth(loanInfo.suppliedInAssets, marketInfo.loanToken);
  const loanTokenBorrowed = assetAmountInEth(loanInfo.borrowedInAssets, marketInfo.loanToken);
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
  const collateralTokenSupplied = assetAmountInEth(loanInfo.collateral, marketInfo.collateralToken);
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
    supplyShares: loanInfo.supplyShares,
    borrowShares: loanInfo.borrowShares,
    usedAssets,
    ...getMorphoBlueAggregatedPositionData({ usedAssets, assetsData: marketInfo.assetsData, marketInfo }),
  };
}
