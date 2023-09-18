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

  it('has market data', async () => {
    const { AaveMarkets } = sdk.aaveV3;
    assert.containsAllKeys(AaveMarkets(1), [sdk.aaveV3.AaveVersions.AaveV3]);
    for (const market of Object.values(AaveMarkets(1))) {
      const keys = ['chainIds', 'label', 'shortLabel', 'url', 'value', 'assets', 'provider', 'providerAddress', 'lendingPool', 'lendingPoolAddress', 'protocolData', 'protocolDataAddress', 'protocolName'];
      assert.containsAllKeys(market, keys);
      for (const key of keys) assert.isNotEmpty(market[key], `${key} is empty for ${market.label}`);
    }
  });

  it('has working contract', async () => {
    const res = await sdk.aaveV3.test(web3, 1);
    // console.log(res);
    assert.equal(res, '64');
  });

  const fetchMarketData = async (network, _web3) => {
    const marketData = await sdk.aaveV3.getMarketData(_web3, network, sdk.aaveV3.AaveMarkets(network)[sdk.aaveV3.AaveVersions.AaveV3], web3);
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

  const fetchAccountData = async (network, web3, marketData) => {
    const accountData = await sdk.aaveV3.getAaveV3AccountData(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', { selectedMarket: sdk.aaveV3.AaveMarkets(network)[sdk.aaveV3.AaveVersions.AaveV3], assetsData: marketData.assetsData });
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  it('can fetch market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, web3);
    await fetchAccountData(network, web3, marketData);
  });

  it('can fetch market and account data for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    const marketData = await fetchMarketData(network, web3Opt);
    await fetchAccountData(network, web3Opt, marketData);
  });

  it('can fetch market and account data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    const marketData = await fetchMarketData(network, web3Arb);
    await fetchAccountData(network, web3Arb, marketData);
  });

  it('can fetch market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    const marketData = await fetchMarketData(network, web3Base);
    await fetchAccountData(network, web3Base, marketData);
  });
});
