require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');
const { EulerV2Versions } = require('../cjs/types/euler');

describe('Euler v2', () => {
  let web3;
  before(async () => {
    web3 = new Web3('https://rpc.tenderly.co/fork/6307fa38-d82a-4870-88dd-5feb7c0b2d15');
  });

  const fetchMarketData = async (network, _web3) => {
    const marketData = await sdk.eulerV2.getEulerV2MarketsData(_web3, network, sdk.markets.EulerV2Markets(network)[EulerV2Versions.eUSDC2], web3);

    console.log('test: \n', marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys = [
        'symbol', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network, web3, marketInfo) => {
    const accountData = await sdk.eulerV2.getEulerV2AccountData(web3, network, '0xe39b916a35d28d27741B46e1B49614AC6E966d33', { selectedMarket: sdk.markets.EulerV2Markets(network)[EulerV2Versions.eUSDC2], assetsData: marketInfo.assetsData, marketData: marketInfo.marketData });
    console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  it('can fetch market and account data for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, web3);

    const accountData = await fetchAccountData(network, web3, marketData);
  });
});
//
// const fetchFullPositionData = async (network, _web3) => {
//   const positionData = await sdk.aaveV3.getAaveV3FullPositionData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', sdk.markets.EulerMarkets(network)[sdk.AaveVersions.AaveV3], web3);
//   // console.log(positionData);
//   assert.containsAllKeys(positionData, [
//     'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
//   ]);
// };

// it('can fetch market by market address for Ethereum', async function () {
//   this.timeout(10000);
//   const network = NetworkNumber.Eth;
//
//   const market = sdk.markets.getAaveV3MarketByMarketAddress('0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e', network);
// });
//
// it('can fetch market and account data for Ethereum', async function () {
//   this.timeout(10000);
//   const network = NetworkNumber.Eth;
//
//   const marketData = await fetchMarketData(network, web3);
//   await fetchAccountData(network, web3, marketData);
// });
//
// it('can fetch full position data for Ethereum', async function () {
//   this.timeout(10000);
//   const network = NetworkNumber.Eth;
//
//   await fetchFullPositionData(network, web3);
// });