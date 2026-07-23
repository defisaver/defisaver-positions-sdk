import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  Blockish, EthAddress, EthereumProvider, MMAssetsData, MMUsedAssets, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  DFSFeedRegistryContractViem, FeedRegistryContractViem, MorphoMidnightViewContractViem,
} from '../contracts';
import {
  MorphoMidnightAssetsData, MorphoMidnightMarketData, MorphoMidnightMarketInfo, MorphoMidnightPositionData,
} from '../types';
import { USD_QUOTE } from '../constants';
import { calculateNetApy } from '../staking';
import { isMainnetNetwork, wethToEth } from '../services/utils';
import { getMorphoMidnightAggregatedPositionData } from '../helpers/morphoMidnightHelpers';
import { getChainlinkAssetAddress } from '../services/priceService';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

const HARDCODED_USD_STABLE_PRICE = '100000000'; // $1 with 8 decimals
const nowInSeconds = () => Math.floor(Date.now() / 1000);

export async function _getMorphoMidnightMarketData(provider: Client, network: NetworkNumber, selectedMarket: MorphoMidnightMarketData): Promise<MorphoMidnightMarketInfo> {
  const { loanToken, collaterals, marketId } = selectedMarket;
  const loanTokenInfo = getAssetInfoByAddress(loanToken, network);
  const loanSym = wethToEth(loanTokenInfo.symbol);
  const loanTokenFeedAddress = getChainlinkAssetAddress(loanTokenInfo.symbol, network);

  const viewContract = MorphoMidnightViewContractViem(provider, network);
  const isHardcodedUsdStable = ['USDA', 'RLUSD'].includes(loanTokenInfo.symbol);

  let marketInfo;
  let loanTokenPrice;
  if (isMainnetNetwork(network)) {
    const feedRegistryContract = FeedRegistryContractViem(provider, NetworkNumber.Eth);
    const [_loanTokenPrice, _marketInfo] = await Promise.all([
      isHardcodedUsdStable ? Promise.resolve(HARDCODED_USD_STABLE_PRICE) : feedRegistryContract.read.latestAnswer([loanTokenFeedAddress, USD_QUOTE]),
      viewContract.read.getMarketInfo([marketId as `0x${string}`]),
    ]);
    marketInfo = _marketInfo;
    loanTokenPrice = _loanTokenPrice;
  } else {
    // Currently only Base is supported
    const feedRegistryContract = DFSFeedRegistryContractViem(provider, network);
    const [loanTokenPriceRound, _marketInfo] = await Promise.all([
      isHardcodedUsdStable ? Promise.resolve([0, HARDCODED_USD_STABLE_PRICE]) : feedRegistryContract.read.latestRoundData([loanTokenFeedAddress, USD_QUOTE]),
      viewContract.read.getMarketInfo([marketId as `0x${string}`]),
    ]);
    marketInfo = _marketInfo;
    loanTokenPrice = loanTokenPriceRound[1].toString();
  }

  const loanTokenUsd = new Dec(loanTokenPrice).div(1e8).toString();

  const totalUnits = marketInfo.totalUnits.toString();
  const withdrawable = marketInfo.withdrawable.toString();
  const totalDebt = Dec.max(new Dec(totalUnits).sub(withdrawable), 0).toString();

  const assetsData: MorphoMidnightAssetsData = {};
  assetsData[loanSym] = {
    symbol: loanSym,
    address: loanToken,
    price: loanTokenUsd,
    supplyRate: '0', // fixed rate is orderbook-derived, not exposed on-chain (MVP)
    borrowRate: '0',
    totalSupply: assetAmountInEth(totalUnits, loanSym),
    totalBorrow: assetAmountInEth(totalDebt, loanSym),
    canBeSupplied: true,
    canBeBorrowed: true,
    supplyIncentives: [],
    borrowIncentives: [],
  };

  const collateralSymbols: string[] = [];
  collaterals.forEach((coll, i) => {
    const collInfo = getAssetInfoByAddress(coll.token, network);
    const collSym = wethToEth(collInfo.symbol);
    collateralSymbols.push(collSym);
    // Oracle price is returned in loan-token terms, scaled by 10^(36 + loanDec - collDec)
    const scale = new Dec(10).pow(new Dec(36).add(loanTokenInfo.decimals).sub(collInfo.decimals).toString()).toString();
    const rawPrice = marketInfo.prices[i] ? marketInfo.prices[i].toString() : '0';
    const oracleRate = new Dec(rawPrice).div(scale).toString();
    assetsData[collSym] = {
      symbol: collSym,
      address: coll.token,
      price: new Dec(loanTokenUsd).mul(oracleRate).toString(),
      supplyRate: '0',
      borrowRate: '0',
      lltv: new Dec(coll.lltv).toString(),
      canBeSupplied: true,
      canBeBorrowed: false,
      supplyIncentives: [],
      borrowIncentives: [],
    };
  });

  const utillization = new Dec(totalUnits).eq(0) ? '0' : new Dec(totalDebt).div(totalUnits).mul(100).toString();

  return {
    id: marketInfo.id,
    loanToken: loanSym,
    collaterals: collateralSymbols,
    maturity: selectedMarket.maturity,
    isMatured: nowInSeconds() >= selectedMarket.maturity,
    totalUnits: assetAmountInEth(totalUnits, loanSym),
    withdrawable: assetAmountInEth(withdrawable, loanSym),
    totalDebt: assetAmountInEth(totalDebt, loanSym),
    lossFactor: marketInfo.lossFactor.toString(),
    tickSpacing: marketInfo.tickSpacing,
    utillization,
    assetsData,
  };
}

