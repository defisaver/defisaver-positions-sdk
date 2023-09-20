require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('CurveUsd', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });

  const fetchMarketData = async (network, _web3, selectedMarket) => {
    const marketData = await sdk.curveUsd.getCurveUsdGlobalData(_web3, network, selectedMarket);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['collateral', 'oraclePrice', 'ammPrice', 'totalDebt', 'bands']);
    return marketData;
  };

  const fetchAccountData = async (network, web3, marketData, selectedMarket) => {
    const accountData = await sdk.curveUsd.getCrvUsdUserData(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket, marketData.activeBand);
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };


  it('can fetch ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.ETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.wstETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.WBTC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
});