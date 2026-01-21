import { EthAddress } from '../common';

export enum YearnV3VaultType {
  YearnVaultV3USDC = 'yearn_v3_vault_usdc',
  YearnVaultV3USDS = 'yearn_v3_vault_usds',
  YearnVaultV3USDT = 'yearn_v3_vault_usdt',
  YearnVaultV3DAI = 'yearn_v3_vault_dai',
  YearnVaultV3WETH_1 = 'yearn_v3_vault_weth_1',
}

export interface YearnV3Vault {
  type: YearnV3VaultType;
  address: EthAddress;
  asset: string;
  name: string;
  deploymentBlock: number;
  isLegacy: boolean;
}