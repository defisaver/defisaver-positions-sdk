import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { Blockish, NetworkNumber } from '../src/types/common';
import { getWeb3Instance } from './utils/getWeb3Instance';

const { assert } = require('chai');

describe('Maker', () => {
  let web3: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
  });

  const fetchAccountBalances = async (network: NetworkNumber, _web3: Web3, blockNumber: Blockish) => {
    const balances = await sdk.maker.getMakerAccountBalances(_web3, network, blockNumber, false, '30126');
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };


  it('can fetch cdp data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const cdpInfo = await sdk.maker.getMakerCdpData(web3, network, '30126');
    // console.log(cdpInfo);
    assert.containsAllKeys(cdpInfo, [
      'owner',
      'userAddress',
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
  });

  it('can fetch latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 'latest');
  });

  it('can fetch past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 18000000);
  });
});