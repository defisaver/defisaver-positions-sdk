import 'dotenv/config';
import * as sdk from '../src';
import { FluidMainnetVersion, FluidMarketData, FluidVersions } from '../src';
import { EthAddress, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getFluidPositionWithMarket, getUserPositions } from '../src/fluid';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');
const util = require('util');


describe('Fluid', () => {
  let provider: EthereumProvider;
  let providerBase: EthereumProvider;
  let providerArb: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
    providerBase = getProvider('RPCBASE');
    providerArb = getProvider('RPCARB');
  });

  const testWhaleAddress = '0x01d1f55d94a53a9517c07f793f35320FAA0D2DCf';

  const fetchUserNftIds = async (user: EthAddress, network: NetworkNumber, _provider: EthereumProvider) => sdk.fluid.getFluidVaultIdsForUser(_provider, network, user);

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider, marketVersion: FluidVersions) => {
    const marketData = await sdk.fluid.getFluidMarketData(_provider, network, sdk.markets.FluidMarkets(network)[marketVersion]);
    // console.log(marketData);
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const tokenData of Object.values(marketData.assetsData)) {
      const keys: (keyof typeof tokenData)[] = [
        'symbol', 'price', // ...
      ];
      assert.containsAllKeys(tokenData, keys);
      for (const key of keys) assert.isDefined(tokenData[key], `${key} is undefined for ${tokenData.symbol}`);
    }
    // console.log(marketData);
    return marketData;
  };

  const fetchAllMarketData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const marketData = await sdk.fluid.getAllFluidMarketDataChunked(network, _provider);
    // console.log(marketData);

    return marketData;
  };

  const fetchUserPosition = async (marketData: FluidMarketData, vaultId: string) => {
    const accountData = await sdk.fluid.getFluidPosition(provider, NetworkNumber.Eth, vaultId, marketData);

    assert.containsAllKeys(accountData, [
      'usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', // ...
    ]);
  };

  const fetchUserPositionWithMarket = async (vaultId: string) => {
    const data = await getFluidPositionWithMarket(provider, NetworkNumber.Eth, vaultId);

    // console.log(util.inspect(data, { showHidden: false, depth: null, colors: true }));
  };

  it('can fetch all user positions on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const allUserPositions = await getUserPositions(provider, network, '0x01d1f55d94a53a9517c07f793f35320faa0d2dcf');
  });

  it('can fetch user nft ids on Ethereum', async function () {
    this.timeout(10000);
    const nftIds = await fetchUserNftIds(testWhaleAddress, NetworkNumber.Eth, provider);
    // console.log(nftIds);
  });

  it('can fetch market and for ETH_USDC_11 market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchMarketData(network, provider, FluidMainnetVersion.FLUID_ETH_USDC_1);
  });

  it('can fetch all market data on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const allMarketData = await fetchAllMarketData(network, provider);
  });

  it('get all user positions', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const allUserPositions = await sdk.fluid.getUserPositions(provider, network, '0x01d1f55d94a53a9517c07f793f35320faa0d2dcf');
  });
});
