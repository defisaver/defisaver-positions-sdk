import 'dotenv/config';

import * as sdk from '../src';

import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber,
} from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('CurveUsd', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider, selectedMarket: sdk.CrvUSDMarketData) => {
    const marketData = await sdk.curveUsd.getCurveUsdGlobalData(_provider, network, selectedMarket);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['collateral', 'oraclePrice', 'ammPrice', 'totalDebt', 'bands']);
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, marketData: sdk.CrvUSDGlobalMarketData, selectedMarket: sdk.CrvUSDMarketData) => {
    const accountData = await sdk.curveUsd.getCurveUsdUserData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket, marketData.activeBand);
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _provider: EthereumProvider, selectedMarket: sdk.CrvUSDMarketData) => {
    const positionData = await sdk.curveUsd.getCurveUsdFullPositionData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, blockNumber: Blockish, controllerAddress: EthAddress) => {
    const balances = await sdk.curveUsd.getCrvUsdAccountBalances(_provider, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', controllerAddress);
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };


  it('can fetch ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDETH];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch ETH market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDETH];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch ETH market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDETH].controllerAddress;

    await fetchAccountBalances(network, provider, 'latest', controllerAddress);
  });

  it('can fetch ETH market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDETH].controllerAddress;

    await fetchAccountBalances(network, provider, 18000000, controllerAddress);
  });

  it('can fetch wstETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDwstETH];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch wstETH market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDwstETH];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch wstETH market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDwstETH].controllerAddress;

    await fetchAccountBalances(network, provider, 'latest', controllerAddress);
  });

  it('can fetch wstETH market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDwstETH].controllerAddress;

    await fetchAccountBalances(network, provider, 18000000, controllerAddress);
  });

  it('can fetch WBTC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDWBTC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch WBTC market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDWBTC];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch WBTC market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDWBTC].controllerAddress;

    await fetchAccountBalances(network, provider, 'latest', controllerAddress);
  });

  it('can fetch WBTC market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDWBTC].controllerAddress;

    await fetchAccountBalances(network, provider, 18000000, controllerAddress);
  });

  it('can fetch tBTC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDtBTC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch tBTC market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDtBTC];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch tBTC market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDtBTC].controllerAddress;

    await fetchAccountBalances(network, provider, 'latest', controllerAddress);
  });

  it('can fetch tBTC market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDtBTC].controllerAddress;

    // in 18001227 block was tBTC controller deployed
    await fetchAccountBalances(network, provider, 18001300, controllerAddress);
  });

  it('can fetch sfrxETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDsfrxETH];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch sfrxETH market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDsfrxETH];

    await fetchFullPositionData(network, provider, selectedMarket);
  });

  it('can fetch sfrxETH market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDsfrxETH].controllerAddress;

    await fetchAccountBalances(network, provider, 'latest', controllerAddress);
  });

  it('can fetch sfrxETH market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const controllerAddress = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.crvUSDsfrxETH].controllerAddress;

    // in 18001224 block was sfrxETH controller deployed
    await fetchAccountBalances(network, provider, 18001300, controllerAddress);
  });
});