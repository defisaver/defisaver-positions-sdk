import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { NetworkNumber } from '../src/types/common';
import { getWeb3Instance } from './utils/getWeb3Instance';

const { assert } = require('chai');

describe('Liquity V2', () => {
  let web3: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
  });

  const fetchMarketData = async (_web3: Web3, network: NetworkNumber, market: sdk.LiquityV2MarketInfo) => {
    const marketData = await sdk.liquityV2.getLiquityV2MarketData(_web3, network, market, web3);
    // console.log(marketData);
    return marketData;
  };

  const fetchTroveData = async (_web3: Web3, network: NetworkNumber, market: sdk.LiquityV2MarketInfo, marketData: sdk.LiquityV2MarketData, troveId: string) => {
    const troveData = await sdk.liquityV2.getLiquityV2TroveData(_web3, network, market, marketData, troveId);
    // console.log(troveData);
  };


  it('can fetch trove data for ETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2Eth];

    const marketData = await fetchMarketData(web3, network, market);
    await fetchTroveData(web3, network, market, marketData, '28330600537984211306099040369902083180178695710251787024222071149278533694438');
  });


  it('can fetch trove data for wstETH market on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    const market = sdk.markets.LiquityV2Markets(network)[sdk.LiquityV2Versions.LiquityV2WstEth];

    const marketData = await fetchMarketData(web3, network, market);
    await fetchTroveData(web3, network, market, marketData, '28330600537984211306099040369902083180178695710251787024222071149278533694438');
  });
});