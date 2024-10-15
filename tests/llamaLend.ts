import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { NetworkNumber } from '../src/types/common';

const { assert } = require('chai');

describe('LlamaLend', () => {
  let web3Eth: Web3;
  let web3Arb: Web3;
  before(async () => {
    if (!process.env.RPC) {
      throw new Error('RPC environment variable is not defined.');
    }
    web3Eth = new Web3(process.env.RPC);

    if (!process.env.RPCARB) {
      throw new Error('RPCARB environment variable is not defined.');
    }
    web3Arb = new Web3(process.env.RPCARB);
  });

  // const fetchAccountBalances = async (network, web3, blockNumber) => {
  //   const balances = await sdk.llamaLend.getLlamaLendAccountBalances(web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
  //   // console.log(balances);
  //   assert.containsAllKeys(balances, [
  //     'collateral', 'debt',
  //   ]);
  // };

  const getWeb3ByNetwork = (network: NetworkNumber) => {
    if (network === NetworkNumber.Arb) return web3Arb;
    return web3Eth;
  };
  const fetchMarketData = async (network: NetworkNumber, _web3: Web3, selectedMarket: sdk.LlamaLendMarketData) => {
    const marketData = await sdk.llamaLend.getLlamaLendGlobalData(_web3, network, selectedMarket, web3Eth);
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _web3: Web3, marketData: sdk.LlamaLendGlobalMarketData, selectedMarket: sdk.LlamaLendMarketData) => {
    const accountData = await sdk.llamaLend.getLlamaLendUserData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket, marketData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };


  const getMarketsByNetwork = (network: NetworkNumber) => {
    const markets = sdk.markets.LlamaLendMarkets(network);
    return Object.values(markets).filter(({ chainIds }) => chainIds.includes(network));
  };

  // it('can fetch market data for Ethereum', async function () {
  //   this.timeout(20000);
  //   const network = NetworkNumber.Eth;
  //   const web3 = getWeb3ByNetwork(network);
  //   const market = sdk.markets.LlamaLendMarkets(network)[sdk.LlamaLendVersions.LLPufethCrvusd];
  //   const marketData = await fetchMarketData(network, web3, market);

  //   delete marketData.bands;
  //   console.log(marketData);
  // });


  it('can fetch market data for Ethereum', async function () {
    this.timeout(20000);
    const network = NetworkNumber.Eth;
    const web3 = getWeb3ByNetwork(network);
    const markets = getMarketsByNetwork(network);

    for (const selectedMarket of markets) {
      const marketData = await fetchMarketData(network, web3, selectedMarket);
      await fetchAccountData(network, web3, marketData, selectedMarket);
    }
  });

  it('can fetch market data for Arbitrum', async function () {
    this.timeout(20000);
    const network = NetworkNumber.Arb;
    const web3 = getWeb3ByNetwork(network);
    const markets = getMarketsByNetwork(network);

    for (const selectedMarket of markets) {
      const marketData = await fetchMarketData(network, web3, selectedMarket);
      await fetchAccountData(network, web3, marketData, selectedMarket);
    }
  });

  // it('can fetch latest account balances for Ethereum', async function () {
  //   this.timeout(10000);
  //   const network = NetworkNumber.Eth;
  //
  //   await fetchAccountBalances(network, web3, 'latest');
  // });
  //
  // it('can fetch past account balances for Ethereum', async function () {
  //   this.timeout(10000);
  //   const network = NetworkNumber.Eth;
  //
  //   await fetchAccountBalances(network, web3, 18000000);
  // });
});
