import {
  MakerDsrType,
  MorphoVaultType,
  SavingsData,
  SavingsDataWithErrors,
  SavingsErrors,
  SavingsVaultKey,
  SkySavingsType,
  SparkSavingsVaultType,
  SummerVaultType,
  YearnV3VaultType,
  YearnVaultType,
} from '../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import * as morphoVaults from './morphoVaults';
import * as yearnVaults from './yearnVaults';
import * as makerDsr from './makerDsr';
import * as skyOptions from './skyOptions';
import * as sparkSavingsVaults from './sparkSavingsVaults';
import * as summerVaults from './summerVaults';
import * as yearnV3Vaults from './yearnV3Vaults';

export {
  morphoVaults,
  yearnVaults,
  makerDsr,
  skyOptions,
  sparkSavingsVaults,
  summerVaults,
  yearnV3Vaults,
};

/**
 * Every savings vault of a network for the given accounts, and, for each vault that came back without data, why — so
 * a vault that failed is never mistaken for one the accounts have nothing in.
 */
export const getSavingsDataWithErrors = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  accounts: EthAddress[],
): Promise<SavingsDataWithErrors> => {
  const isMainnet = network === NetworkNumber.Eth;
  const morphoVaultsList = Object.keys(morphoVaults.morphoVaultsOptions.MORPHO_VAULTS) as MorphoVaultType[];
  const yearnVaultsList = Object.keys(yearnVaults.yearnVaultsOptions.YEARN_VAULTS) as YearnVaultType[];
  const sparkSavingsVaultsList = Object.keys(sparkSavingsVaults.sparkSavingsVaultsOptions.SPARK_SAVINGS_VAULTS) as SparkSavingsVaultType[];
  const yearnV3VaultsList = Object.keys(yearnV3Vaults.yearnV3VaultsOptions.YEARN_V3_VAULTS) as YearnV3VaultType[];
  const summerVaultsList = (Object.keys(summerVaults.summerVaultsOptions.SUMMER_VAULTS) as SummerVaultType[])
    .filter((key) => summerVaults.summerVaultsOptions.getSummerVault(key).network === network);

  // Every vault read on this network, so one left without data or an error can still be reported.
  const vaultKeys: SavingsVaultKey[] = [
    ...(isMainnet ? [
      ...morphoVaultsList, ...yearnVaultsList, ...sparkSavingsVaultsList, ...yearnV3VaultsList,
      MakerDsrType.MakerDsrVault, SkySavingsType.SkySavings,
    ] : []),
    ...summerVaultsList,
  ];

  const savingsData: SavingsData = {};
  const errors: SavingsErrors = {};

  await Promise.all([
    ...(isMainnet ? [
      (async () => {
        try {
          const vaults = morphoVaultsList.map((vaultKey) => morphoVaults.morphoVaultsOptions.getMorphoVault(vaultKey));
          const data = await morphoVaults.getMorphoVaultsData(provider, network, vaults, accounts);
          Object.assign(savingsData, data);
        } catch (err) {
          console.error('[getSavingsData] Error fetching morpho vaults:', err);
          morphoVaultsList.forEach((vaultKey) => { errors[vaultKey] = `Error fetching morpho vault ${vaultKey}`; });
        }
      })(),
      ...yearnVaultsList.map(async (vaultKey) => {
        try {
          const vault = yearnVaults.yearnVaultsOptions.getYearnVault(vaultKey);
          const data = await yearnVaults.getYearnVaultData(provider, network, vault, accounts);
          savingsData[vaultKey] = data;
        } catch (err) {
          console.error(`[getSavingsData] Error fetching yearn vault ${vaultKey}:`, err);
          errors[vaultKey] = `Error fetching yearn vault ${vaultKey}`;
        }
      }),
      ...sparkSavingsVaultsList.map(async (vaultKey) => {
        try {
          const vault = sparkSavingsVaults.sparkSavingsVaultsOptions.getSparkSavingsVault(vaultKey);
          const data = await sparkSavingsVaults.getSparkSavingsVaultData(provider, network, vault, accounts);
          savingsData[vaultKey] = data;
        } catch (err) {
          console.error(`[getSavingsData] Error fetching spark savings vault ${vaultKey}:`, err);
          errors[vaultKey] = `Error fetching spark savings vault ${vaultKey}`;
        }
      }),
      ...yearnV3VaultsList.map(async (vaultKey) => {
        try {
          const vault = yearnV3Vaults.yearnV3VaultsOptions.getYearnV3Vault(vaultKey);
          const data = await yearnV3Vaults.getYearnV3VaultData(provider, network, vault, accounts);
          savingsData[vaultKey] = data;
        } catch (err) {
          console.error(`[getSavingsData] Error fetching yearn v3 vault ${vaultKey}:`, err);
          errors[vaultKey] = `Error fetching yearn v3 vault ${vaultKey}`;
        }
      }),
      (async () => {
        try {
          const data = await makerDsr.getMakerDsrData(provider, network, accounts);
          savingsData[MakerDsrType.MakerDsrVault] = data;
        } catch (err) {
          console.error('[getSavingsData] Error fetching maker DSR data:', err);
          errors[MakerDsrType.MakerDsrVault] = 'Error fetching maker DSR data';
        }
      })(),
      (async () => {
        try {
          const data = await skyOptions.getSkyOptionData(provider, network, accounts);
          savingsData[SkySavingsType.SkySavings] = data;
        } catch (err) {
          console.error('[getSavingsData] Error fetching Sky savings data:', err);
          errors[SkySavingsType.SkySavings] = 'Error fetching Sky savings data';
        }
      })(),
    ] : []),
    ...summerVaultsList.map(async (vaultKey) => {
      try {
        const vault = summerVaults.summerVaultsOptions.getSummerVault(vaultKey);
        const data = await summerVaults.getSummerVaultData(provider, network, vault, accounts);
        savingsData[vaultKey] = data;
      } catch (err) {
        console.error(`[getSavingsData] Error fetching summer vault ${vaultKey}:`, err);
        errors[vaultKey] = `Error fetching summer vault ${vaultKey}`;
      }
    }),
  ]);

  // getMorphoVaultsData leaves out, without throwing, a vault whose on-chain reads failed or that the Morpho API did not return.
  vaultKeys.forEach((vaultKey) => {
    if (!savingsData[vaultKey] && !errors[vaultKey]) errors[vaultKey] = `No data returned for savings vault ${vaultKey}`;
  });

  return { data: savingsData, errors };
};

/** Every savings vault of a network for the given accounts. A vault that failed is left out: use getSavingsDataWithErrors to tell why. */
export const getSavingsData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  accounts: EthAddress[],
): Promise<SavingsData> => (await getSavingsDataWithErrors(provider, network, accounts)).data;
