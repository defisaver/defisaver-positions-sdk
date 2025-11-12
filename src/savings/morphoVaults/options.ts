import { MorphoVault, MorphoVaultType } from '../../types';

export const MORPHO_VAULT_FLAGSHIP_ETH: MorphoVault = {
  type: MorphoVaultType.MorphoVaultFlagshipEth,
  name: 'Flagship ETH',
  address: '0x38989BBA00BDF8181F4082995b3DEAe96163aC5D',
  asset: 'ETH',
};

export const MORPHO_VAULT_GAUNTLET_USDC_CORE: MorphoVault = {
  type: MorphoVaultType.MorphoVaultGauntletUSDCCore,
  name: 'Gauntlet USDC Core',
  address: '0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458',
  asset: 'USDC',
};

export const MORPHO_VAULT_GAUNTLET_USDC_PRIME: MorphoVault = {
  type: MorphoVaultType.MorphoVaultGauntletUSDCPrime,
  name: 'Gauntlet USDC Prime',
  address: '0xdd0f28e19C1780eb6396170735D45153D261490d',
  asset: 'USDC',
};

export const MORPHO_VAULT_RE7_WETH: MorphoVault = {
  type: MorphoVaultType.MorphoVaultRe7Weth,
  name: 'RE7 WETH',
  address: '0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0',
  asset: 'ETH',
};

export const MORPHO_VAULT_GAUNTLET_WETH_CORE: MorphoVault = {
  type: MorphoVaultType.MorphoVaultGauntletWETHCore,
  name: 'Gauntlet WETH Core',
  address: '0x4881Ef0BF6d2365D3dd6499ccd7532bcdBCE0658',
  asset: 'ETH',
};

export const MORPHO_VAULT_GAUNTLET_WETH_PRIME: MorphoVault = {
  type: MorphoVaultType.MorphoVaultGauntletWETHPrime,
  name: 'Gauntlet WETH Prime',
  address: '0x2371e134e3455e0593363cBF89d3b6cf53740618',
  asset: 'ETH',
};

export const MORPHO_VAULT_BOOSTED_USDC: MorphoVault = {
  type: MorphoVaultType.MorphoVaultBoostedUSDC,
  name: 'Boosted USDC',
  address: '0xd63070114470f685b75B74D60EEc7c1113d33a3D',
  asset: 'USDC',
};

export const MORPHO_VAULT_STEAKHOUSE_PYUSD: MorphoVault = {
  type: MorphoVaultType.MorphoVaultSteakhousePYUSD,
  name: 'Steakhouse PYUSD',
  address: '0xbEEF02e5E13584ab96848af90261f0C8Ee04722a',
  asset: 'PYUSD',
};

export const MORPHO_VAULT_FLAGSHIP_USDT: MorphoVault = {
  type: MorphoVaultType.MorphoVaultFlagshipUSDT,
  name: 'Flagship USDT',
  address: '0x2C25f6C25770fFEC5959D34B94Bf898865e5D6b1',
  asset: 'USDT',
};

export const MORPHO_VAULT_STEAKHOUSE_USDT: MorphoVault = {
  type: MorphoVaultType.MorphoVaultSteakhouseUSDT,
  name: 'Steakhouse USDT',
  address: '0xbEef047a543E45807105E51A8BBEFCc5950fcfBa',
  asset: 'USDT',
};

export const MORPHO_VAULT_GAUNTLET_USDA_CORE: MorphoVault = {
  type: MorphoVaultType.MorphoVaultGauntletUSDACore,
  name: 'Gauntlet USDA Core',
  address: '0x125D41A6e5dbf455cD9Df8F80BCC6fd172D52Cc6',
  asset: 'USDA',
};

export const MORPHO_VAULT_GAUNTLET_USDT_PRIME: MorphoVault = {
  type: MorphoVaultType.MorphoVaultGauntletUSDTPrime,
  name: 'Gauntlet USDT Prime',
  address: '0x8CB3649114051cA5119141a34C200D65dc0Faa73',
  asset: 'USDT',
};

export const MORPHO_VAULT_GAUNTLET_RESOLV_USDC: MorphoVault = {
  type: MorphoVaultType.MorphoVaultGauntletResolvUSDC,
  name: 'Gauntlet Resolv USDC',
  address: '0x132E6C9C33A62D7727cd359b1f51e5B566E485Eb',
  asset: 'USDC',
};

export const MORPHO_VAULTS: Record<MorphoVaultType, MorphoVault> = {
  [MorphoVaultType.MorphoVaultFlagshipEth]: MORPHO_VAULT_FLAGSHIP_ETH,
  [MorphoVaultType.MorphoVaultGauntletUSDCCore]: MORPHO_VAULT_GAUNTLET_USDC_CORE,
  [MorphoVaultType.MorphoVaultGauntletUSDCPrime]: MORPHO_VAULT_GAUNTLET_USDC_PRIME,
  [MorphoVaultType.MorphoVaultRe7Weth]: MORPHO_VAULT_RE7_WETH,
  [MorphoVaultType.MorphoVaultGauntletWETHCore]: MORPHO_VAULT_GAUNTLET_WETH_CORE,
  [MorphoVaultType.MorphoVaultGauntletWETHPrime]: MORPHO_VAULT_GAUNTLET_WETH_PRIME,
  [MorphoVaultType.MorphoVaultBoostedUSDC]: MORPHO_VAULT_BOOSTED_USDC,
  [MorphoVaultType.MorphoVaultSteakhousePYUSD]: MORPHO_VAULT_STEAKHOUSE_PYUSD,
  [MorphoVaultType.MorphoVaultFlagshipUSDT]: MORPHO_VAULT_FLAGSHIP_USDT,
  [MorphoVaultType.MorphoVaultSteakhouseUSDT]: MORPHO_VAULT_STEAKHOUSE_USDT,
  [MorphoVaultType.MorphoVaultGauntletUSDACore]: MORPHO_VAULT_GAUNTLET_USDA_CORE,
  [MorphoVaultType.MorphoVaultGauntletUSDTPrime]: MORPHO_VAULT_GAUNTLET_USDT_PRIME,
  [MorphoVaultType.MorphoVaultGauntletResolvUSDC]: MORPHO_VAULT_GAUNTLET_RESOLV_USDC,
};

export const getMorphoVault = (type: MorphoVaultType): MorphoVault => MORPHO_VAULTS[type];