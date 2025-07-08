/* eslint-disable func-names */
import 'dotenv/config';

import * as sdk from '../src';

import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const TROVE_ID = '70060145442968520127940599527972768745683442224908533738190719306518908292482';

describe('Liquity V2', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchMarketData = async (_provider: EthereumProvider, network: NetworkNumber, market: sdk.LiquityV2MarketInfo) => {
    const marketData = await sdk.liquityV2.getLiquityV2MarketData(_provider, network, market);
    // console.log(marketData.assetsData);
    return marketData;
  };

  const fetchAllMarketsData = async (_provider: EthereumProvider, network: NetworkNumber) => {
    const markets = sdk.markets.LiquityV2Markets(network);

    const marketsData: Record<sdk.LiquityV2Versions, sdk.LiquityV2MarketData> = {} as Record<sdk.LiquityV2Versions, sdk.LiquityV2MarketData>;

    for (const version of Object.keys(markets)) {
      const market = markets[version as sdk.LiquityV2Versions];

      marketsData[version as sdk.LiquityV2Versions] = await fetchMarketData(_provider, network, market);
    }

    return marketsData;
  };

  const fetchUserTroves = async (_provider: EthereumProvider, network: NetworkNumber, market: sdk.LiquityV2MarketInfo, marketData: sdk.LiquityV2MarketData) => {
    const { troves, nextFreeTroveIndex } = await sdk.liquityV2.getLiquityV2UserTroveIds(_provider, network, market, marketData.marketData.troveNFTAddress, false, '0xDc0Ad7a48088f1AA55d26f8b36F7C1E827DdD280');
    // console.log(troves);
    // console.log(nextFreeTroveIndex);
  };

  const fetchTroveData = async (_provider: EthereumProvider, network: NetworkNumber, market: sdk.LiquityV2MarketInfo, marketData: sdk.LiquityV2MarketData, troveId: string) => {
    const allMarketsData = await fetchAllMarketsData(_provider, network);
    const troveData = await sdk.liquityV2.getLiquityV2TroveData(_provider, network, {
      selectedMarket: market, assetsData: marketData.assetsData, troveId, allMarketsData,
    });
    // console.log(troveData);
  };

  it('can fetch troves for user on ETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2Eth];
    const marketData = await fetchMarketData(provider, network, market);

    await fetchUserTroves(provider, network, market, marketData);
  });

  it('can fetch troves for user on ETH Legacy market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2EthLegacy];
    const marketData = await fetchMarketData(provider, network, market);

    await fetchUserTroves(provider, network, market, marketData);
  });

  it('can fetch trove data for ETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2Eth];

    const marketData = await fetchMarketData(provider, network, market);
    await fetchTroveData(provider, network, market, marketData, TROVE_ID);
  });

  it('can fetch trove data for ETH Legacy market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2EthLegacy];

    const marketData = await fetchMarketData(provider, network, market);
    await fetchTroveData(provider, network, market, marketData, TROVE_ID);
  });


  it('can fetch trove data for wstETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2WstEth];

    const marketData = await fetchMarketData(provider, network, market);
    await fetchTroveData(provider, network, market, marketData, TROVE_ID);
  });

  it('can fetch trove data for wstETH Legacy market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2WstEthLegacy];

    const marketData = await fetchMarketData(provider, network, market);
    await fetchTroveData(provider, network, market, marketData, TROVE_ID);
  });

  it('can fetch trove data for rETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2REth];

    const marketData = await fetchMarketData(provider, network, market);
    await fetchTroveData(provider, network, market, marketData, TROVE_ID);
  });

  it('can fetch trove data for rETH Legacy market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2REthLegacy];

    const marketData = await fetchMarketData(provider, network, market);
    await fetchTroveData(provider, network, market, marketData, TROVE_ID);
  });

  it('can fetch claimable coll on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2Eth];

    const marketData = await fetchMarketData(provider, network, market);
    const claimableCollateral = await sdk.liquityV2.getLiquityV2ClaimableCollateral(marketData.marketData.collSurplusPoolAddress, '0x9768F31bd299fA1cA98EDd7Aa15Fc84d94C33f7C', provider, network);
  });

  it('can calculate ETH debt in front for interest rate on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.LiquityV2Versions.LiquityV2Eth;

    const allMarketsData = await fetchAllMarketsData(provider, network);
    const debtInFrontForInterestRate = await sdk.liquityV2.getDebtInFrontForInterestRateLiquityV2(allMarketsData, market, provider, network, false, '6.1');
  });
});
