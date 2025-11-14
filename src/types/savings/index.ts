import { EthAddress } from '../common';
import { MakerDsrType } from './makerDsr';
import { MorphoVaultType } from './morphoVaults';
import { YearnVaultType } from './yearnVaults';

export * from './morphoVaults';
export * from './yearnVaults';
export * from './makerDsr';

export interface SavingsVaultData {
  poolSize: string,
  liquidity: string,
  supplied: Record<EthAddress, string>,
  asset: string,
  optionType: string,
}

export type SavingsData = Partial<Record<MorphoVaultType | YearnVaultType | MakerDsrType, SavingsVaultData>>;