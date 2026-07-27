import 'dotenv/config';

import { createPublicClient, custom } from 'viem';
import * as sdk from '../src';
import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';
import { getViemChain, getViemProvider } from '../src/services/viem';

const { assert } = require('chai');

describe('Claiming', () => {
  let provider: EthereumProvider;

  before(async () => {
    provider = getProvider('RPC');
  });

  it('can fetch uniswap rewards data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const data = await sdk.claiming.uniswapClaim.getUniswapRewards(createPublicClient({
      transport: custom(provider),
      chain: getViemChain(network),
      batch: { multicall: { batchSize: 2_500_000 } },
    }), network, ['0x322d58b9E75a6918f7e7849AEe0fF09369977e08', '0xe20AA1584Df34B8be8D544A9Ae15eB49807d5D93']);
    // console.log(data);
  });
});
