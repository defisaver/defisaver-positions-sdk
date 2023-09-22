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
    const accountData = await sdk.curveUsd.getCurveUsdUserData(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket, marketData.activeBand);
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };

  const fetchFullPositionData = async (network, web3, selectedMarket) => {
    const positionData = await sdk.curveUsd.getCurveUsdFullPositionData(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'debtAmount', 'health', 'ratio', 'healthPercent', 'priceHigh', 'priceLow', // ...
    ]);
  };

  const fetchAccountBalances = async (network, web3, blockNumber, version) => {
    const balances = await sdk.curveUsd.getCrvUsdAccountBalances(web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', version);
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };


  it('can fetch ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.ETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch ETH market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.ETH];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch ETH market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 'latest', sdk.CrvUSDVersions.ETH);
  });

  it('can fetch ETH market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 18000000, sdk.CrvUSDVersions.ETH);
  });

  it('can fetch wstETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.wstETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.wstETH];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch wstETH market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 'latest', sdk.CrvUSDVersions.wstETH);
  });

  it('can fetch wstETH market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 18000000, sdk.CrvUSDVersions.wstETH);
  });

  it('can fetch WBTC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.WBTC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC market full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const selectedMarket = sdk.markets.CrvUsdMarkets(network)[sdk.CrvUSDVersions.WBTC];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch WBTC market latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 'latest', sdk.CrvUSDVersions.WBTC);
  });

  it('can fetch WBTC market past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 18000000, sdk.CrvUSDVersions.WBTC);
  });
});