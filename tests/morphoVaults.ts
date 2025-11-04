import 'dotenv/config';
import * as sdk from '../src';
import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Morpho Vaults', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchVaultData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const vaultData = await sdk.savings.morphoVaults.getMorphoVaultData(_provider, network, sdk.savings.morphoVaults.morphoVaultsOptions.getMorphoVault(sdk.MorphoVaultType.MorphoVaultGauntletResolvUSDC), '0x6162aA1E81c665143Df3d1f98bfED38Dd11A42eF');
    console.log(vaultData);
    return vaultData;
  };

  it('can fetch vault data for Gauntlet Resolv USDC on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const vaultData = await fetchVaultData(network, provider);
  });
});