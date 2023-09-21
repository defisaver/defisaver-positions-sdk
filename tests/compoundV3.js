require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('Compound v3', () => {
  let web3;
  let web3Base;
  before(async () => {
    web3 = new Web3(process.env.RPC);
    web3Base = new Web3(process.env.RPCBASE);
  });

  const fetchMarketData = async (network, _web3, selectedMarket) => {
    const marketData = await sdk.compoundV3.getCompoundV3MarketsData(_web3, network, selectedMarket, '2', web3);
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

  const fetchFullPositionData = async (network, _web3, selectedMarket) => {
    const positionData = await sdk.compoundV3.getCompoundV3FullPositionData(_web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', '', selectedMarket, '2', web3);
    // console.log(positionData);
    assert.containsAllKeys(positionData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };


  it('can fetch market and account data for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch full position data for ETH Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch market and account data for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch full position data for USDC Market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDC];

    await fetchFullPositionData(network, web3, selectedMarket);
  });

  it('can fetch market and account data for ETH Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });

  it('can fetch full position data for ETH Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3ETH];

    await fetchFullPositionData(network, web3Base, selectedMarket);
  });

  it('can fetch market and account data for USDbC Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDbC];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });

  it('can fetch full position data for USDC Market on Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.CompoundMarkets(network)[sdk.CompoundVersions.CompoundV3USDbC];

    await fetchFullPositionData(network, web3Base, selectedMarket);
  });
});
