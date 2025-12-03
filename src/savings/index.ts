import {
  MakerDsrType,
  MorphoVaultType,
  SavingsData,
  SkySavingsType,
  SparkSavingsVaultType,
  YearnVaultType,
} from '../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import * as morphoVaults from './morphoVaults';
import * as yearnVaults from './yearnVaults';
import * as makerDsr from './makerDsr';
import * as skyOptions from './skyOptions';
import * as sparkSavingsVaults from './sparkSavingsVaults';

export {
  morphoVaults,
  yearnVaults,
  makerDsr,
  skyOptions,
  sparkSavingsVaults,
};

export const getSavingsData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  accounts: EthAddress[],
) => {
  const morphoVaultsList = Object.keys(morphoVaults.morphoVaultsOptions.MORPHO_VAULTS) as MorphoVaultType[];
  const yearnVaultsList = Object.keys(yearnVaults.yearnVaultsOptions.YEARN_VAULTS) as YearnVaultType[];
  const sparkSavingsVaultsList = Object.keys(sparkSavingsVaults.sparkSavingsVaultsOptions.SPARK_SAVINGS_VAULTS) as SparkSavingsVaultType[];

  const savingsData: SavingsData = {};

  await Promise.all([
    ...morphoVaultsList.map(async (vaultKey) => {
      try {
        const vault = morphoVaults.morphoVaultsOptions.getMorphoVault(vaultKey);
        const data = await morphoVaults.getMorphoVaultData(provider, network, vault, accounts);
        savingsData[vaultKey] = data;
      } catch (err) {
        console.error(`[getSavingsData] Error fetching morpho vault ${vaultKey}:`, err);
      }
    }),
    ...yearnVaultsList.map(async (vaultKey) => {
      try {
        const vault = yearnVaults.yearnVaultsOptions.getYearnVault(vaultKey);
        const data = await yearnVaults.getYearnVaultData(provider, network, vault, accounts);
        savingsData[vaultKey] = data;
      } catch (err) {
        console.error(`[getSavingsData] Error fetching yearn vault ${vaultKey}:`, err);
      }
    }),
    ...sparkSavingsVaultsList.map(async (vaultKey) => {
      try {
        const vault = sparkSavingsVaults.sparkSavingsVaultsOptions.getSparkSavingsVault(vaultKey);
        const data = await sparkSavingsVaults.getSparkSavingsVaultData(provider, network, vault, accounts);
        savingsData[vaultKey] = data;
      } catch (err) {
        console.error(`[getSavingsData] Error fetching yearn vault ${vaultKey}:`, err);
      }
    }),
    (async () => {
      try {
        const data = await makerDsr.getMakerDsrData(provider, network, accounts);
        savingsData[MakerDsrType.MakerDsrVault] = data;
      } catch (err) {
        console.error('[getSavingsData] Error fetching maker DSR data:', err);
      }
    })(),
    (async () => {
      try {
        const data = await skyOptions.getSkyOptionData(provider, network, accounts);
        savingsData[SkySavingsType.SkySavings] = data;
      } catch (err) {
        console.error('[getSavingsData] Error fetching Sky savings data:', err);
      }
    })(),
  ]);

  return savingsData;
};
