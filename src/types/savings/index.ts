import { EthAddress } from '../common';
import { MorphoVaultType } from './morphoVaults';
import { YearnVaultType } from './yearnVaults';

export * from './morphoVaults';
export * from './yearnVaults';

export interface SavingsVaultData {
  poolSize: string,
  liquidity: string,
  supplied: Record<EthAddress, string>,
}

export interface SavingsData {
  morphoVaults: {
    [key in MorphoVaultType]?: SavingsVaultData;
  };
  yearnVaults: {
    [key in YearnVaultType]?: SavingsVaultData;
  };
}