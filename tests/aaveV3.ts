import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { Blockish, NetworkNumber } from '../src/types/common';
import { getWeb3Instance } from './utils/getWeb3Instance';

const { assert } = require('chai');

describe('Aave v3', () => {
  let web3: Web3;
  let web3Base: Web3;
  let web3Opt: Web3;
  let web3Arb: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
    web3Opt = getWeb3Instance('RPCOPT');
    web3Base = getWeb3Instance('RPCBASE');
    web3Arb = getWeb3Instance('RPCARB');
  });

  it('has working contract', async () => {
    const res = await sdk.aaveV3.test(web3, 1);
    // console.log(res);
    assert.equal(res, '64');
  });

  const fetchMarketData = async (network: NetworkNumber, _web3: Web3, version = sdk.AaveVersions.AaveV3) => {
    const marketData = await sdk.aaveV3.getAaveV3MarketData(_web3, network, sdk.markets.AaveMarkets(network)[version] as sdk.AaveMarketInfo, web3);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys: (keyof typeof tokenData)[] = [
        'symbol', 'supplyRate', 'borrowRate', 'price', 'isSiloed', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _web3: Web3, marketData: sdk.AaveV3MarketData, version = sdk.AaveVersions.AaveV3) => {
    const accountData = await sdk.aaveV3.getAaveV3AccountData(_web3, network, '0x50d518f09cD64eB959F0D02e286517e8BcdA1946', { selectedMarket: sdk.markets.AaveMarkets(network)[version], assetsData: marketData.assetsData, eModeCategoriesData: marketData.eModeCategoriesData });
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _web3: Web3) => {
    const positionData = await sdk.aaveV3.getAaveV3FullPositionData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', sdk.markets.AaveMarkets(network)[sdk.AaveVersions.AaveV3], web3);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _web3: Web3, blockNumber: Blockish) => {
    const balances = await sdk.aaveV3.getAaveV3AccountBalances(_web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
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
