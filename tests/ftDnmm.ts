import 'dotenv/config';

import * as sdk from '../src';

import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber,
} from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

// NOTE: requires the FtDnmmView contract to be deployed (addresses in src/config/contracts.ts
// are zero placeholders until then) and RPC/RPCSONIC/RPCBNB set in .env
describe('ftDnmm', function () {
  this.timeout(30_000);

  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchMarketData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const marketData = await sdk.ftDnmm.getFtDnmmMarketData(_provider, network, sdk.markets.FT_DNMM(network));
    assert.containsAllKeys(marketData, ['assetsData']);
    for (const assetData of Object.values(marketData.assetsData)) {
      assert.containsAllKeys(assetData, ['symbol', 'address', 'price', 'mmBps', 'usageAsCollateralEnabled', 'canBeBorrowed']);
      assert.isTrue(assetData.enabled);
      assert.notEqual(assetData.address, '');
    }
  };

  const fetchAccountData = async (network: NetworkNumber, _provider: EthereumProvider, address: EthAddress) => {
    const accountData = await sdk.ftDnmm.getFtDnmmAccountData(_provider, network, address, { selectedMarket: sdk.markets.FT_DNMM(network) });
    assert.containsAllKeys(accountData, ['usedAssets', 'suppliedUsd', 'borrowedUsd', 'ratio', 'equityUsd', 'maintUsd', 'hfTargetBps', 'hfSafeBps']);
    assert.isNumber(accountData.hfTargetBps);
    assert.isAtLeast(accountData.hfTargetBps, 10_000);
  };

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, address: EthAddress, block: Blockish = 'latest') => {
    const balances = await sdk.ftDnmm.getFtDnmmAccountBalances(_provider, network, block, false, address);
    assert.containsAllKeys(balances, ['collateral', 'debt']);
  };

  // empty accounts are always fetchable, even before the first user exists
  const EMPTY: EthAddress = '0x00000000000000000000000000000000000000aa';

  it('fetches market data on Ethereum', async () => {
    await fetchMarketData(NetworkNumber.Eth, provider);
  });

  it('fetches empty account data on Ethereum', async () => {
    await fetchAccountData(NetworkNumber.Eth, provider, EMPTY);
  });

});
