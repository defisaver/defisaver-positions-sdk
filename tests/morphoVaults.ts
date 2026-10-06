import 'dotenv/config';
import * as sdk from '../src';
import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Morpho Vaults', () => {
  let provider: EthereumProvider;
  let providerArb: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
    providerArb = getProvider('RPCARB');
  });

  const fetchVaultData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const vaultData = await sdk.savings.morphoVaults.getMorphoVaultData(_provider, network, sdk.savings.morphoVaults.morphoVaultsOptions.getMorphoVault(sdk.MorphoVaultType.MorphoVaultGauntletResolvUSDC), ['0x6162aA1E81c665143Df3d1f98bfED38Dd11A42eF']);
    console.log(vaultData);
    return vaultData;
  };

  it('can fetch vault data for Gauntlet Resolv USDC on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const vaultData = await fetchVaultData(network, provider);
  });

  it('can fetch vault V2 data for Gauntlet USDG Premium on Arbitrum', async function () {
    this.timeout(10000);
    const vaultData = await sdk.savings.morphoVaults.getMorphoVaultData(
      providerArb,
      NetworkNumber.Arb,
      sdk.savings.morphoVaults.morphoVaultsOptions.getMorphoVault(sdk.MorphoVaultType.MorphoVaultGauntletUSDGPremium),
      ['0x6162aA1E81c665143Df3d1f98bfED38Dd11A42eF'],
    );
    console.log(vaultData);
    assert.isAbove(Number(vaultData.poolSize), 0);
    // liquidity is legitimately 0 when the vault is fully allocated
    assert.isAtLeast(Number(vaultData.liquidity), 0);
  });

  it('can fetch vault V2 data for Steakhouse USDG Pro on Arbitrum', async function () {
    this.timeout(10000);
    const vaultData = await sdk.savings.morphoVaults.getMorphoVaultData(
      providerArb,
      NetworkNumber.Arb,
      sdk.savings.morphoVaults.morphoVaultsOptions.getMorphoVault(sdk.MorphoVaultType.MorphoVaultSteakhouseUSDGPro),
      ['0x6162aA1E81c665143Df3d1f98bfED38Dd11A42eF'],
    );
    console.log(vaultData);
    assert.isAbove(Number(vaultData.poolSize), 0);
    assert.isAtLeast(Number(vaultData.liquidity), 0);
  });
});
