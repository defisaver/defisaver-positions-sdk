import 'dotenv/config';

import * as sdk from '../src';
import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Aave v2', () => {
  let provider: EthereumProvider;

  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const marketData = await sdk.aaveV2.getAaveV2MarketsData(_provider, network, sdk.markets.AaveMarkets(network)[sdk.AaveVersions.AaveV2]);
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

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, marketData: sdk.AaveV2MarketData) => {
    const accountData = await sdk.aaveV2.getAaveV2AccountData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', marketData.assetsData, sdk.markets.AaveMarkets(network)[sdk.AaveVersions.AaveV2]);
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const positionData = await sdk.aaveV2.getAaveV2FullPositionData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', sdk.markets.AaveMarkets(network)[sdk.AaveVersions.AaveV2]);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, blockNumber: Blockish) => {
    const balances = await sdk.aaveV2.getAaveV2AccountBalances(_provider, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
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
    this.timeout(100000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 18000000);
  });
});
