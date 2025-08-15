import 'dotenv/config';

import * as sdk from '../src';

import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Maker', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, blockNumber: Blockish) => {
    const balances = await sdk.maker.getMakerAccountBalances(_provider, network, blockNumber, false, '30126');
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };


  it('can fetch cdp data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const cdpInfos = await sdk.maker.getUserCdps(provider, network, '0xD848F54280F8fE8661b796E3Bb8D8922C87af452');
    for (const cdpInfo of cdpInfos) {
      const cdpData = await sdk.maker.getMakerCdpData(provider, network, cdpInfo);
      // console.log(cdpData);
      assert.containsAllKeys(cdpData, [
        'owner',
        'id',
        'urn',
        'type',
        'ilk',
        'ilkLabel',
        'asset',
        'collateral',
        'collateralUsd',
        'futureDebt',
        'debtDai',
        'debtUsd',
        'debtInAsset',
        'debtAssetPrice',
        'debtAssetMarketPrice',
        'liquidationPrice',
        'ratio',
        'liqRatio',
        'liqPercent',
        'assetPrice',
        'daiLabel',
        'debtAsset',
        'unclaimedCollateral',
        'debtTooLow',
        'minDebt',
        'stabilityFee',
        'creatableDebt',
        'globalDebtCeiling',
        'globalDebtCurrent',
        'liquidationFee',
        'lastUpdated',
      ]);
    }
  });

  it('can fetch latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 'latest');
  });

  it('can fetch past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 18000000);
  });
});