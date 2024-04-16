require('dotenv').config();
const {assert} = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const {NetworkNumber} = require('../cjs/types/common');

describe('LlamaLend', () => {
  let web3Eth;
  let web3Arb;
  before(async () => {
    web3Eth = new Web3(process.env.RPC);
    web3Arb = new Web3(process.env.RPCARB)
  });

  // const fetchAccountBalances = async (network, web3, blockNumber) => {
  //   const balances = await sdk.llamaLend.getLlamaLendAccountBalances(web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
  //   // console.log(balances);
  //   assert.containsAllKeys(balances, [
  //     'collateral', 'debt',
  //   ]);
  // };

  const getWeb3ByNetwork = (network) => {
    if (network === NetworkNumber.Eth) return web3Eth;
    if (network === NetworkNumber.Arb) return web3Arb;
  }
  const fetchMarketData = async (network, web3, selectedMarket) => {

    const marketData = await sdk.llamaLend.getLlamaLendGlobalData(web3, network, selectedMarket);
    return marketData;
  };

  const fetchAccountData = async (network, web3, marketData, selectedMarket) => {
    const accountData = await sdk.llamaLend.getLlamaLendUserData(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket, marketData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };


  const getMarketsByNetwork = (network) => {
    const markets = sdk.markets.LlamaLendMarkets(network);
    return Object.values(markets).filter(({chainIds}) => chainIds.includes(network));
  };


  it('can fetch market data for Ethereum', async function () {
    this.timeout(10000);
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
