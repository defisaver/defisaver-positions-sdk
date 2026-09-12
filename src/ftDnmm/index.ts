import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  Balances, Blockish, EthAddress, EthereumProvider, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  FtDnmmAssetsData, FtDnmmMarketData, FtDnmmMarketInfo, FtDnmmPositionData, FtDnmmUsedAssets,
} from '../types';
import { FtDnmmOracleContractViem, FtDnmmViewContractViem } from '../contracts';
import { getViemProvider, setViemBlockNumber } from '../services/viem';
import { wethToEth } from '../services/utils';

const WAD = new Dec(10).pow(18);

// amount(wei) * price(wad USD) / 1e18 -> plain units * price -> USD
const amountUsd = (amountWei: string, priceWad: string, decimals: number) => (
  new Dec(amountWei).div(new Dec(10).pow(decimals)).mul(new Dec(priceWad).div(WAD)).toString()
);

// WETH is displayed as ETH only where the ETH asset resolves (mainnet convention);
// on Sonic/BNB the underlying stays WETH/WBNB
const displaySymbolFor = (symbol: string, network: NetworkNumber) => (
  network === NetworkNumber.Eth ? wethToEth(symbol) : symbol
);

export async function _getFtDnmmMarketData(provider: Client, network: NetworkNumber, selectedMarket: FtDnmmMarketData): Promise<FtDnmmMarketInfo> {
  const viewContract = FtDnmmViewContractViem(provider, network);
  const oracleContract = FtDnmmOracleContractViem(provider, network);

  const assetsData: FtDnmmAssetsData = {};

  await Promise.all(selectedMarket.assets.map(async (symbol) => {
    const assetInfo = getAssetInfo(symbol, network);
    if (!assetInfo.address) return;

    const [cfg, priceWad] = await Promise.all([
      viewContract.read.getAssetConfig([assetInfo.address as `0x${string}`]),
      oracleContract.read.priceUSD([assetInfo.address as `0x${string}`]),
    ]);

    const displaySymbol = displaySymbolFor(symbol, network);
    assetsData[displaySymbol] = {
      symbol: displaySymbol,
      address: assetInfo.address,
      price: new Dec(priceWad.toString()).div(WAD).toString(),
      mmBps: Number(cfg.mmBps),
      usageAsCollateralEnabled: cfg.collateral,
      canBeBorrowed: cfg.borrowable,
      canBeSupplied: cfg.enabled,
      enabled: cfg.enabled,
      supplyIncentives: [],
      borrowIncentives: [],
    };
  }));

  return { assetsData };
}

export async function getFtDnmmMarketData(provider: EthereumProvider, network: NetworkNumber, selectedMarket: FtDnmmMarketData): Promise<FtDnmmMarketInfo> {
  return _getFtDnmmMarketData(getViemProvider(provider, network), network, selectedMarket);
}

