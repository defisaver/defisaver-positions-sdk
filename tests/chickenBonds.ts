import 'dotenv/config';
import Web3 from 'web3';

import * as sdk from '../src';

import { Blockish, NetworkNumber } from '../src/types/common';
import { getWeb3Instance } from './utils/getWeb3Instance';

const { assert } = require('chai');

describe('ChickenBonds', () => {
  let web3: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
  });

  const fetchAccountBalances = async (network: NetworkNumber, _web3: Web3, blockNumber: Blockish) => {
    const balances = await sdk.chickenBonds.getChickenBondsAccountBalances(_web3, network, blockNumber, false, '639');
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'deposited',
    ]);
  };

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

  it('can fetch system info for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const systemInfo = await sdk.chickenBonds.fetchCBondsSystemInfo(web3, network);
    // console.log(systemInfo);
  });

  it('can fetch user bonds for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const bonds = await sdk.chickenBonds.fetchCBondsForUser(web3, network, '0x7898F99cC33db090aA68c17c148c5F6CAA56Cd9F');
    // console.log(bonds);
  });

  it('can fetch user bond for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const bond = await sdk.chickenBonds.fetchCBondForId(web3, network, '2552');
    // console.log(bond);
  });
});