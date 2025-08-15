import 'dotenv/config';
import * as sdk from '../src';
import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { EulerV2FullMarketData } from '../src';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Euler v2', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const marketData = await sdk.eulerV2.getEulerV2MarketsData(_provider, network, sdk.markets.EulerV2Markets(network)[sdk.EulerV2Versions.eUSDC2]);

    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys: (keyof typeof tokenData)[] = [
        'symbol', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, marketInfo: EulerV2FullMarketData) => {
    const accountData = await sdk.eulerV2.getEulerV2AccountData(_provider, network, '0x2f86a98a2c67e9767554d29c687a2f8663aa785b', '0x2f86a98a2c67e9767554d29c687a2f8663aa785b', { selectedMarket: sdk.markets.EulerV2Markets(network)[sdk.EulerV2Versions.eUSDC2], assetsData: marketInfo.assetsData, marketData: marketInfo.marketData });

    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  it('can fetch market and account data for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, provider);
    const accountData = await fetchAccountData(network, provider, marketData);
  });
});