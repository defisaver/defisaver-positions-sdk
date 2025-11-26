import 'dotenv/config';
import * as sdk from '../src';
import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Maker Dsr', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  it('can fetch vault data for Maker Dsr on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const vaultData = await sdk.savings.makerDsr.getMakerDsrData(provider, network, ['0x3D6532c589A11117a4494d9725bb8518C731f1Be']);
    console.log(vaultData);
  });
});