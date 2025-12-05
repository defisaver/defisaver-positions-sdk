import { SparkSavingsVault, SparkSavingsVaultType } from '../../types';

export const SPARK_SAVINGS_VAULT_USDC: SparkSavingsVault = {
  type: SparkSavingsVaultType.SparkSavingsUSDC,
  name: 'Spark Savings USDC',
  address: '0x28B3a8fb53B741A8Fd78c0fb9A6B2393d896a43d',
  asset: 'USDC',
  deploymentBlock: 23484422,
  isLegacy: false,
};

export const SPARK_SAVINGS_VAULT_USDT: SparkSavingsVault = {
  type: SparkSavingsVaultType.SparkSavingsUSDT,
  name: 'Spark Savings USDT',
  address: '0xe2e7a17dFf93280dec073C995595155283e3C372',
  asset: 'USDT',
  deploymentBlock: 23484439,
  isLegacy: false,
};

export const SPARK_SAVINGS_VAULT_WETH: SparkSavingsVault = {
  type: SparkSavingsVaultType.SparkSavingsETH,
  name: 'Spark Savings WETH',
  address: '0xfE6eb3b609a7C8352A241f7F3A21CEA4e9209B8f',
  asset: 'WETH',
  deploymentBlock: 23484474,
  isLegacy: false,
};

export const SPARK_SAVINGS_VAULTS: Record<SparkSavingsVaultType, SparkSavingsVault> = {
  [SparkSavingsVaultType.SparkSavingsUSDC]: SPARK_SAVINGS_VAULT_USDC,
  [SparkSavingsVaultType.SparkSavingsUSDT]: SPARK_SAVINGS_VAULT_USDT,
  [SparkSavingsVaultType.SparkSavingsETH]: SPARK_SAVINGS_VAULT_WETH,
};

export const getSparkSavingsVault = (type: SparkSavingsVaultType): SparkSavingsVault => SPARK_SAVINGS_VAULTS[type];