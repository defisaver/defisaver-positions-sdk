import 'dotenv/config';

import * as sdk from '../src';

import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('LlamaLend', () => {
  let provider: EthereumProvider;
  let providerArb: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
    providerArb = getProvider('RPCARB');
  });

  const getProviderByNetwork = (network: NetworkNumber) => {
    if (network === NetworkNumber.Arb) return providerArb;
    return provider;
  };
  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider, selectedMarket: sdk.LlamaLendMarketData) => {
    const marketData = await sdk.llamaLend.getLlamaLendGlobalData(_provider, network, selectedMarket);
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, marketData: sdk.LlamaLendGlobalMarketData, selectedMarket: sdk.LlamaLendMarketData) => {
    const accountData = await sdk.llamaLend.getLlamaLendUserData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket, marketData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };


  const getMarketsByNetwork = (network: NetworkNumber) => {
    const markets = sdk.markets.LlamaLendMarkets(network);
    return Object.values(markets).filter(({ chainIds }) => chainIds.includes(network));
  };


  it('can fetch market data for Ethereum', async function () {
    this.timeout(20000);
    const network = NetworkNumber.Eth;
    const _provider = getProviderByNetwork(network);
    const markets = getMarketsByNetwork(network);

    for (const selectedMarket of markets) {
      const marketData = await fetchMarketData(network, _provider, selectedMarket);
      await fetchAccountData(network, _provider, marketData, selectedMarket);
    }
  });

  it('can fetch market data for Arbitrum', async function () {
    this.timeout(20000);
    const network = NetworkNumber.Arb;
    const _provider = getProviderByNetwork(network);
    const markets = getMarketsByNetwork(network);

    for (const selectedMarket of markets) {
      const marketData = await fetchMarketData(network, _provider, selectedMarket);
      await fetchAccountData(network, _provider, marketData, selectedMarket);
    }
  });
});
