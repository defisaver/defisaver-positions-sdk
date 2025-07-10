import 'dotenv/config';

import * as sdk from '../src';
import { getProvider } from './utils/getProvider';
import { EthereumProvider } from '../src/types/common';

const { assert } = require('chai');

describe('Staking utils', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  it('can fetch APY for staking assets', async function () {
    this.timeout(20000);
    for (const asset of sdk.staking.STAKING_ASSETS) {
      const apy = await sdk.staking.getStakingApy(asset);
      assert.isString(apy, `APY for ${asset} is not a string: ${apy}`);
      assert.isNotNaN(+apy, `APY for ${asset} is not a valid number: ${apy}`);
    }
  });

  it('returns 0 for APY of asset without yield', async () => {
    for (const asset of sdk.staking.STAKING_ASSETS) {
      const apy = await sdk.staking.getStakingApy('DAI');
      assert.equal(apy, '0');
    }
  });
});
