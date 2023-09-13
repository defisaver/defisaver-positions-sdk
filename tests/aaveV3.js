require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');

describe('Aave v3', () => {
  let web3;
  let web3Base;
  before(async () => {
    web3 = new Web3(process.env.RPC);
    web3Base = new Web3(process.env.RPCBASE);
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

  it('can fetch market data for Ethereum', async () => {
    const network = 1;
    const marketData = await sdk.aaveV3.getMarketData(web3, network, sdk.aaveV3.AaveMarkets(network)[sdk.aaveV3.AaveVersions.AaveV3]);
    console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys = [
        'symbol', 'supplyRate', 'borrowRate', 'price', // ...
        'isSiloed', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
  });

  it('can fetch market data for Base', async () => {
    const network = 8453;
    const marketData = await sdk.aaveV3.getMarketData(web3Base, network, sdk.aaveV3.AaveMarkets(network)[sdk.aaveV3.AaveVersions.AaveV3]);
    console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys = [
        'symbol', 'supplyRate', 'borrowRate', 'price', // ...
        'isSiloed', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
  });
});
