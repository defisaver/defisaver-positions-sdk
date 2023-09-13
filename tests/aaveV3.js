require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');

describe('Aave v3', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });

  it('sdk test', async () => {
    const res = await sdk.aaveV3.test(web3, 1);
    // console.log(res);
    assert.equal(res, '64');
  });

  // it('Fetches position data', async () => {
    // const marketData = await sdk.aaveV3.getMarketData(web3, 1, sdk.aaveV3.markets.v3);
    // assert.containsAllKeys(marketData, ['assetsData']);
  // });
});
