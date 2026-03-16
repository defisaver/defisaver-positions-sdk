import 'dotenv/config';
import * as sdk from '../src';
import { EthAddress, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Summer Vaults', () => {
  let provider: EthereumProvider;
  let providerArb: EthereumProvider;
  let providerBase: EthereumProvider;

  before(async () => {
    provider = getProvider('RPC');
    providerArb = getProvider('RPCARB');
    providerBase = getProvider('RPCBASE');
  });

  const fetchVaultData = async (
    network: NetworkNumber,
    _provider: EthereumProvider,
    vaultType: sdk.SummerVaultType,
    accounts: EthAddress[] = [],
  ) => {
    const vault = sdk.savings.summerVaults.summerVaultsOptions.getSummerVault(vaultType);
    const data = await sdk.savings.summerVaults.getSummerVaultData(_provider, network, vault, accounts);
    console.log(`[${vaultType}]`, data);
    return data;
  };

  it('can fetch USDC Mainnet (LR) vault data', async function () {
    this.timeout(10000);
    const data = await fetchVaultData(NetworkNumber.Eth, provider, sdk.SummerVaultType.SummerVaultUSDCMainnetLR);
    assert.isString(data.poolSize);
    assert.isString(data.liquidity);
    assert.isString(data.asset);
    assert.equal(data.asset, 'USDC');
    assert.equal(data.optionType, sdk.SummerVaultType.SummerVaultUSDCMainnetLR);
  });

  it('can fetch ETH Mainnet (LR) vault data', async function () {
    this.timeout(10000);
    const data = await fetchVaultData(NetworkNumber.Eth, provider, sdk.SummerVaultType.SummerVaultETHMainnetLR);
    assert.isString(data.poolSize);
    assert.equal(data.asset, 'WETH');
  });

  it('can fetch USDC Arbitrum (LR) vault data', async function () {
    this.timeout(10000);
    const data = await fetchVaultData(NetworkNumber.Arb, providerArb, sdk.SummerVaultType.SummerVaultUSDCArbitrumLR);
    assert.isString(data.poolSize);
    assert.equal(data.asset, 'USDC');
    assert.equal(data.optionType, sdk.SummerVaultType.SummerVaultUSDCArbitrumLR);
  });

  it('can fetch USDC Base (LR) vault data', async function () {
    this.timeout(10000);
    const data = await fetchVaultData(NetworkNumber.Base, providerBase, sdk.SummerVaultType.SummerVaultUSDCBaseLR);
    assert.isString(data.poolSize);
    assert.equal(data.asset, 'USDC');
    assert.equal(data.optionType, sdk.SummerVaultType.SummerVaultUSDCBaseLR);
  });

  it('can fetch ETH Base (LR) vault data', async function () {
    this.timeout(10000);
    const data = await fetchVaultData(NetworkNumber.Base, providerBase, sdk.SummerVaultType.SummerVaultETHBaseLR);
    assert.isString(data.poolSize);
    assert.equal(data.asset, 'WETH');
  });

  it('getSavingsData returns only summer vaults on Arbitrum', async function () {
    this.timeout(15000);
    const data = await sdk.savings.getSavingsData(providerArb, NetworkNumber.Arb, []);
    const keys = Object.keys(data);
    assert.isTrue(keys.every((k) => k.startsWith('summer_vault_')), `Unexpected non-summer key on Arb: ${keys.find((k) => !k.startsWith('summer_vault_'))}`);
    assert.includeMembers(keys, [
      sdk.SummerVaultType.SummerVaultUSDCArbitrumLR,
      sdk.SummerVaultType.SummerVaultUSDTArbitrumLR,
    ]);
  });

  it('getSavingsData returns only summer vaults on Base', async function () {
    this.timeout(15000);
    const data = await sdk.savings.getSavingsData(providerBase, NetworkNumber.Base, []);
    const keys = Object.keys(data);
    assert.isTrue(keys.every((k) => k.startsWith('summer_vault_')), `Unexpected non-summer key on Base: ${keys.find((k) => !k.startsWith('summer_vault_'))}`);
    assert.includeMembers(keys, [
      sdk.SummerVaultType.SummerVaultUSDCBaseLR,
      sdk.SummerVaultType.SummerVaultEURCBaseLR,
      sdk.SummerVaultType.SummerVaultETHBaseLR,
    ]);
  });
});
