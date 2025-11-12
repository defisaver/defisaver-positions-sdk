import { MorphoVaultType } from './morphoVaults';
import { YearnVaultType } from './yearnVaults';

export * from './morphoVaults';
export * from './yearnVaults';

export interface SavingsVaultData {
  poolSize: string,
  supplied: string,
  liquidity: string,
}

export interface SavingsData {
  morphoVaults: {
    [key in MorphoVaultType]?: SavingsVaultData;
  };
  yearnVaults: {
    [key in YearnVaultType]?: SavingsVaultData;
  };
}