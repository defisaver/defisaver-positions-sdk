import { NetworkNumber } from '../../types/common';
import { SummerVault, SummerVaultType } from '../../types';

export const SUMMER_VAULT_USDC_MAINNET_LR: SummerVault = {
  type: SummerVaultType.SummerVaultUSDCMainnetLR,
  name: 'USDC',
  address: '0x98C49e13bf99D7CAd8069faa2A370933EC9EcF17',
  asset: 'USDC',
  network: NetworkNumber.Eth,
  deploymentBlock: 21795049,
  isLegacy: false,
};

export const SUMMER_VAULT_USDC_MAINNET_HR: SummerVault = {
  type: SummerVaultType.SummerVaultUSDCMainnetHR,
  name: 'Higher Risk USDC',
  address: '0xe9cda459bed6dcfb8ac61cd8ce08e2d52370cb06',
  asset: 'USDC',
  network: NetworkNumber.Eth,
  deploymentBlock: 22488041,
  isLegacy: false,
};

export const SUMMER_VAULT_USDT_MAINNET_LR: SummerVault = {
  type: SummerVaultType.SummerVaultUSDTMainnetLR,
  name: 'USDT',
  address: '0x17ee2d03e88b55e762c66c76ec99c3a28a54ad8d',
  asset: 'USDT',
  network: NetworkNumber.Eth,
  deploymentBlock: 21795276,
  isLegacy: false,
};

export const SUMMER_VAULT_ETH_MAINNET_LR: SummerVault = {
  type: SummerVaultType.SummerVaultETHMainnetLR,
  name: 'ETH',
  address: '0x67e536797570b3d8919df052484273815a0ab506',
  asset: 'WETH',
  network: NetworkNumber.Eth,
  deploymentBlock: 21795390,
  isLegacy: false,
};

export const SUMMER_VAULT_ETH_MAINNET_HR: SummerVault = {
  type: SummerVaultType.SummerVaultETHMainnetHR,
  name: 'Higher Risk ETH',
  address: '0x2e6abcbcced9af05bc3b8a4908e0c98c29a88e10',
  asset: 'WETH',
  network: NetworkNumber.Eth,
  deploymentBlock: 22291252,
  isLegacy: false,
};

export const SUMMER_VAULT_USDC_ARBITRUM_LR: SummerVault = {
  type: SummerVaultType.SummerVaultUSDCArbitrumLR,
  name: 'USDC',
  address: '0x71d77c39db0eb5d086611a2e950198e3077cf58a',
  asset: 'USDC',
  network: NetworkNumber.Arb,
  deploymentBlock: 404339289,
  isLegacy: false,
};

export const SUMMER_VAULT_USDT_ARBITRUM_LR: SummerVault = {
  type: SummerVaultType.SummerVaultUSDTArbitrumLR,
  name: 'USDT',
  address: '0x98c49e13bf99d7cad8069faa2a370933ec9ecf17',
  asset: 'USDT',
  network: NetworkNumber.Arb,
  deploymentBlock: 303594065,
  isLegacy: false,
};

export const SUMMER_VAULT_USDC_BASE_LR: SummerVault = {
  type: SummerVaultType.SummerVaultUSDCBaseLR,
  name: 'USDC',
  address: '0x98C49e13bf99D7CAd8069faa2A370933EC9EcF17',
  asset: 'USDC',
  network: NetworkNumber.Base,
  deploymentBlock: 303594065,
  isLegacy: false,
};

export const SUMMER_VAULT_EURC_BASE_LR: SummerVault = {
  type: SummerVaultType.SummerVaultEURCBaseLR,
  name: 'EURC',
  address: '0x64db8f51f1bf7064bb5a361a7265f602d348e0f0',
  asset: 'EURC',
  network: NetworkNumber.Base,
  deploymentBlock: 27544064,
  isLegacy: false,
};

export const SUMMER_VAULT_ETH_BASE_LR: SummerVault = {
  type: SummerVaultType.SummerVaultETHBaseLR,
  name: 'ETH',
  address: '0x2bb9ad69feba5547b7cd57aafe8457d40bf834af',
  asset: 'WETH',
  network: NetworkNumber.Base,
  deploymentBlock: 29066887,
  isLegacy: false,
};

export const SUMMER_VAULTS: Record<SummerVaultType, SummerVault> = {
  [SummerVaultType.SummerVaultUSDCMainnetLR]: SUMMER_VAULT_USDC_MAINNET_LR,
  [SummerVaultType.SummerVaultUSDCMainnetHR]: SUMMER_VAULT_USDC_MAINNET_HR,
  [SummerVaultType.SummerVaultUSDTMainnetLR]: SUMMER_VAULT_USDT_MAINNET_LR,
  [SummerVaultType.SummerVaultETHMainnetLR]: SUMMER_VAULT_ETH_MAINNET_LR,
  [SummerVaultType.SummerVaultETHMainnetHR]: SUMMER_VAULT_ETH_MAINNET_HR,
  [SummerVaultType.SummerVaultUSDCArbitrumLR]: SUMMER_VAULT_USDC_ARBITRUM_LR,
  [SummerVaultType.SummerVaultUSDTArbitrumLR]: SUMMER_VAULT_USDT_ARBITRUM_LR,
  [SummerVaultType.SummerVaultUSDCBaseLR]: SUMMER_VAULT_USDC_BASE_LR,
  [SummerVaultType.SummerVaultEURCBaseLR]: SUMMER_VAULT_EURC_BASE_LR,
  [SummerVaultType.SummerVaultETHBaseLR]: SUMMER_VAULT_ETH_BASE_LR,
};

export const getSummerVault = (type: SummerVaultType): SummerVault => SUMMER_VAULTS[type];
