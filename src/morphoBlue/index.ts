import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  Blockish, EthAddress, EthereumProvider, IncentiveKind, MMUsedAssets, NetworkNumber, PositionBalances, MMAssetsData,
} from '../types/common';
import {
  DFSFeedRegistryContractViem, FeedRegistryContractViem, MorphoBlueViewContractViem,
} from '../contracts';
import {
  MorphoBlueAssetsData, MorphoBlueMarketData, MorphoBlueMarketInfo, MorphoBluePositionData,
} from '../types';
import { USD_QUOTE, WAD } from '../constants';
import { calculateNetApy, getStakingApy, STAKING_ASSETS } from '../staking';
import { isMainnetNetwork, wethToEth } from '../services/utils';
import {
  getBorrowRate, getMorphoBlueAggregatedPositionData, getRewardsForMarket, getSupplyRate,
} from '../helpers/morphoBlueHelpers';
import { getChainlinkAssetAddress } from '../services/priceService';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

export async function _getMorphoBlueMarketData(provider: Client, network: NetworkNumber, selectedMarket: MorphoBlueMarketData): Promise<MorphoBlueMarketInfo> {
  const {
    loanToken, collateralToken, oracle, irm, lltv, oracleType,
  } = selectedMarket;

  const lltvInWei = new Dec(lltv).mul(WAD).toString();
  const loanTokenInfo = getAssetInfoByAddress(loanToken, network);
  const collateralTokenInfo = getAssetInfoByAddress(collateralToken, network);

  const loanTokenFeedAddress = getChainlinkAssetAddress(loanTokenInfo.symbol, network);

  const morphoBlueViewContract = MorphoBlueViewContractViem(provider, network);

  let marketInfo;
  let loanTokenPrice;
  const isTokenUSDA = loanTokenInfo.symbol === 'USDA';
  const isMainnet = isMainnetNetwork(network);
  if (isMainnet) {
    const feedRegistryContract = FeedRegistryContractViem(provider, NetworkNumber.Eth);
    const [_loanTokenPrice, _marketInfo] = await Promise.all([
      isTokenUSDA ? Promise.resolve('100000000') : feedRegistryContract.read.latestAnswer([loanTokenFeedAddress, USD_QUOTE]),
      morphoBlueViewContract.read.getMarketInfoNotTuple([loanToken, collateralToken, oracle, irm, BigInt(lltvInWei)]),
    ]);
    marketInfo = _marketInfo;
    loanTokenPrice = _loanTokenPrice;
  } else {
    // Currently only base network is supported
    const feedRegistryContract = DFSFeedRegistryContractViem(provider, network);

    const [loanTokenPriceRound, _marketInfo] = await Promise.all([
      isTokenUSDA ? Promise.resolve([0, '100000000']) // Normalize to match the expected object structure
        : feedRegistryContract.read.latestRoundData([loanTokenFeedAddress, USD_QUOTE]),
      morphoBlueViewContract.read.getMarketInfoNotTuple([loanToken, collateralToken, oracle, irm, BigInt(lltvInWei)]),
    ]);
    marketInfo = _marketInfo;
    loanTokenPrice = loanTokenPriceRound[1].toString();
  }

  let morphoSupplyApy = '0';
  let morphoBorrowApy = '0';
  try {
    const { supplyApy: _morphoSupplyApy, borrowApy: _morphoBorrowApy } = await getRewardsForMarket(selectedMarket.marketId, network);
    morphoSupplyApy = _morphoSupplyApy;
    morphoBorrowApy = _morphoBorrowApy;
  } catch (e) {
    console.error(e);
  }

  const supplyRate = getSupplyRate(marketInfo.totalSupplyAssets.toString(), marketInfo.totalBorrowAssets.toString(), marketInfo.borrowRate.toString(), marketInfo.fee.toString());
  const compoundedBorrowRate = getBorrowRate(marketInfo.borrowRate.toString(), marketInfo.totalBorrowShares.toString());
  const utillization = new Dec(marketInfo.totalBorrowAssets.toString()).div(marketInfo.totalSupplyAssets.toString()).mul(100).toString();

  const oracleScaleFactor = new Dec(36).add(loanTokenInfo.decimals).sub(collateralTokenInfo.decimals).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();

  const scale = new Dec(10).pow(loanTokenInfo.decimals).toString();

  const oracleRate = new Dec(marketInfo.oracle.toString()).div(oracleScale).toString();
  const assetsData: MorphoBlueAssetsData = {};
  assetsData[wethToEth(loanTokenInfo.symbol)] = {
    symbol: wethToEth(loanTokenInfo.symbol),
    address: loanToken,
    price: new Dec(loanTokenPrice).div(1e8).toString(),
    supplyRate,
    borrowRate: compoundedBorrowRate,
    totalSupply: new Dec(marketInfo.totalSupplyAssets.toString()).div(scale).toString(),
    totalBorrow: new Dec(marketInfo.totalBorrowAssets.toString()).div(scale).toString(),
    canBeSupplied: true,
    canBeBorrowed: true,
    supplyIncentives: [{
      token: 'MORPHO',
      apy: morphoSupplyApy,
      incentiveKind: IncentiveKind.Reward,
      description: 'Eligible for protocol-level MORPHO incentives.',
    }],
    borrowIncentives: [{
      token: 'MORPHO',
      apy: morphoBorrowApy,
      incentiveKind: IncentiveKind.Reward,
      description: 'Eligible for protocol-level MORPHO incentives.',
    }],
  };

  assetsData[wethToEth(collateralTokenInfo.symbol)] = {
    symbol: wethToEth(collateralTokenInfo.symbol),
    address: collateralToken,
    price: new Dec(assetsData[wethToEth(loanTokenInfo.symbol)].price).mul(oracleRate).toString(),
    supplyRate: '0',
    borrowRate: '0',
    canBeSupplied: true,
    canBeBorrowed: false,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(collateralTokenInfo.symbol)) {
    assetsData[collateralTokenInfo.symbol].supplyIncentives = [{
      apy: await getStakingApy(collateralTokenInfo.symbol),
      token: collateralTokenInfo.symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${collateralTokenInfo.symbol} yield.`,
    }];
  }

  return {
    id: marketInfo.id,
    fee: new Dec(marketInfo.fee.toString()).div(WAD).toString(),
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

export async function getMorphoBlueMarketData(provider: EthereumProvider, network: NetworkNumber, selectedMarket: MorphoBlueMarketData): Promise<MorphoBlueMarketInfo> {
  return _getMorphoBlueMarketData(getViemProvider(provider, network), network, selectedMarket);
}

export const _getMorphoBlueAccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress, selectedMarket: MorphoBlueMarketData): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const viewContract = MorphoBlueViewContractViem(provider, network, block);
  const {
    loanToken, collateralToken, oracle, irm, lltv,
  } = selectedMarket;
  const lltvInWei = BigInt(new Dec(lltv).mul(WAD).toString());
  const marketObject = {
    loanToken, collateralToken, oracle, irm, lltv: lltvInWei,
  };

  const loanInfo = await viewContract.read.getUserInfo([marketObject, address], setViemBlockNumber(block));
  const loanTokenInfo = getAssetInfoByAddress(selectedMarket.loanToken, network);
  const collateralTokenInfo = getAssetInfoByAddress(selectedMarket.collateralToken, network);

  balances = {
    collateral: {
      [addressMapping ? collateralTokenInfo.address.toLowerCase() : wethToEth(collateralTokenInfo.symbol)]: assetAmountInEth(loanInfo.collateral.toString(), collateralTokenInfo.symbol),
    },
    debt: {
      [addressMapping ? loanTokenInfo.address.toLowerCase() : wethToEth(loanTokenInfo.symbol)]: assetAmountInEth(loanInfo.borrowedInAssets.toString(), loanTokenInfo.symbol),
    },
  };

  return balances;
};

export const getMorphoBlueAccountBalances = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  address: EthAddress,
  selectedMarket: MorphoBlueMarketData,
): Promise<PositionBalances> => _getMorphoBlueAccountBalances(getViemProvider(provider, network), network, block, addressMapping, address, selectedMarket);

export async function _getMorphoBlueAccountData(provider: Client, network: NetworkNumber, account: EthAddress, selectedMarket: MorphoBlueMarketData, marketInfo: MorphoBlueMarketInfo): Promise<MorphoBluePositionData> {
  const {
    loanToken, collateralToken, oracle, irm, lltv,
  } = selectedMarket;
  const lltvInWei = new Dec(lltv).mul(WAD).toString();
  const viewContract = MorphoBlueViewContractViem(provider, network);
  const loanInfo = (await viewContract.read.getUserInfo([
    {
      loanToken, collateralToken, oracle, irm, lltv: BigInt(lltvInWei),
    },
    account]));
  const usedAssets: MMUsedAssets = {};

  const loanTokenInfo = marketInfo.assetsData[marketInfo.loanToken];
  const loanTokenSupplied = assetAmountInEth(loanInfo.suppliedInAssets.toString(), marketInfo.loanToken);
  const loanTokenBorrowed = assetAmountInEth(loanInfo.borrowedInAssets.toString(), marketInfo.loanToken);
  usedAssets[marketInfo.loanToken] = {
    symbol: loanTokenInfo.symbol,
    supplied: loanTokenSupplied,
    borrowed: loanTokenBorrowed,
    isSupplied: new Dec(loanInfo.suppliedInAssets.toString()).gt(0),
    isBorrowed: new Dec(loanInfo.borrowedInAssets.toString()).gt(0),
    collateral: false,
    suppliedUsd: new Dec(loanTokenSupplied).mul(loanTokenInfo.price).toString(),
    borrowedUsd: new Dec(loanTokenBorrowed).mul(loanTokenInfo.price).toString(),
  };

  const collateralTokenInfo = marketInfo.assetsData[marketInfo.collateralToken];
  const collateralTokenSupplied = assetAmountInEth(loanInfo.collateral.toString(), marketInfo.collateralToken);
  usedAssets[marketInfo.collateralToken] = {
    symbol: collateralTokenInfo.symbol,
    supplied: collateralTokenSupplied,
    borrowed: '0',
    isSupplied: new Dec(loanInfo.collateral.toString()).gt(0),
    isBorrowed: false,
    collateral: true,
    suppliedUsd: new Dec(collateralTokenSupplied).mul(collateralTokenInfo.price).toString(),
    borrowedUsd: '0',
  };

  return {
    supplyShares: loanInfo.supplyShares.toString(),
    borrowShares: loanInfo.borrowShares.toString(),
    usedAssets,
    ...getMorphoBlueAggregatedPositionData({ usedAssets, assetsData: marketInfo.assetsData, marketInfo }),
  };
}

export async function getMorphoBlueAccountData(provider: EthereumProvider, network: NetworkNumber, account: EthAddress, selectedMarket: MorphoBlueMarketData, marketInfo: MorphoBlueMarketInfo): Promise<MorphoBluePositionData> {
  return _getMorphoBlueAccountData(getViemProvider(provider, network), network, account, selectedMarket, marketInfo);
}

export async function getMorphoEarn(provider: Client, network: NetworkNumber, account: EthAddress, selectedMarket: MorphoBlueMarketData, marketInfo: MorphoBlueMarketInfo): Promise<{ apy: string, amount: string, amountUsd: string }> {
  const {
    loanToken, collateralToken, oracle, irm, lltv,
  } = selectedMarket;
  const lltvInWei = new Dec(lltv).mul(WAD).toString();

  const viewContract = MorphoBlueViewContractViem(provider, network);
  const loanInfo = (await viewContract.read.getUserInfo([
    {
      loanToken, collateralToken, oracle, irm, lltv: BigInt(lltvInWei),
    },
    account]));

  const loanTokenInfo = marketInfo.assetsData[marketInfo.loanToken];
  const loanTokenSupplied = assetAmountInEth(loanInfo.suppliedInAssets.toString(), marketInfo.loanToken);
  const loanTokenSuppliedUsd = new Dec(loanTokenSupplied).mul(loanTokenInfo.price).toString();
  const usedAssets: MMUsedAssets = {
    [marketInfo.loanToken]: {
      symbol: loanTokenInfo.symbol,
      supplied: loanTokenSupplied,
      borrowed: '0',
      isSupplied: new Dec(loanInfo.suppliedInAssets.toString()).gt(0),
      isBorrowed: false,
      collateral: false,
      suppliedUsd: loanTokenSuppliedUsd,
      borrowedUsd: '0',
    },
  };

  const { netApy } = calculateNetApy({ usedAssets, assetsData: marketInfo.assetsData as unknown as MMAssetsData });

  return {
    apy: netApy,
    amount: loanTokenSupplied,
    amountUsd: loanTokenSuppliedUsd,
  };
}