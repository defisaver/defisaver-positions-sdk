import 'dotenv/config';
import Web3 from 'web3';
import { getWeb3Instance } from './utils/getWeb3Instance';
import * as sdk from '../src';
import { FluidMainnetVersion, FluidMarketData, FluidVersions } from '../src';
import { EthAddress, NetworkNumber } from '../src/types/common';
import { getFluidPositionWithMarket, getUserPositions } from '../src/fluid';

const { assert } = require('chai');
const util = require('util');


describe('Fluid', () => {
  let web3: Web3;
  let web3Base: Web3;
  let web3Arb: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
    web3Base = getWeb3Instance('RPCBASE');
    web3Arb = getWeb3Instance('RPCARB');
  });

  const testWhaleAddress = '0x01d1f55d94a53a9517c07f793f35320FAA0D2DCf';

  const fetchUserNftIds = async (user: EthAddress, network: NetworkNumber, _web3: Web3) => sdk.fluid.getFluidVaultIdsForUser(_web3, network, user);

  const fetchMarketData = async (network: NetworkNumber, _web3: Web3, marketVersion: FluidVersions) => {
    const marketData = await sdk.fluid.getFluidMarketData(_web3, network, sdk.markets.FluidMarkets(network)[marketVersion], web3);
    console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys: (keyof typeof tokenData)[] = [
        'symbol', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    console.log(marketData);
    return marketData;
  };

  const fetchAllMarketData = async (network: NetworkNumber, _web3: Web3) => {
    const marketData = await sdk.fluid.getAllFluidMarketDataChunked(network, _web3, web3);
    console.log(marketData);

    return marketData;
  };

  const fetchUserPosition = async (marketData: FluidMarketData, vaultId: string) => {
    const accountData = await sdk.fluid.getFluidPosition(web3, NetworkNumber.Eth, vaultId, marketData);

    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchUserPositionWithMarket = async (vaultId: string) => {
    const data = await getFluidPositionWithMarket(web3, NetworkNumber.Eth, vaultId, web3);

    console.log(util.inspect(data, { showHidden: false, depth: null, colors: true }));
  };

  it('can fetch all user positions on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const allUserPositions = await getUserPositions(web3, network, '0x01d1f55d94a53a9517c07f793f35320faa0d2dcf', web3);
  });

  it('can fetch user nft ids on Ethereum', async function () {
    this.timeout(10000);
    const nftIds = await fetchUserNftIds(testWhaleAddress, NetworkNumber.Eth, web3);
    console.log(nftIds);
  });

  it('can fetch market and for ETH_USDC_11 market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, web3, FluidMainnetVersion.FLUID_ETH_USDC_1);
  });

  it('can fetch all market data on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const allMarketData = await fetchAllMarketData(network, web3);
  });
  //
  //   const allMarketData = await fetchAllMarketData(network, web3);
  // });

  // it('can fetch user nft ids on Arbitrum', async function () {
  //   this.timeout(10000);
  //   const nftIds = await fetchUserNftIds(testWhaleAddress, NetworkNumber.Arb, web3Arb);
  //   console.log(nftIds);
  // });

  //   it('can fetch all market data on Arbitrum', async function () {
  //     this.timeout(10000);
  //     const network = NetworkNumber.Arb;
  //
  //     const allMarketData = await fetchAllMarketData(network, web3Arb);
  //   });
  //   it('can fetch all market data on Base', async function () {
  //     this.timeout(10000);
  //     const network = NetworkNumber.Base;
  //
  //     const allMarketData = await fetchAllMarketData(network, web3Base);
  //   });
  it('get all user positions', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const allUserPositions = await sdk.fluid.getUserPositions(web3, network, '0x01d1f55d94a53a9517c07f793f35320faa0d2dcf', web3);
  });
});
