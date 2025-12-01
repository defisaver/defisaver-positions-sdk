import { EthAddress } from '../common';
import { MakerDsrType } from './makerDsr';
import { MorphoVaultType } from './morphoVaults';
import { YearnVaultType } from './yearnVaults';
import { SkySavingsType } from './sky';

export * from './morphoVaults';
export * from './yearnVaults';
export * from './makerDsr';
export * from './sky';

export interface SavingsVaultData {
  poolSize: string,
  liquidity: string,
  supplied: Record<EthAddress, string>,
  asset: string,
  optionType: string,
}

export type SavingsData = Partial<Record<MorphoVaultType | YearnVaultType | MakerDsrType | SkySavingsType, SavingsVaultData>>;