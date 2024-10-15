import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { Blockish, NetworkNumber } from '../src/types/common';
import { getWeb3Instance } from './utils/getWeb3Instance';

const { assert } = require('chai');

describe('CurveUsd', () => {
  let web3: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
  });

  const fetchMarketData = async (network: NetworkNumber, _web3: Web3, selectedMarket: sdk.CrvUSDMarketData) => {
    const marketData = await sdk.curveUsd.getCurveUsdGlobalData(_web3, network, selectedMarket);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['collateral', 'oraclePrice', 'ammPrice', 'totalDebt', 'bands']);
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _web3: Web3, marketData: sdk.CrvUSDGlobalMarketData, selectedMarket: sdk.CrvUSDMarketData) => {
    const accountData = await sdk.curveUsd.getCurveUsdUserData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket, marketData.activeBand);
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _web3: Web3, selectedMarket: sdk.CrvUSDMarketData) => {
    const positionData = await sdk.curveUsd.getCurveUsdFullPositionData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _web3: Web3, blockNumber: Blockish, controllerAddress: string) => {
    const balances = await sdk.curveUsd.getCrvUsdAccountBalances(_web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', controllerAddress);
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };


  it('can fetch ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch ETH market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDETH];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch ETH market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDETH].controllerAddress;

    await fetchAccountBalances(network, web3, 'latest', controllerAddress);
  });

  it('can fetch ETH market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDETH].controllerAddress;

    await fetchAccountBalances(network, web3, 18000000, controllerAddress);
  });

  it('can fetch wstETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDwstETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDwstETH];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch wstETH market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDwstETH].controllerAddress;

    await fetchAccountBalances(network, web3, 'latest', controllerAddress);
  });

  it('can fetch wstETH market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDwstETH].controllerAddress;

    await fetchAccountBalances(network, web3, 18000000, controllerAddress);
  });

  it('can fetch WBTC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDWBTC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDWBTC];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch WBTC market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDWBTC].controllerAddress;

    await fetchAccountBalances(network, web3, 'latest', controllerAddress);
  });

  it('can fetch WBTC market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDWBTC].controllerAddress;

    await fetchAccountBalances(network, web3, 18000000, controllerAddress);
  });

  it('can fetch tBTC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDtBTC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch tBTC market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDtBTC];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch tBTC market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDtBTC].controllerAddress;

    await fetchAccountBalances(network, web3, 'latest', controllerAddress);
  });

  it('can fetch tBTC market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDtBTC].controllerAddress;

    // in 18001227 block was tBTC controller deployed
    await fetchAccountBalances(network, web3, 18001300, controllerAddress);
  });

  it('can fetch sfrxETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDsfrxETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch sfrxETH market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDsfrxETH];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch sfrxETH market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDsfrxETH].controllerAddress;

    await fetchAccountBalances(network, web3, 'latest', controllerAddress);
  });

  it('can fetch sfrxETH market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDsfrxETH].controllerAddress;

    // in 18001224 block was sfrxETH controller deployed
    await fetchAccountBalances(network, web3, 18001300, controllerAddress);
  });
});