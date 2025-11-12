import { MorphoVaultType, SavingsData, YearnVaultType } from '../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import * as morphoVaults from './morphoVaults';
import * as yearnVaults from './yearnVaults';

export {
  morphoVaults,
  yearnVaults,
};

export const getSavingsData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  accounts: EthAddress[],
) => {
  const morphoVaultsList = Object.keys(morphoVaults.morphoVaultsOptions.MORPHO_VAULTS) as MorphoVaultType[];
  const yearnVaultsList = Object.keys(yearnVaults.yearnVaultsOptions.YEARN_VAULTS) as YearnVaultType[];

  const savingsData: SavingsData = {
    morphoVaults: {},
    yearnVaults: {},
  };

  await Promise.all([
    ...morphoVaultsList.map(async (vaultKey) => {
      const vault = morphoVaults.morphoVaultsOptions.getMorphoVault(vaultKey);
      const data = await morphoVaults.getMorphoVaultData(provider, network, vault, accounts);
      savingsData.morphoVaults[vaultKey] = data;
    }),
    ...yearnVaultsList.map(async (vaultKey) => {
      const vault = yearnVaults.yearnVaultsOptions.getYearnVault(vaultKey);
      const data = await yearnVaults.getYearnVaultData(provider, network, vault, accounts);
      savingsData.yearnVaults[vaultKey] = data;
    }),
  ]);

  return savingsData;
};
