require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('Morpho Blue', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });

  const fetchMarketData = async (network, _web3, selectedMarket) => {
    const marketData = await sdk.morphoBlue.getMorphoBlueMarketData(_web3, network, selectedMarket, web3);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData', 'oracle', 'utillization']);
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
    const accountData = await sdk.morphoBlue.getMorphoBlueAccountData(
      web3,
      network,
      '0x199666178740df61638b5fcd188eae70180cc8e8',
      selectedMarket,
      marketData,
    );
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ltv', // ...
    ]);
  };

  // Ethereum

  it('can fetch wstETH/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch rETH/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueREthEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
});
