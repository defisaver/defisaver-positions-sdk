import { YearnVault, YearnVaultType } from '../../types/savings/yearnVaults';

export const YEARN_VAULT_DAI: YearnVault = {
  type: YearnVaultType.YearnVaultDAI,
  address: '0xdA816459F1AB5631232FE5e97a05BBBb94970c95',
  asset: 'DAI',
};

export const YEARN_VAULT_USDC: YearnVault = {
  type: YearnVaultType.YearnVaultUSDC,
  address: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
  asset: 'USDC',
};

export const YEARN_VAULT_USDT: YearnVault = {
  type: YearnVaultType.YearnVaultUSDT,
  address: '0x3B27F92C0e212C671EA351827EDF93DB27cc0c65',
  asset: 'USDT',
};

export const YEARN_VAULTS: Record<string, YearnVault> = {
  [YEARN_VAULT_DAI.type]: YEARN_VAULT_DAI,
  [YEARN_VAULT_USDC.type]: YEARN_VAULT_USDC,
  [YEARN_VAULT_USDT.type]: YEARN_VAULT_USDT,
};

export const getYearnVault = (type: YearnVaultType): YearnVault => YEARN_VAULTS[type];