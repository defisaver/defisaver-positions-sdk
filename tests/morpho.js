require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('Morpho', () => {
  let web3;
  let web3Base;

  before(async () => {
    web3 = new Web3(process.env.RPC);
    web3Base = new Web3(process.env.RPCBASE);
  });

  const fetchMarketData = async (network, _web3, selectedMarket) => {
    const marketData = await sdk.morpho.getMorphoMarketData(_web3, network, selectedMarket, web3);
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
    const accountData = await sdk.morpho.getMorphoAccountData(
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

  const fetchAccountBalances = async (network, _web3, blockNumber, selectedMarket) => {
    const balances = await sdk.morpho.getMorphoAccountBalances(web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket);
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
    return balances;
  };

  // Balances

  it('can fetch wstETH/ETH balance for position for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthEth_945];

    const balances = await fetchAccountBalances(network, web3, 'latest', selectedMarket);
    // console.log(balances);
  });

  // Ethereum

  it('can fetch wstETH/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch sDAI/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoSDAIUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWBTCUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch ETH/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoEthUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthUSDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWBTCUSDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/USDA Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthUSDA_Exchange_Rate];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/PYUSD market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthPYUSD];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch weETH/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWeEthEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC/PYUSD market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWBTCPYUSD];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch WBTC/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWBTCEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch USDe/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoUSDeUSDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch sUSDe/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoSUSDeUSDT];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch sDAI/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoSDAIEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch ezETH/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoEzEthEth];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch MKR/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoMKRUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch tBTC/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoTBTCUSDC];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  // wstETH/WETH

  it('can fetch wstETH/ETH 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthEth_945];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/ETH 94.5% Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthEth_945_Exchange_Rate];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  it('can fetch wstETH/ETH 96.5% Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthEth_965_Exchange_Rate];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  // sUSDe/DAI
  it('can fetch sUSDe/DAI 77% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoSUSDeDAI_770];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch sUSDe/DAI 86% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoSUSDeDAI_860];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch sUSDe/DAI 91.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoSUSDeDAI_915];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch sUSDe/DAI 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoSUSDeDAI_945];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  // USDe/DAI
  it('can fetch USDe/DAI 77% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoUSDeDAI_770];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch USDe/DAI 86% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoUSDeDAI_860];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch USDe/DAI 91.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoUSDeDAI_915];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });
  it('can fetch USDe/DAI 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoUSDeDAI_945];

    const marketData = await fetchMarketData(network, web3, selectedMarket);
    await fetchAccountData(network, web3, marketData, selectedMarket);
  });

  // base

  it('can fetch cbETH/USDC 86% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoCbEthUSDC_860_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
  it('can fetch wstETH/ETH 94.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthEth_945_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
  it('can fetch wstETH/ETH 96.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthEth_965_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
  it('can fetch wstETH/USDC 86% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoWstEthUSDC_860_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
  it('can fetch cbETH/ETH 94.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoCbEthEth_945_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
  it('can fetch cbETH/ETH 96.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoCbEthEth_965_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
  it('can fetch ETH/USDC 86% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoEthUSDC_860_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
  it('can fetch rETH/USDC 86% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoREthUSDC_860_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });
  it('can fetch rETH/ETH 94.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoMarkets(network)[sdk.MorphoVersions.MorphoREthEth_945_Base];

    const marketData = await fetchMarketData(network, web3Base, selectedMarket);
    await fetchAccountData(network, web3Base, marketData, selectedMarket);
  });

  // utils
  it('can fetch wstETH/ETH 96.5% Lido Exchange rate market for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const market = sdk.markets.findMorphoMarket(
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
