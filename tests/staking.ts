import 'dotenv/config';
import Web3 from 'web3';
import nock from 'nock';
import { getWeb3Instance } from './utils/getWeb3Instance';

import * as sdk from '../src';

const { assert } = require('chai');

describe('Staking utils', () => {
  let web3: Web3;
  before(async () => {
    web3 = getWeb3Instance('RPC');
  });

  it('can fetch APY for staking assets', async function () {
    this.timeout(20000);
    for (const asset of sdk.staking.STAKING_ASSETS) {
      const apy = await sdk.staking.getStakingApy(asset, web3);
      assert.isString(apy, `APY for ${asset} is not a string: ${apy}`);
      assert.isNotNaN(+apy, `APY for ${asset} is not a valid number: ${apy}`);
    }
  });

  it('returns 0 for APY of asset without yield', async () => {
    for (const asset of sdk.staking.STAKING_ASSETS) {
      const apy = await sdk.staking.getStakingApy('DAI', web3);
      assert.equal(apy, '0');
    }
  });

  // Commented out due to https://github.com/nock/nock/issues/2830
  // it('returns 0 if API request fails', async () => {
  //   nock('https://fe.defisaver.com')
  //     .get('/api/staking/apy?asset=sUSDe')
  //     .reply(500, { error: 'Internal Server Error' });
  //   const apy = await sdk.staking.getStakingApy('sUSDe', web3);
  //   assert.equal(apy, '0');
  //   nock.cleanAll();
  // });
});