export async function getMorphoMidnightMarketData(provider: EthereumProvider, network: NetworkNumber, selectedMarket: MorphoMidnightMarketData): Promise<MorphoMidnightMarketInfo> {
  return _getMorphoMidnightMarketData(getViemProvider(provider, network), network, selectedMarket);
}

export async function _getMorphoMidnightAccountData(provider: Client, network: NetworkNumber, account: EthAddress, selectedMarket: MorphoMidnightMarketData, marketInfo: MorphoMidnightMarketInfo): Promise<MorphoMidnightPositionData> {
  const { marketId, collaterals } = selectedMarket;
  const viewContract = MorphoMidnightViewContractViem(provider, network);
  const positionInfo = await viewContract.read.getPositionInfo([marketId as `0x${string}`, account]);

  const usedAssets: MMUsedAssets = {};

  const loanTokenData = marketInfo.assetsData[marketInfo.loanToken];
  const credit = assetAmountInEth(positionInfo.credit.toString(), marketInfo.loanToken);
  const debt = assetAmountInEth(positionInfo.debt.toString(), marketInfo.loanToken);
  // A user holds either credit (lender) or debt (borrower) in a market, never both.
  usedAssets[marketInfo.loanToken] = {
    symbol: marketInfo.loanToken,
    supplied: credit,
    borrowed: debt,
    isSupplied: new Dec(positionInfo.credit.toString()).gt(0),
    isBorrowed: new Dec(positionInfo.debt.toString()).gt(0),
    collateral: false,
    suppliedUsd: new Dec(credit).mul(loanTokenData.price).toString(),
    borrowedUsd: new Dec(debt).mul(loanTokenData.price).toString(),
  };

  // positionInfo.collateral is index-aligned with the market's collateral set (0 where unused).
  collaterals.forEach((coll, i) => {
    const collInfo = getAssetInfoByAddress(coll.token, network);
    const collSym = wethToEth(collInfo.symbol);
    const rawAmount = positionInfo.collateral[i] ? positionInfo.collateral[i].toString() : '0';
    const supplied = assetAmountInEth(rawAmount, collSym);
    const collData = marketInfo.assetsData[collSym];
    usedAssets[collSym] = {
      symbol: collSym,
      supplied,
      borrowed: '0',
      isSupplied: new Dec(rawAmount).gt(0),
      isBorrowed: false,
      collateral: true,
      suppliedUsd: new Dec(supplied).mul(collData?.price || 0).toString(),
      borrowedUsd: '0',
    };
  });

  return {
    usedAssets,
    credit,
    debt,
    maturity: marketInfo.maturity,
    isMatured: marketInfo.isMatured,
    ...getMorphoMidnightAggregatedPositionData({ usedAssets, assetsData: marketInfo.assetsData, marketInfo }),
  };
}

