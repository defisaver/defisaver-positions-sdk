/* eslint-disable func-names */
import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { NetworkNumber } from '../src/types/common';
import { getWeb3Instance } from './utils/getWeb3Instance';
import { LiquityV2ViewContract } from '../src/contracts';

const TROVE_ID = '71810214906374185731654292089929598901308110473187727225692166795279417034813';

describe('Liquity V2', () => {
  let web3: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
  });

  const fetchMarketData = async (_web3: Web3, network: NetworkNumber, market: sdk.LiquityV2MarketInfo) => {
    const marketData = await sdk.liquityV2.getLiquityV2MarketData(_web3, network, market, web3);
    // console.log(marketData.assetsData);
    return marketData;
  };

  const fetchAllMarketsData = async (_web3: Web3, network: NetworkNumber) => {
    const markets = sdk.markets.LiquityV2Markets(network);

    const marketsData: Record<sdk.LiquityV2Versions, sdk.LiquityV2MarketData> = {} as Record<sdk.LiquityV2Versions, sdk.LiquityV2MarketData>;

    for (const version of Object.keys(markets)) {
      const market = markets[version as sdk.LiquityV2Versions];

      marketsData[version as sdk.LiquityV2Versions] = await fetchMarketData(_web3, network, market);
    }

    return marketsData;
  };

  const fetchUserTroves = async (_web3: Web3, network: NetworkNumber, market: sdk.LiquityV2MarketInfo, marketData: sdk.LiquityV2MarketData) => {
    const { troves, nextFreeTroveIndex } = await sdk.liquityV2.getLiquityV2UserTroveIds(_web3, network, market, marketData.marketData.troveNFTAddress, false, '0x6162aA1E81c665143Df3d1f98bfED38Dd11A42eF');
    // console.log(troves);
    // console.log(nextFreeTroveIndex);
  };

  const fetchTroveData = async (_web3: Web3, network: NetworkNumber, market: sdk.LiquityV2MarketInfo, marketData: sdk.LiquityV2MarketData, troveId: string) => {
    const allMarketsData = await fetchAllMarketsData(_web3, network);
    const troveData = await sdk.liquityV2.getLiquityV2TroveData(_web3, network, {
      selectedMarket: market, assetsData: marketData.assetsData, troveId, allMarketsData,
    });
    // console.log(troveData);
  };

  it('can fetch troves for user on ETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2Eth];
    const marketData = await fetchMarketData(web3, network, market);

    await fetchUserTroves(web3, network, market, marketData);
  });

  it('can fetch troves for user on ETH Legacy market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2EthLegacy];
    const marketData = await fetchMarketData(web3, network, market);

    await fetchUserTroves(web3, network, market, marketData);
  });

  it('can fetch trove data for ETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2Eth];

    const marketData = await fetchMarketData(web3, network, market);
    await fetchTroveData(web3, network, market, marketData, TROVE_ID);
  });

  it('can fetch trove data for ETH Legacy market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2EthLegacy];

    const marketData = await fetchMarketData(web3, network, market);
    await fetchTroveData(web3, network, market, marketData, TROVE_ID);
  });


  it('can fetch trove data for wstETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2WstEth];

    const marketData = await fetchMarketData(web3, network, market);
    await fetchTroveData(web3, network, market, marketData, TROVE_ID);
  });

  it('can fetch trove data for wstETH Legacy market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2WstEthLegacy];

    const marketData = await fetchMarketData(web3, network, market);
    await fetchTroveData(web3, network, market, marketData, TROVE_ID);
  });

  it('can fetch trove data for rETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2REth];

    const marketData = await fetchMarketData(web3, network, market);
    await fetchTroveData(web3, network, market, marketData, TROVE_ID);
  });

  it('can fetch trove data for rETH Legacy market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2REthLegacy];

    const marketData = await fetchMarketData(web3, network, market);
    await fetchTroveData(web3, network, market, marketData, TROVE_ID);
  });

  it('can fetch claimable coll on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2Eth];

    const marketData = await fetchMarketData(web3, network, market);
    const claimableCollateral = await sdk.liquityV2.getLiquityV2ClaimableCollateral(marketData.marketData.collSurplusPoolAddress, '0x9768F31bd299fA1cA98EDd7Aa15Fc84d94C33f7C', web3, network);
  });

  it('can calculate ETH debt in front for interest rate on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.LiquityV2Versions.LiquityV2Eth;

    const allMarketsData = await fetchAllMarketsData(web3, network);
    const debtInFrontForInterestRate = await sdk.liquityV2.getDebtInFrontForInterestRateLiquityV2(allMarketsData, market, web3, network, LiquityV2ViewContract(web3, network), '6.1');
  });
});
