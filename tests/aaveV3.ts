import 'dotenv/config';

import * as sdk from '../src';

import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Aave v3', () => {
  let provider: EthereumProvider;
  let providerBase: EthereumProvider;
  let providerOpt: EthereumProvider;
  let providerArb: EthereumProvider;
  let providerLinea: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
    providerOpt = getProvider('RPCOPT');
    providerBase = getProvider('RPCBASE');
    providerArb = getProvider('RPCARB');
    providerLinea = getProvider('RPCLINEA');
  });

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider, version = sdk.AaveVersions.AaveV3) => {
    const marketData = await sdk.aaveV3.getAaveV3MarketData(_provider, network, sdk.markets.AaveMarkets(network)[version] as sdk.AaveMarketInfo);
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

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, marketData: sdk.AaveV3MarketData, version = sdk.AaveVersions.AaveV3) => {
    const accountData = await sdk.aaveV3.getAaveV3AccountData(_provider, network, '0x50d518f09cD64eB959F0D02e286517e8BcdA1946', { selectedMarket: sdk.markets.AaveMarkets(network)[version], assetsData: marketData.assetsData, eModeCategoriesData: marketData.eModeCategoriesData });
    // console.log(accountData);
    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchFullPositionData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const positionData = await sdk.aaveV3.getAaveV3FullPositionData(_provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', sdk.markets.AaveMarkets(network)[sdk.AaveVersions.AaveV3]);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'eModeCategories', // ...
    ]);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, blockNumber: Blockish) => {
    const balances = await sdk.aaveV3.getAaveV3AccountBalances(_provider, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
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
      provider,
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

    const marketData = await fetchMarketData(network, provider, sdk.AaveVersions.AaveV3Lido);
    await fetchAccountData(network, provider, marketData, sdk.AaveVersions.AaveV3Lido);
  });

  it('can fetch market and account data for Etherfi Market Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, provider, sdk.AaveVersions.AaveV3Etherfi);
    await fetchAccountData(network, provider, marketData, sdk.AaveVersions.AaveV3Etherfi);
  });

  it('can fetch market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, provider);
    await fetchAccountData(network, provider, marketData);
  });

  it('can fetch full position data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchFullPositionData(network, provider);
  });

  it('can fetch latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 'latest');
  });

  it('can fetch past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 18184392);
  });

  // Optimism

  it('can fetch market and account data for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    const marketData = await fetchMarketData(network, providerOpt);
    await fetchAccountData(network, providerOpt, marketData);
  });

  it('can fetch full position data for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    await fetchFullPositionData(network, providerOpt);
  });

  it('can fetch latest account balances for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    await fetchAccountBalances(network, providerOpt, 'latest');
  });

  it('can fetch past account balances for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    await fetchAccountBalances(network, providerOpt, 109851575);
  });

  // Arbitrum

  it('can fetch market and account data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    const marketData = await fetchMarketData(network, providerArb);
    await fetchAccountData(network, providerArb, marketData);
  });

  it('can fetch full position data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    await fetchFullPositionData(network, providerArb);
  });

  it('can fetch latest account balances for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    await fetchAccountBalances(network, providerArb, 'latest');
  });

  it('can fetch past account balances for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    await fetchAccountBalances(network, providerArb, 130191171);
  });

  // Base

  it('can fetch market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    const marketData = await fetchMarketData(network, providerBase);
    await fetchAccountData(network, providerBase, marketData);
  });

  it('can fetch full position data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    await fetchFullPositionData(network, providerBase);
  });

  it('can fetch latest account balances for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    await fetchAccountBalances(network, providerBase, 'latest');
  });

  it('can fetch past account balances for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    await fetchAccountBalances(network, providerBase, 4256022);
  });

  // Linea

  it('can fetch market and account data for Linea', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Linea;

    const marketData = await fetchMarketData(network, providerLinea);
    await fetchAccountData(network, providerLinea, marketData);
  });

  it('can fetch full position data for Linea', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Linea;

    await fetchFullPositionData(network, providerLinea);
  });

  it('can fetch latest account balances for Linea', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Linea;

    await fetchAccountBalances(network, providerLinea, 'latest');
  });

  it('can fetch past account balances for Linea', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Linea;

    await fetchAccountBalances(network, providerLinea, 22819963);
  });
});
