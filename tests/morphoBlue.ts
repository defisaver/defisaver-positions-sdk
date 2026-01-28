import 'dotenv/config';
import Dec from 'decimal.js';

import * as sdk from '../src';

import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');


describe('Morpho Blue', () => {
  let provider: EthereumProvider;
  let providerBase: EthereumProvider;
  let providerArb: EthereumProvider;

  before(async () => {
    provider = getProvider('RPC');
    providerBase = getProvider('RPCBASE');
    providerArb = getProvider('RPCARB');
  });

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider, selectedMarket: sdk.MorphoBlueMarketData) => {
    const marketData = await sdk.morphoBlue.getMorphoBlueMarketData(_provider, network, selectedMarket);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData', 'oracle', 'utillization']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys: (keyof typeof tokenData)[] = [
        'symbol', 'supplyRate', 'borrowRate', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, marketData: sdk.MorphoBlueMarketInfo, selectedMarket: sdk.MorphoBlueMarketData) => {
    const accountData = await sdk.morphoBlue.getMorphoBlueAccountData(
      _provider,
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

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, blockNumber: Blockish, selectedMarket: sdk.MorphoBlueMarketData) => {
    const balances = await sdk.morphoBlue.getMorphoBlueAccountBalances(_provider, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', selectedMarket);
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
    return balances;
  };

  // APY

  it('can fetch apy afters for wstETH/ETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_945];

    const { borrowRate, supplyRate } = await sdk.helpers.morphoBlueHelpers.getApyAfterValuesEstimation(
      selectedMarket,
      [
        {
          action: 'borrow',
          amount: '100',
          asset: 'ETH',
        },
        {
          action: 'supply',
          amount: '300',
          asset: 'ETH',
        },
      ],
      provider,
      network,
    );
    // console.log('borrowRate', borrowRate);
    // console.log('supplyRate', supplyRate);
  });

  // Allocator

  it('can fetch reallocatable liquidity for wstETH/ETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_965_Exchange_Rate];

    const { reallocatableLiquidity, targetBorrowUtilization } = await sdk.helpers.morphoBlueHelpers.getReallocatableLiquidity(selectedMarket.marketId, network);
    assert.isTrue(new Dec(reallocatableLiquidity).gt(0), 'No reallocatable liquidity found');
    assert.isTrue(new Dec(targetBorrowUtilization).gt(0), 'No target borrow utilization found');
  });

  it('can fetch vaults for reallocation for wstETH/ETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_965_Exchange_Rate];

    const { reallocatableLiquidity } = await sdk.helpers.morphoBlueHelpers.getReallocatableLiquidity(selectedMarket.marketId, network);
    const liquidityToAllocate = new Dec(reallocatableLiquidity).div(2).toString();
    const marketData = await fetchMarketData(network, provider, selectedMarket);

    const { vaults, withdrawals } = await sdk.helpers.morphoBlueHelpers.getReallocation(selectedMarket, marketData.assetsData, liquidityToAllocate, network);
    const numOfVaults = vaults.length;
    assert.isAbove(numOfVaults, 0, 'No vaults found');
    assert.equal(vaults.length, withdrawals.length, 'Vaults and withdrawals length mismatch');
  });

  // Balances

  it('can fetch wstETH/ETH balance for position for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_945];

    const balances = await fetchAccountBalances(network, provider, 'latest', selectedMarket);
    // console.log(balances);
  });

  // Ethereum

  it('can fetch wstETH/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthUSDC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch sDAI/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSDAIUSDC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch WBTC/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCUSDC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch ETH/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueEthUSDC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch wstETH/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthUSDT];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch WBTC/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCUSDT];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch wstETH/USDA Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthUSDA_Exchange_Rate];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch wstETH/PYUSD market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthPYUSD];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch WBTC/PYUSD market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCPYUSD];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch WBTC/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCEth];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch USDe/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeUSDT];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch sUSDe/USDT market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeUSDT];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch MKR/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueMKRUSDC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch tBTC/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueTBTCUSDC];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch cbBTC/ETH market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueCbBTCEth_915];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch cbBTC/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueCbBTCUSDC_860];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch sUSDe/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeUSDC_915];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch syrupUSDC/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSyrupUSDCUSDC_915];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch LBTC/USDC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueLBTCUSDC_860];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch LBTC/cbBTC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueLBTCCbBTC_945];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch sUSDe/USDtb market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeUSDtb_915];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch USDe/USDtb market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeUSDtb_915];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  // ezETH/ETH

  it('can fetch ezETH/ETH 86% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueEzEthEth_860];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch ezETH/ETH 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueEzEthEth_945];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  // weETH/ETH

  it('can fetch weETH/ETH 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWeEthEth_945];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  // wstETH/WETH

  it('can fetch wstETH/ETH 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_945];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch wstETH/ETH 94.5% Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_945_Exchange_Rate];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  it('can fetch wstETH/ETH 96.5% Lido Exchange rate market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_965_Exchange_Rate];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  // sUSDe/DAI
  it('can fetch sUSDe/DAI 86% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeDAI_860];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });
  it('can fetch sUSDe/DAI 91.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeDAI_915];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });
  it('can fetch sUSDe/DAI 94.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSUSDeDAI_945];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  // USDe/DAI
  it('can fetch USDe/DAI 86% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeDAI_860];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });
  it('can fetch USDe/DAI 91.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSDeDAI_915];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });
  it('can fetch USR/USDC 91.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueUSRUSDC_915];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });
  it('can fetch sUSDS/USDT 96.5% market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBluesUSDSUSDT_965];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });

  // ###### BASE ######

  it('can fetch cbETH/USDC 86% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueCbEthUSDC_860_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch wstETH/ETH 94.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_945_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch wstETH/ETH 96.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEth_965_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch wstETH/USDC 86% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthUSDC_860_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch cbETH/ETH 94.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueCbEthEth_945_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch cbETH/ETH 96.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueCbEthEth_965_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch ETH/USDC 86% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueEthUSDC_860_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch rETH/USDC 86% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueREthUSDC_860_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch rETH/ETH 94.5% market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueREthEth_945_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });

  it('can fetch cbBTC/ETH market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueCbBTCEth_915_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });

  it('can fetch cbBTC/USDC market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueCbBTCUSDC_860_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });

  it('can fetch LBTC/WBTC market and account data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueLBTCWBTC_945];

    const marketData = await fetchMarketData(network, provider, selectedMarket);
    await fetchAccountData(network, provider, marketData, selectedMarket);
  });
  it('can fetch LBTC/cbBTC market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueLBTCCbBTC_945_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch cbBTC/EURC market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueCbBTCEURC_860_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch wstETH/EURC market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthEURC_860_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });
  it('can fetch WETH/EURC market and account data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWETHEURC_860_Base];

    const marketData = await fetchMarketData(network, providerBase, selectedMarket);
    await fetchAccountData(network, providerBase, marketData, selectedMarket);
  });

  // Arbitrum
  it('can fetch syrupUSDC/USDC market and account data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueSyrupUSDCUSDC_915_Arb];

    const marketData = await fetchMarketData(network, providerArb, selectedMarket);
    await fetchAccountData(network, providerArb, marketData, selectedMarket);
  });
  it('can fetch WBTC/USDC market and account data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWBTCUSDC_860_Arb];

    const marketData = await fetchMarketData(network, providerArb, selectedMarket);
    await fetchAccountData(network, providerArb, marketData, selectedMarket);
  });
  it('can fetch wstETH/USDC market and account data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueWstEthUSDC_860_Arb];

    const marketData = await fetchMarketData(network, providerArb, selectedMarket);
    await fetchAccountData(network, providerArb, marketData, selectedMarket);
  });
  it('can fetch ETH/USDC market and account data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBlueEthUSDC_860_Arb];

    const marketData = await fetchMarketData(network, providerArb, selectedMarket);
    await fetchAccountData(network, providerArb, marketData, selectedMarket);
  });
  it('can fetch sUSDS/USDC market and account data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;
    const selectedMarket = sdk.markets.MorphoBlueMarkets(network)[sdk.MorphoBlueVersions.MorphoBluesUSDSUSDC_945_Arb];

    const marketData = await fetchMarketData(network, providerArb, selectedMarket);
    await fetchAccountData(network, providerArb, marketData, selectedMarket);
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
