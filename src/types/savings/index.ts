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

/** The key of every savings vault getSavingsData reads. */
export type SavingsVaultKey = MorphoVaultType | YearnVaultType | MakerDsrType | SkySavingsType | SparkSavingsVaultType | SummerVaultType | YearnV3VaultType;

export type SavingsData = Partial<Record<SavingsVaultKey, SavingsVaultData>>;

/** Why each vault that was read for a network came back without data. */
export type SavingsErrors = Partial<Record<SavingsVaultKey, string>>;

export interface SavingsDataWithErrors {
  data: SavingsData,
  errors: SavingsErrors,
}