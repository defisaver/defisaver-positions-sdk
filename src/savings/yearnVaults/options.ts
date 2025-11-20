import { YearnVault, YearnVaultType } from '../../types/savings/yearnVaults';

export const YEARN_VAULT_DAI: YearnVault = {
  type: YearnVaultType.YearnVaultDAI,
  address: '0xdA816459F1AB5631232FE5e97a05BBBb94970c95',
  asset: 'DAI',
  deploymentBlock: 12796965,
};

export const YEARN_VAULT_USDC: YearnVault = {
  type: YearnVaultType.YearnVaultUSDC,
  address: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
  asset: 'USDC',
  deploymentBlock: 13513457,
};

export const YEARN_VAULT_USDT: YearnVault = {
  type: YearnVaultType.YearnVaultUSDT,
  address: '0x3B27F92C0e212C671EA351827EDF93DB27cc0c65',
  asset: 'USDT',
  deploymentBlock: 14980240,
};

export const YEARN_VAULTS: Record<YearnVaultType, YearnVault> = {
  [YearnVaultType.YearnVaultDAI]: YEARN_VAULT_DAI,
  [YearnVaultType.YearnVaultUSDC]: YEARN_VAULT_USDC,
  [YearnVaultType.YearnVaultUSDT]: YEARN_VAULT_USDT,
};

export const getYearnVault = (type: YearnVaultType): YearnVault => YEARN_VAULTS[type];