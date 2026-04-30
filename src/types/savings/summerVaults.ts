import { EthAddress, NetworkNumber } from '../common';

export enum SummerVaultType {
  SummerVaultUSDCMainnetLR = 'summer_vault_usdc_mainnet_lr',
  SummerVaultUSDCMainnetHR = 'summer_vault_usdc_mainnet_hr',
  SummerVaultUSDTMainnetLR = 'summer_vault_usdt_mainnet_lr',
  SummerVaultETHMainnetLR = 'summer_vault_eth_mainnet_lr',
  SummerVaultETHMainnetHR = 'summer_vault_eth_mainnet_hr',
  SummerVaultUSDCArbitrumLR = 'summer_vault_usdc_arbitrum_lr',
  SummerVaultUSDTArbitrumLR = 'summer_vault_usdt_arbitrum_lr',
  SummerVaultUSDCBaseLR = 'summer_vault_usdc_base_lr',
  SummerVaultEURCBaseLR = 'summer_vault_eurc_base_lr',
  SummerVaultETHBaseLR = 'summer_vault_eth_base_lr',
}

export interface SummerVault {
  type: SummerVaultType;
  name: string;
  address: EthAddress;
  asset: string;
  network: NetworkNumber;
  deploymentBlock: number;
  isLegacy: boolean;
}
