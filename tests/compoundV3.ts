import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { Blockish, EthAddress, NetworkNumber } from '../src/types/common';
import { getWeb3Instance } from './utils/getWeb3Instance';

const { assert } = require('chai');

describe('Compound v3', () => {
  let web3: Web3;
  let web3Base: Web3;
  let web3Opt: Web3;
  let web3Arb: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
    web3Opt = getWeb3Instance('RPCOPT');
    web3Base = getWeb3Instance('RPCBASE');
    web3Arb = getWeb3Instance('RPCARB');
  });

  const fetchMarketData = async (network: NetworkNumber, _web3: Web3, selectedMarket: sdk.CompoundMarketData) => {
    const marketData = await sdk.compoundV3.getCompoundV3MarketsData(_web3, network, selectedMarket, web3);
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

  const fetchAccountData = async (network: NetworkNumber, _web3: Web3, marketData: sdk.CompoundV3MarketsData, selectedMarket: sdk.CompoundMarketData) => {
    const accountData = await sdk.compoundV3.getCompoundV3AccountData(_web3, network, '0x8f02A8ecD8734381795FF251360DBf1730Cb46E6', '', { selectedMarket, assetsData: marketData.assetsData });
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _web3: Web3, selectedMarket: sdk.CompoundMarketData) => {
    const positionData = await sdk.compoundV3.getCompoundV3FullPositionData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', '', selectedMarket, web3);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _web3: Web3, blockNumber: Blockish, marketAddr: EthAddress) => {
    const balances = await sdk.compoundV3.getCompoundV3AccountBalances(_web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', marketAddr);
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

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch full position data for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch market and account data for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch full position data for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDC];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch market and account data for USDT Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch full position data for USDT Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDT];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch market and account data for wstETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3wstETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch full position data for wstETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3wstETH];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch market and account data for wstETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDS];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch full position data for wstETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDS];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch latest account balances for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 'latest', '0xa17581a9e3356d9a858b789d68b4d866e593ae94');
  });

  it('can fetch past account balances for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 18000000, '0xc3d688B66703497DAA19211EEdff47f25384cdc3');
  });

  // Arbitrum

  it('can fetch market and account data for ETH Market on Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, web3Arb, selectedMarket);
    await fetchAccountData(network, web3Arb, marketData, selectedMarket);
  });

  it('can fetch market and account data for USDT Market on Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDT];

    const marketData = await fetchMarketData(network, web3Arb, selectedMarket);
    await fetchAccountData(network, web3Arb, marketData, selectedMarket);
  });

  it('can fetch market and account data for USDC Market on Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDC];

    const marketData = await fetchMarketData(network, web3Arb, selectedMarket);
    await fetchAccountData(network, web3Arb, marketData, selectedMarket);
  });

  // Optimism

  it('can fetch market and account data for ETH Market on Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, web3Opt, selectedMarket);
    await fetchAccountData(network, web3Opt, marketData, selectedMarket);
  });

  it('can fetch market and account data for USDT Market on Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDT];

    const marketData = await fetchMarketData(network, web3Opt, selectedMarket);
    await fetchAccountData(network, web3Opt, marketData, selectedMarket);
  });

  // Base

  it('can fetch market and account data for ETH Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });

  it('can fetch full position data for ETH Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    await fetchFullPositionData(network, web3Base, selectedMarket);
  });

  it('can fetch market and account data for USDbC Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDbC];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });

  it('can fetch full position data for USDC Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDbC];

    await fetchFullPositionData(network, web3Base, selectedMarket);
  });

  it('can fetch latest account balances for ETH Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    await fetchAccountBalances(network, web3Base, 'latest', '0x46e6b214b524310239732D51387075E0e70970bf');
  });

  it('can fetch past account balances for USDC Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    // await fetchAccountBalances(network, web3Base, 4256022, '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf');
  });

  it('can fetch market and account data for USDS Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDS];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
});
