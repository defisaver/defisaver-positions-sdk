import { EthAddress } from '../common';
import { MakerDsrType } from './makerDsr';
import { MorphoVaultType } from './morphoVaults';
import { SkySavingsType } from './sky';
import { SparkSavingsVaultType } from './sparkSavingsVaults';
import { SummerVaultType } from './summerVaults';
import { YearnV3VaultType } from './yearnV3Vaults';
import { YearnVaultType } from './yearnVaults';

export * from './morphoVaults';
export * from './yearnVaults';
export * from './makerDsr';
export * from './sky';
export * from './sparkSavingsVaults';
export * from './summerVaults';
export * from './yearnV3Vaults';

export interface SavingsVaultData {
  poolSize: string,
  liquidity: string,
  supplied: Record<EthAddress, string>,
  asset: string,
  optionType: string,
}

export type SavingsData = Partial<Record<MorphoVaultType | YearnVaultType | MakerDsrType | SkySavingsType | SparkSavingsVaultType | SummerVaultType | YearnV3VaultType, SavingsVaultData>>;