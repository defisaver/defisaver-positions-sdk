import { getAssetInfo } from '@defisaver/tokens';
import { NetworkNumber } from '../../types/common';

export const compoundV2CollateralAssets = [
  'cETH', 'cDAI', 'cBAT', 'cZRX', 'cUSDC', 'cWBTC Legacy', 'cWBTC', 'cUSDT',
  'cTUSD', 'cLINK', 'cUSDP', 'cUNI', 'cCOMP', 'cMKR', 'cSUSHI', 'cAAVE', 'cYFI',
].map((symbol) => getAssetInfo(symbol));

export const v3USDCCollAssetsEth = ['ETH', 'COMP', 'WBTC', 'UNI', 'LINK'];
export const v3USDCCollAssetsArb = ['ARB', 'ETH', 'GMX', 'WBTC', 'wstETH'];
export const v3USDCCollAssetsBase = ['ETH', 'cbETH'];
export const v3USDCCollAssetsOpt = ['ETH', 'OP', 'WBTC'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const v3USDCCollAssets = {
  [NetworkNumber.Eth]: v3USDCCollAssetsEth,
  [NetworkNumber.Opt]: v3USDCCollAssetsOpt,
  [NetworkNumber.Arb]: v3USDCCollAssetsArb,
  [NetworkNumber.Base]: v3USDCCollAssetsBase,
} as const;

export const v3USDCeCollAssetsArb = ['ARB', 'ETH', 'GMX', 'WBTC'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const v3USDCeCollAssets = {
  [NetworkNumber.Eth]: [],
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Arb]: v3USDCeCollAssetsArb,
  [NetworkNumber.Base]: [],
} as const;

export const v3ETHCollAssetsEth = ['cbETH', 'wstETH', 'rETH', 'rsETH', 'weETH', 'osETH', 'WBTC', 'ezETH'];
export const v3ETHCollAssetsBase = ['cbETH'];
export const v3ETHCollAssetsArb = ['weETH', 'rETH', 'wstETH'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const v3ETHCollAssets = {
  [NetworkNumber.Eth]: v3ETHCollAssetsEth,
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Arb]: v3ETHCollAssetsArb,
  [NetworkNumber.Base]: v3ETHCollAssetsBase,
} as const;

export const v3USDbCCollAssetsBase = ['ETH', 'cbETH'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const v3USDbCCollAssets = {
  [NetworkNumber.Eth]: [],
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Arb]: [],
  [NetworkNumber.Base]: v3USDbCCollAssetsBase,
};

export const v3USDTCollAssetsEth = ['ETH', 'WBTC', 'wstETH', 'COMP', 'UNI', 'LINK'];
export const v3USDTCollAssetsArb = ['ETH', 'WBTC', 'wstETH', 'ARB', 'GMX'];
export const v3USDTCollAssetsOpt = ['ETH', 'WBTC', 'OP'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const v3USDTCollAssets = {
  [NetworkNumber.Eth]: v3USDTCollAssetsEth,
  [NetworkNumber.Opt]: v3USDTCollAssetsOpt,
  [NetworkNumber.Arb]: v3USDTCollAssetsArb,
  [NetworkNumber.Base]: [],
};