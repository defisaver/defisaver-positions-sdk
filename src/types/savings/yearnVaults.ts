import { EthAddress } from '../common';

export enum YearnVaultType {
  YearnVaultDAI = 'yearn_vault_dai',
  YearnVaultUSDC = 'yearn_vault_usdc',
  YearnVaultUSDT = 'yearn_vault_usdt',
}

export interface YearnVault {
  type: YearnVaultType;
  address: EthAddress;
  asset: string;
  deploymentBlock: number;
  isLegacy: boolean;
}