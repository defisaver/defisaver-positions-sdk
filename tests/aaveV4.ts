import 'dotenv/config';

import { getAssetInfo } from '@defisaver/tokens';
import * as sdk from '../src';

import { Blockish, EthereumProvider, NetworkNumber } from '../src';
import { getProvider } from './utils/getProvider';
import { getAaveV4UnderlyingFromReserveId } from '../src/aaveV4';
import { compareAddresses } from '../src/services/utils';

const { assert } = require('chai');

describe('Aave v4', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchSpokeData = async (network: NetworkNumber, _provider: EthereumProvider, version = sdk.AaveV4SpokesType.AaveV4MainSpoke) => {
    const marketData = await sdk.aaveV4.getAaveV4SpokeData(_provider, network, sdk.markets.AaveV4Spokes(network)[version] as sdk.AaveV4SpokeInfo);
    // console.log(marketData);
    return marketData;
  };

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, spokeData: sdk.AaveV4SpokeData) => {
    const accountData = await sdk.aaveV4.getAaveV4AccountData(_provider, network, spokeData, '0x57cc7f1aFA33411D2411549c15a2D2BAcf316709');
    console.log(accountData);
    return accountData;
  };

  // Ethereum

  it('can fetch market and account data for Main Spoke Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const marketData = await fetchSpokeData(network, provider, sdk.AaveV4SpokesType.AaveV4MainSpoke);
    await fetchAccountData(network, provider, marketData);
  });

  it('can fetch asset from reserveId', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;
    // gold spoke
    const goldSpoke = sdk.markets.AaveV4Spokes(network)[sdk.AaveV4SpokesType.AaveV4GoldSpoke];
    const XAUtReserveId = 0;
    const assetAddress = await getAaveV4UnderlyingFromReserveId(provider, network, goldSpoke.address, XAUtReserveId);
    // console.log(compareAddresses(assetAddress, getAssetInfo('XAUt', network).address));
  });
});