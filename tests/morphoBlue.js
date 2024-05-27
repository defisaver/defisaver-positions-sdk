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

  it('can fetch wstETH/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch sDAI/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSDAIUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch ETH/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueEthUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WSTETH/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthUSDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCUSDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/USDA Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthUSDA_Exchange_Rate];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/PYUSD market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthPYUSD];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch weETH/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWeEthEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC/PYUSD market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCPYUSD];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch USDe/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeUSDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch sUSDe/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeUSDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch sDAI/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSDAIEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch ezETH/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueEzEthEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  // wstETH/WETH

  it('can fetch wstETH/ETH 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_945];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/ETH 94.5% Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_945_Exchange_Rate];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/ETH 96.5% Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_965_Exchange_Rate];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  // sUSDe/DAI
  it('can fetch sUSDe/DAI 77% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeDAI_770];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch sUSDe/DAI 86% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeDAI_860];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch sUSDe/DAI 91.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeDAI_915];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch sUSDe/DAI 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeDAI_945];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  // USDe/DAI
  it('can fetch USDe/DAI 77% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeDAI_770];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch USDe/DAI 86% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeDAI_860];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch USDe/DAI 91.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeDAI_915];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch USDe/DAI 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeDAI_945];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  // utils
  it('can fetch wstETH/ETH 96.5% Lido Exchange rate market for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const market = sdk.markets.findMorphoBlueMarket(
      '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      0.965,
      '0xbD60A6770b27E084E8617335ddE769241B0e71D8',
      '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
      network,
    );
    if (!market) throw new Error('Market not found');
  });
});
