import 'dotenv/config';

import * as sdk from '../src';
import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Umbrella', () => {
  let provider: EthereumProvider;

  before(async () => {
    provider = getProvider('RPC');
  });
  const fetchUmbrellaData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const data = await sdk.portfolio.getPortfolioData(_provider, network, _provider, ['0x21dc459fba0b1ea037cd221d35b928be1c26141a', '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649', '0x9768F31bd299fA1cA98EDd7Aa15Fc84d94C33f7C', '0xE86F331FB370c5Bbff0f7C81B29D64fA58e0c9c9', '0x586e33B1800aAeeDD0c9B59bFd314Ba60304714D', '0xc169e1c8fcbd7E53E67e83CbBFbC702dfC5f3c2c'], []);

    console.dir(data, { depth: null, colors: true });
  };

  it('can fetch umbrella data for', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchUmbrellaData(network, provider);
  });
});