export async function getMorphoMidnightAccountData(provider: EthereumProvider, network: NetworkNumber, account: EthAddress, selectedMarket: MorphoMidnightMarketData, marketInfo: MorphoMidnightMarketInfo): Promise<MorphoMidnightPositionData> {
  return _getMorphoMidnightAccountData(getViemProvider(provider, network), network, account, selectedMarket, marketInfo);
}

export const _getMorphoMidnightAccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress, selectedMarket: MorphoMidnightMarketData): Promise<PositionBalances> => {
  const balances: PositionBalances = { collateral: {}, debt: {} };
  if (!address) return balances;

  const { marketId, loanToken, collaterals } = selectedMarket;
  const viewContract = MorphoMidnightViewContractViem(provider, network, block);
  const positionInfo = await viewContract.read.getPositionInfo([marketId as `0x${string}`, address], setViemBlockNumber(block));

  const loanTokenInfo = getAssetInfoByAddress(loanToken, network);
  balances.debt = {
    [addressMapping ? loanTokenInfo.address.toLowerCase() : wethToEth(loanTokenInfo.symbol)]: assetAmountInEth(positionInfo.debt.toString(), wethToEth(loanTokenInfo.symbol)),
  };

  const collateral: Record<string, string> = {};
  collaterals.forEach((coll, i) => {
    const collInfo = getAssetInfoByAddress(coll.token, network);
    const rawAmount = positionInfo.collateral[i] ? positionInfo.collateral[i].toString() : '0';
    collateral[addressMapping ? collInfo.address.toLowerCase() : wethToEth(collInfo.symbol)] = assetAmountInEth(rawAmount, wethToEth(collInfo.symbol));
  });
  balances.collateral = collateral;

  return balances;
};

export const getMorphoMidnightAccountBalances = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  address: EthAddress,
  selectedMarket: MorphoMidnightMarketData,
): Promise<PositionBalances> => _getMorphoMidnightAccountBalances(getViemProvider(provider, network), network, block, addressMapping, address, selectedMarket);

// Lender-side (credit-only) supply position, mirroring getMorphoEarn. `amount` is the credit face value
// redeemable at maturity; `apy` is '0' in MVP because the fixed yield is orderbook-derived, not on-chain.
export async function getMorphoMidnightEarn(provider: Client, network: NetworkNumber, account: EthAddress, selectedMarket: MorphoMidnightMarketData, marketInfo: MorphoMidnightMarketInfo): Promise<{ apy: string, amount: string, amountUsd: string }> {
  const { marketId } = selectedMarket;
  const viewContract = MorphoMidnightViewContractViem(provider, network);
  const positionInfo = await viewContract.read.getPositionInfo([marketId as `0x${string}`, account]);

  const loanTokenData = marketInfo.assetsData[marketInfo.loanToken];
  const credit = assetAmountInEth(positionInfo.credit.toString(), marketInfo.loanToken);
  const creditUsd = new Dec(credit).mul(loanTokenData.price).toString();

  const usedAssets: MMUsedAssets = {
    [marketInfo.loanToken]: {
      symbol: marketInfo.loanToken,
      supplied: credit,
      borrowed: '0',
      isSupplied: new Dec(positionInfo.credit.toString()).gt(0),
      isBorrowed: false,
      collateral: false,
      suppliedUsd: creditUsd,
      borrowedUsd: '0',
    },
  };

  const { netApy } = calculateNetApy({ usedAssets, assetsData: marketInfo.assetsData as unknown as MMAssetsData });

  return { apy: netApy, amount: credit, amountUsd: creditUsd };
}
