import 'dotenv/config';

import * as sdk from '../src';

import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Aave v4', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchSpokeData = async (network: NetworkNumber, _provider: EthereumProvider, version = sdk.AaveV4SpokesType.AaveV4CoreSpoke) => {
    const marketData = await sdk.aaveV4.getAaveV4SpokeData(_provider, network, sdk.markets.AaveV4Spokes(network)[version] as sdk.AaveV4SpokeInfo);
    console.log(marketData);
    return marketData;
  };

  // Ethereum

  it('can fetch market and account data for Core Spoke Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchSpokeData(network, provider, sdk.AaveV4SpokesType.AaveV4CoreSpoke);
  });
});