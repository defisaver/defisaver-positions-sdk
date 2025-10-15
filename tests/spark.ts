import 'dotenv/config';

import * as sdk from '../src';

import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Spark', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const marketData = await sdk.spark.getSparkMarketsData(_provider, network, sdk.markets.SparkMarkets(network)[sdk.SparkVersions.SparkV1]);
    // console.log(marketData);
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

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, marketData: sdk.SparkMarketsData) => {
    const accountData = await sdk.spark.getSparkAccountData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', { assetsData: marketData.assetsData, eModeCategoriesData: marketData.eModeCategoriesData, selectedMarket: sdk.markets.SparkMarkets(network)[sdk.SparkVersions.SparkV1] });
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const positionData = await sdk.spark.getSparkFullPositionData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', sdk.markets.SparkMarkets(network)[sdk.SparkVersions.SparkV1]);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, blockNumber: Blockish) => {
    const balances = await sdk.spark.getSparkAccountBalances(_provider, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };

  it('can fetch market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, provider);
    await fetchAccountData(network, provider, marketData);
  });
  return;

  it('can fetch full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchFullPositionData(network, provider);
  });

  it('can fetch latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 'latest');
  });

  it('can fetch past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 18000000);
  });
});