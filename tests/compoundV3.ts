import 'dotenv/config';

import * as sdk from '../src';

import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber,
} from '../src/types/common';
import { getProvider } from './utils/getProvider';
import { ZERO_ADDRESS } from '../src/constants';

const { assert } = require('chai');

describe('Compound v3', () => {
  let provider: EthereumProvider;
  let providerBase: EthereumProvider;
  let providerOpt: EthereumProvider;
  let providerArb: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
    providerOpt = getProvider('RPCOPT');
    providerBase = getProvider('RPCBASE');
    providerArb = getProvider('RPCARB');
  });

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider, selectedMarket: sdk.CompoundMarketData) => {
    const marketData = await sdk.compoundV3.getCompoundV3MarketsData(_provider, network, selectedMarket, provider);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys: (keyof typeof tokenData)[] = [
        'symbol', 'supplyRate', 'borrowRate', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, marketData: sdk.CompoundV3MarketsData, selectedMarket: sdk.CompoundMarketData) => {
    const accountData = await sdk.compoundV3.getCompoundV3AccountData(_provider, network, '0x8f02A8ecD8734381795FF251360DBf1730Cb46E6', ZERO_ADDRESS, { selectedMarket, assetsData: marketData.assetsData });
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _provider: EthereumProvider, selectedMarket: sdk.CompoundMarketData) => {
    const positionData = await sdk.compoundV3.getCompoundV3FullPositionData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', ZERO_ADDRESS, selectedMarket, provider);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, blockNumber: Blockish, marketAddr: EthAddress) => {
    const balances = await sdk.compoundV3.getCompoundV3AccountBalances(_provider, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', marketAddr);
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };

  // Ethereum

  it('can fetch market and account data for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch full position data for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch market and account data for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch full position data for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDC];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch market and account data for USDT Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDT];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch full position data for USDT Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDT];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch market and account data for wstETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3wstETH];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch full position data for wstETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3wstETH];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch market and account data for wstETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDS];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch full position data for wstETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDS];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch latest account balances for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 'latest', '0xa17581a9e3356d9a858b789d68b4d866e593ae94');
  });

  it('can fetch past account balances for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 18000000, '0xc3d688B66703497DAA19211EEdff47f25384cdc3');
  });

  // Arbitrum

  it('can fetch market and account data for ETH Market on Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, providerArb, selectedMarket);
    await fetchAccountData(network, providerArb, marketData, selectedMarket);
  });

  it('can fetch market and account data for USDT Market on Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDT];

    const marketData = await fetchMarketData(network, providerArb, selectedMarket);
    await fetchAccountData(network, providerArb, marketData, selectedMarket);
  });

  it('can fetch market and account data for USDC Market on Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDC];

    const marketData = await fetchMarketData(network, providerArb, selectedMarket);
    await fetchAccountData(network, providerArb, marketData, selectedMarket);
  });

  // Optimism

  it('can fetch market and account data for ETH Market on Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, providerOpt, selectedMarket);
    await fetchAccountData(network, providerOpt, marketData, selectedMarket);
  });

  it('can fetch market and account data for USDT Market on Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDT];

    const marketData = await fetchMarketData(network, providerOpt, selectedMarket);
    await fetchAccountData(network, providerOpt, marketData, selectedMarket);
  });

  // Base

  it('can fetch market and account data for ETH Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });

  it('can fetch full position data for ETH Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    await fetchFullPositionData(network, providerBase, selectedMarket);
  });

  it('can fetch market and account data for USDbC Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDbC];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });

  it('can fetch full position data for USDC Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDbC];

    await fetchFullPositionData(network, providerBase, selectedMarket);
  });

  it('can fetch latest account balances for ETH Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    await fetchAccountBalances(network, providerBase, 'latest', '0x46e6b214b524310239732D51387075E0e70970bf');
  });
});
