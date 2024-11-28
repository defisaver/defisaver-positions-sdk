import 'dotenv/config';
import Web3 from 'web3';
import * as sdk from '../src';
import { getWeb3Instance } from './utils/getWeb3Instance';
import { NetworkNumber } from '../src/types/common';
import { EulerV2FullMarketData } from '../src';

const { assert } = require('chai');

describe('Euler v2', () => {
  let web3: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
  });

  const fetchMarketData = async (network: NetworkNumber, _web3: Web3) => {
    const marketData = await sdk.eulerV2.getEulerV2MarketsData(_web3, network, sdk.markets.EulerV2Markets(network)[sdk.EulerV2Versions.eUSDC2], web3);

    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys: (keyof typeof tokenData)[] = [
        'symbol', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _web3: Web3, marketInfo: EulerV2FullMarketData) => {
    const accountData = await sdk.eulerV2.getEulerV2AccountData(_web3, network, '0x2f86a98a2c67e9767554d29c687a2f8663aa785b', '0x2f86a98a2c67e9767554d29c687a2f8663aa785b', { selectedMarket: sdk.markets.EulerV2Markets(network)[sdk.EulerV2Versions.eUSDC2], assetsData: marketInfo.assetsData, marketData: marketInfo.marketData });

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