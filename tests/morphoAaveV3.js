require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('Morpho Aave v3', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });

  const fetchMarketData = async (network, _web3) => {
    const marketData = await sdk.morphoAaveV3.getMorphoAaveV3MarketsData(_web3, network, sdk.markets.AaveMarkets(network)[sdk.AaveVersions.MorphoAaveV3Eth], web3);
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

  const fetchAccountData = async (network, web3, marketData) => {
    const accountData = await sdk.morphoAaveV3.getMorphoAaveV3AccountData(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', marketData.assetsData, '', sdk.markets.AaveMarkets(network)[sdk.AaveVersions.MorphoAaveV3Eth]);
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchFullPositionData = async (network, _web3) => {
    const positionData = await sdk.morphoAaveV3.getMorphoAaveV3FullPositionData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', '', sdk.markets.AaveMarkets(network)[sdk.AaveVersions.MorphoAaveV3Eth], web3);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchAccountBalances = async (network, web3, blockNumber) => {
    const balances = await sdk.morphoAaveV3.getMorphoAaveV3AccountBalances(web3, network, blockNumber, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };

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
});