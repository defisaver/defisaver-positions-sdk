require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('Aave v3', () => {
  let web3;
  let web3Base;
  let web3Opt;
  let web3Arb;
  before(async () => {
    web3 = new Web3(process.env.RPC);
    web3Opt = new Web3(process.env.RPCOPT);
    web3Base = new Web3(process.env.RPCBASE);
    web3Arb = new Web3(process.env.RPCARB);
  });

  it('has working contract', async () => {
    const res = await sdk.aaveV3.test(web3, 1);
    // console.log(res);
    assert.equal(res, '64');
  });

  const fetchMarketData = async (network, _web3, version = sdk.AaveVersions.AaveV3) => {
    const marketData = await sdk.aaveV3.getAaveV3MarketData(_web3, network, sdk.markets.AaveMarkets(network)[version], web3);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys = [
        'symbol', 'supplyRate', 'borrowRate', 'price', // ...
        'isSiloed', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network, web3, marketData, version = sdk.AaveVersions.AaveV3) => {
    const accountData = await sdk.aaveV3.getAaveV3AccountData(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', { selectedMarket: sdk.markets.AaveMarkets(network)[version], assetsData: marketData.assetsData });
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchFullPositionData = async (network, _web3) => {
    const positionData = await sdk.aaveV3.getAaveV3FullPositionData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', sdk.markets.AaveMarkets(network)[sdk.AaveVersions.AaveV3], web3);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchAccountBalances = async (network, web3, blockNumber) => {
    const balances = await sdk.aaveV3.getAaveV3AccountBalances(web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };

  // Ethereum

  it('can fetch apy after values data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const afterValues = await sdk.helpers.aaveHelpers.getApyAfterValuesEstimation(
      sdk.markets.AaveMarkets(network)[sdk.AaveVersions.AaveV3],
      [{ action: 'collateral', amount: '1000', asset: 'USDC' }],
      web3,
      network,
    );
  });

  it('can fetch market by market address for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const market = sdk.markets.getAaveV3MarketByMarketAddress('0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e', network);
  });

  it('can fetch market and account data for Lido Market Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, web3, sdk.AaveVersions.AaveV3Lido);
    await fetchAccountData(network, web3, marketData, sdk.AaveVersions.AaveV3Lido);
  });

  it('can fetch market and account data for Etherfi Market Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, web3, sdk.AaveVersions.AaveV3Etherfi);
    await fetchAccountData(network, web3, marketData, sdk.AaveVersions.AaveV3Etherfi);
  });

  it('can fetch market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, web3);
    await fetchAccountData(network, web3, marketData);
  });

  it('can fetch full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchFullPositionData(network, web3);
  });

  it('can fetch latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 'latest');
  });

  it('can fetch past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 18184392);
  });

  // Optimism

  it('can fetch market and account data for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    const marketData = await fetchMarketData(network, web3Opt);
    await fetchAccountData(network, web3Opt, marketData);
  });

  it('can fetch full position data for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    await fetchFullPositionData(network, web3Opt);
  });

  it('can fetch latest account balances for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    await fetchAccountBalances(network, web3Opt, 'latest');
  });

  it('can fetch past account balances for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    await fetchAccountBalances(network, web3Opt, 109851575);
  });

  // Arbitrum

  it('can fetch market and account data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    const marketData = await fetchMarketData(network, web3Arb);
    await fetchAccountData(network, web3Arb, marketData);
  });

  it('can fetch full position data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    await fetchFullPositionData(network, web3Arb);
  });

  it('can fetch latest account balances for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    await fetchAccountBalances(network, web3Arb, 'latest');
  });

  it('can fetch past account balances for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    await fetchAccountBalances(network, web3Arb, 130191171);
  });

  // Base

  it('can fetch market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    const marketData = await fetchMarketData(network, web3Base);
    await fetchAccountData(network, web3Base, marketData);
  });

  it('can fetch full position data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    await fetchFullPositionData(network, web3Base);
  });

  it('can fetch latest account balances for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    await fetchAccountBalances(network, web3Base, 'latest');
  });

  it('can fetch past account balances for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    await fetchAccountBalances(network, web3Base, 4256022);
  });
});
