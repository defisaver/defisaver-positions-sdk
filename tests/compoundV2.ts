import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { Blockish, NetworkNumber } from '../src/types/common';

const { assert } = require('chai');


describe('Compound v2', () => {
  let web3: Web3;
  before(async () => {
    if (!process.env.RPC) {
      throw new Error('RPC environment variable is not defined.');
    }
    web3 = new Web3(process.env.RPC);
  });

  const fetchMarketData = async (network: NetworkNumber, _web3: Web3) => {
    const marketData = await sdk.compoundV2.getCompoundV2MarketsData(_web3, network);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys: (keyof typeof tokenData)[] = [
        'symbol', 'supplyRate', 'borrowRate', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _web3: Web3, marketData: sdk.CompoundV2MarketsData) => {
    const accountData = await sdk.compoundV2.getCompoundV2AccountData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', marketData.assetsData);
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _web3: Web3) => {
    const positionData = await sdk.compoundV2.getCompoundV2FullPositionData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _web3: Web3, blockNumber: Blockish) => {
    const balances = await sdk.compoundV2.getCompoundV2AccountBalances(_web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
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

    await fetchAccountBalances(network, web3, 18000000);
  });
});