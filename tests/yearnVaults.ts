import 'dotenv/config';
import * as sdk from '../src';
import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Yearn Vaults', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchVaultData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const vaultData = await sdk.savings.yearnVaults.getYearnVaultData(_provider, network, sdk.savings.yearnVaults.yearnVaultsOptions.getYearnVault(sdk.YearnVaultType.YearnVaultDAI), ['0x3D6532c589A11117a4494d9725bb8518C731f1Be']);
    console.log(vaultData);
    return vaultData;
  };

  it('can fetch vault data for DAI Vault on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const vaultData = await fetchVaultData(network, provider);
  });
});