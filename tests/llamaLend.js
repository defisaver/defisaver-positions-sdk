require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('LlamaLend', () => {
  let web3;
  before(async () => {
    web3 = new Web3('https://rpc.tenderly.co/fork/b6fb5d2a-2c38-412d-a2d5-76296626d17f');
  });

  // const fetchAccountBalances = async (network, web3, blockNumber) => {
  //   const balances = await sdk.llamaLend.getLlamaLendAccountBalances(web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
  //   // console.log(balances);
  //   assert.containsAllKeys(balances, [
  //     'collateral', 'debt',
  //   ]);
  // };

  const fetchMarketData = async (network, web3, selectedMarket) => {
    const marketData = await sdk.llamaLend.getLlamaLendGlobalData(web3, network, selectedMarket);
    console.log(marketData);
    return marketData;
  };

  const fetchAccountData = async (network, web3, marketData, selectedMarket) => {
    const accountData = await sdk.llamaLend.getLlamaLendUserData(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket, marketData);
    console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };


  it('can fetch market data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.LlamaLendMarkets(network)[sdk.LlamaLendVersions.LlamaLendwstETHcrvUSD];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
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