require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('ChickenBonds', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });

  const fetchAccountBalances = async (network, web3, blockNumber) => {
    const balances = await sdk.chickenBonds.getChickenBondsAccountBalances(web3, network, blockNumber, false, '639');
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

    const bond = await sdk.chickenBonds.fetchCBondForId(web3, network, 2552);
    // console.log(bond);
  });
});