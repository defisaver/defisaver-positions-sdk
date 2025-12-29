import { YearnV3Vault, YearnV3VaultType } from '../../types';

export const YEARN_V3_VAULT_USDC: YearnV3Vault = {
  type: YearnV3VaultType.YearnVaultV3USDC,
  name: 'Yearn V3 USDC',
  address: '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204',
  asset: 'USDC',
  deploymentBlock: 19419991,
  isLegacy: false,
};

export const YEARN_V3_VAULT_USDS: YearnV3Vault = {
  type: YearnV3VaultType.YearnVaultV3USDS,
  name: 'Yearn V3 USDS',
  address: '0x182863131F9a4630fF9E27830d945B1413e347E8',
  asset: 'USDS',
  deploymentBlock: 20917639,
  isLegacy: false,
};

export const YEARN_V3_VAULT_DAI: YearnV3Vault = {
  type: YearnV3VaultType.YearnVaultV3DAI,
  name: 'Yearn V3 DAI',
  address: '0x028eC7330ff87667b6dfb0D94b954c820195336c',
  asset: 'DAI',
  deploymentBlock: 19419991,
  isLegacy: false,
};

export const YEARN_V3_VAULT_USDT: YearnV3Vault = {
  type: YearnV3VaultType.YearnVaultV3USDT,
  name: 'Yearn V3 USDT',
  address: '0x310B7Ea7475A0B449Cfd73bE81522F1B88eFAFaa',
  asset: 'USDT',
  deploymentBlock: 20369520,
  isLegacy: false,
};

export const YEARN_V3_VAULT_WETH_1: YearnV3Vault = {
  type: YearnV3VaultType.YearnVaultV3WETH_1,
  name: 'Yearn V3 WETH',
  address: '0xc56413869c6CDf96496f2b1eF801fEDBdFA7dDB0',
  asset: 'WETH',
  deploymentBlock: 19419991,
  isLegacy: false,
};

export const YEARN_V3_VAULTS: Record<YearnV3VaultType, YearnV3Vault> = {
  [YearnV3VaultType.YearnVaultV3USDC]: YEARN_V3_VAULT_USDC,
  [YearnV3VaultType.YearnVaultV3USDS]: YEARN_V3_VAULT_USDS,
  [YearnV3VaultType.YearnVaultV3DAI]: YEARN_V3_VAULT_DAI,
  [YearnV3VaultType.YearnVaultV3USDT]: YEARN_V3_VAULT_USDT,
  [YearnV3VaultType.YearnVaultV3WETH_1]: YEARN_V3_VAULT_WETH_1,
};

export const getYearnV3Vault = (type: YearnV3VaultType): YearnV3Vault => YEARN_V3_VAULTS[type];