export async function _getFtDnmmAccountData(
  provider: Client,
  network: NetworkNumber,
  address: EthAddress,
  _extractedState: { selectedMarket: FtDnmmMarketData },
  blockNumber: Blockish = 'latest',
): Promise<FtDnmmPositionData> {
  const viewContract = FtDnmmViewContractViem(provider, network);
  const blockOpt = setViemBlockNumber(blockNumber);

  const [accountData, collateralInfos, debtInfos] = await Promise.all([
    viewContract.read.getAccountData([address as `0x${string}`], blockOpt),
    viewContract.read.getUserCollateral([address as `0x${string}`], blockOpt),
    viewContract.read.getUserDebts([address as `0x${string}`], blockOpt),
  ]);

  const usedAssets: FtDnmmUsedAssets = {};
  let suppliedUsd = new Dec(0);
  let borrowedUsd = new Dec(0);

  collateralInfos.forEach((c) => {
    if (c.avail === BigInt(0) && c.hold === BigInt(0)) return;
    const info = getAssetInfoByAddress(c.asset, network);
    const symbol = displaySymbolFor(info.symbol, network);
    const priceWad = c.priceUSD.toString();
    const supplied = assetAmountInEth(c.avail.toString(), symbol);
    const collateral = assetAmountInEth(new Dec(c.avail.toString()).plus(c.hold.toString()).toString(), symbol);
    const suppliedUsdAmount = amountUsd(c.avail.toString(), priceWad, info.decimals);
    const collateralUsdAmount = amountUsd(new Dec(c.avail.toString()).plus(c.hold.toString()).toString(), priceWad, info.decimals);

    usedAssets[symbol] = {
      symbol,
      supplied,
      suppliedUsd: suppliedUsdAmount,
      collateral,
      collateralUsd: collateralUsdAmount,
      isSupplied: c.avail > BigInt(0),
      borrowed: '0',
      borrowedUsd: '0',
      isBorrowed: false,
    };
    suppliedUsd = suppliedUsd.plus(collateralUsdAmount);
  });

  debtInfos.forEach((d) => {
    if (d.debt === BigInt(0)) return;
    const info = getAssetInfoByAddress(d.asset, network);
    const symbol = displaySymbolFor(info.symbol, network);
    const borrowed = assetAmountInEth(d.debt.toString(), symbol);
    const borrowedUsdAmount = amountUsd(d.debt.toString(), d.priceUSD.toString(), info.decimals);

    const existing = usedAssets[symbol];
    usedAssets[symbol] = {
      symbol,
      supplied: existing?.supplied || '0',
      suppliedUsd: existing?.suppliedUsd || '0',
      collateral: existing?.collateral || '0',
      collateralUsd: existing?.collateralUsd || '0',
      isSupplied: existing?.isSupplied || false,
      borrowed,
      borrowedUsd: borrowedUsdAmount,
      isBorrowed: d.debt > BigInt(0),
    };
    borrowedUsd = borrowedUsd.plus(borrowedUsdAmount);
  });

  return {
    usedAssets,
    suppliedUsd: suppliedUsd.toString(),
    borrowedUsd: borrowedUsd.toString(),
    ratio: new Dec(accountData.ratio.toString()).div(new Dec(10).pow(16)).toString(),
    equityUsd: new Dec(accountData.equityUSD.toString()).div(WAD).toString(),
    maintUsd: new Dec(accountData.maintUSD.toString()).div(WAD).toString(),
    collUsd: new Dec(accountData.collUSD.toString()).div(WAD).toString(),
    debtUsd: new Dec(accountData.debtUSD.toString()).div(WAD).toString(),
    enginePnlUsd: new Dec(accountData.enginePnlUSD.toString()).div(WAD).toString(),
    hfTargetBps: Number(accountData.hfTargetBps),
    hfSafeBps: Number(accountData.hfSafeBps),
    minEquityUsd: new Dec(accountData.minEquityUSD.toString()).div(WAD).toString(),
    isSubscribedToAutomation: false,
    lastUpdated: Date.now(),
  };
}

export async function getFtDnmmAccountData(
  provider: EthereumProvider,
  network: NetworkNumber,
  address: EthAddress,
  extractedState: { selectedMarket: FtDnmmMarketData },
  blockNumber: Blockish = 'latest',
): Promise<FtDnmmPositionData> {
  return _getFtDnmmAccountData(getViemProvider(provider, network), network, address, extractedState, blockNumber);
}

export async function _getFtDnmmAccountBalances(
  provider: Client,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  address: EthAddress,
): Promise<PositionBalances> {
  const viewContract = FtDnmmViewContractViem(provider, network);
  const blockOpt = setViemBlockNumber(block);

  const [collateralInfos, debtInfos] = await Promise.all([
    viewContract.read.getUserCollateral([address as `0x${string}`], blockOpt),
    viewContract.read.getUserDebts([address as `0x${string}`], blockOpt),
  ]);

  const collateral: Balances = {};
  const debt: Balances = {};

  collateralInfos.forEach((c) => {
    if (c.avail === BigInt(0) && c.hold === BigInt(0)) return;
    const key = addressMapping ? c.asset.toLowerCase() : displaySymbolFor(getAssetInfoByAddress(c.asset, network).symbol, network);
    collateral[key] = new Dec(c.avail.toString()).plus(c.hold.toString()).toString();
  });

  debtInfos.forEach((d) => {
    if (d.debt === BigInt(0)) return;
    const key = addressMapping ? d.asset.toLowerCase() : displaySymbolFor(getAssetInfoByAddress(d.asset, network).symbol, network);
    debt[key] = d.debt.toString();
  });

  return { collateral, debt };
}

export async function getFtDnmmAccountBalances(
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  address: EthAddress,
): Promise<PositionBalances> {
  return _getFtDnmmAccountBalances(getViemProvider(provider, network), network, block, addressMapping, address);
}

export async function getFtDnmmFullPositionData(
  provider: EthereumProvider,
  network: NetworkNumber,
  address: EthAddress,
  market: FtDnmmMarketData,
): Promise<FtDnmmPositionData> {
  const [_marketData, accountData] = await Promise.all([
    getFtDnmmMarketData(provider, network, market),
    getFtDnmmAccountData(provider, network, address, { selectedMarket: market }),
  ]);

  return accountData;
}
