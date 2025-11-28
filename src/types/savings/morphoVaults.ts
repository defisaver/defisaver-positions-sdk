import { EthAddress } from '../common';

export enum MorphoVaultType {
  MorphoVaultFlagshipEth = 'morpho_vault_flagship_eth',
  MorphoVaultGauntletUSDCCore = 'morpho_vault_gauntlet_usdc_core',
  MorphoVaultGauntletUSDCPrime = 'morpho_vault_gauntlet_usdc_prime',
  MorphoVaultRe7Weth = 'morpho_vault_re7_weth',
  MorphoVaultGauntletWETHCore = 'morpho_vault_gauntlet_weth_core',
  MorphoVaultGauntletWETHPrime = 'morpho_vault_gauntlet_weth_prime',
  MorphoVaultBoostedUSDC = 'morpho_vault_usual_boosted_usdc',
  MorphoVaultFlagshipUSDT = 'morpho_vault_flagship_usdt',
  MorphoVaultGauntletUSDACore = 'morpho_vault_gauntlet_usda_core',
  MorphoVaultGauntletUSDTPrime = 'morpho_vault_gauntlet_usdt_prime',
  MorphoVaultGauntletResolvUSDC = 'morpho_vault_gauntlet_resolv_usdc',
  // Steakhouse
  MorphoVaultSteakhouseUSDT = 'morpho_vault_steakhouse_usdt',
  MorphoVaultSteakhouseUSDC = 'morpho_vault_steakhouse_usdc',
  MorphoVaultSteakhouseETH = 'morpho_vault_steakhouse_eth',
  MorphoVaultSteakhousePYUSD = 'morpho_vault_steakhouse_pyusd',
  // Smokehouse
  MorphoVaultSmokehouseUSDT = 'morpho_vault_smokehouse_usdt',
  MorphoVaultSmokehouseUSDC = 'morpho_vault_smokehouse_usdc',
  MorphoVaultSmokehouseDAI = 'morpho_vault_smokehouse_dai',
  MorphoVaultSmokehouseWstEth = 'morpho_vault_smokehouse_wsteth',
}

export interface MorphoVault {
  type: MorphoVaultType;
  name: string;
  address: EthAddress;
  asset: string;
  deploymentBlock: number;
  isLegacy: boolean;
}