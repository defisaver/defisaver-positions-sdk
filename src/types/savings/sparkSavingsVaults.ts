import { EthAddress } from '../common';

export enum SparkSavingsVaultType {
  SparkSavingsUSDC = 'spark_savings_usdc',
  SparkSavingsUSDT = 'spark_savings_usdt',
  SparkSavingsETH = 'spark_savings_eth',
}

export interface SparkSavingsVault {
  type: SparkSavingsVaultType;
  name: string;
  address: EthAddress;
  asset: string;
  deploymentBlock: number;
  isLegacy: boolean;
}