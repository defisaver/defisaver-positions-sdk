require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('Compound v3', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });

  const fetchMarketData = async (network, _web3, selectedMarket) => {
    const marketData = await sdk.compoundV3.getCompoundV3MarketsData(_web3, network, selectedMarket, '2', web3);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys = [
        'symbol', 'supplyRate', 'borrowRate', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network, web3, marketData, selectedMarket) => {
    const accountData = await sdk.compoundV3.getCompoundV3AccountData(web3, network, '0x8f02A8ecD8734381795FF251360DBf1730Cb46E6', '', { selectedMarket, assetsData: marketData.assetsData });
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };


  it('can fetch market and account data for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.compoundV3.CompoundMarkets(network)[sdk.compoundV3.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch market and account data for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.compoundV3.CompoundMarkets(network)[sdk.compoundV3.CompoundVersions.CompoundV3USDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
});
