import { getAssetInfo } from '@defisaver/tokens';
import { NetworkNumber } from '../../types/common';

export const compoundV2CollateralAssets = [
  'cETH', 'cDAI', 'cBAT', 'cZRX', 'cUSDC', 'cWBTC Legacy', 'cWBTC', 'cUSDT',
  'cTUSD', 'cLINK', 'cUSDP', 'cUNI', 'cCOMP', 'cMKR', 'cSUSHI', 'cAAVE', 'cYFI',
].map((symbol) => getAssetInfo(symbol));

export const v3USDCCollAssetsEth = ['COMP', 'WBTC', 'ETH', 'UNI', 'LINK', 'wstETH', 'cbBTC', 'tBTC'];
export const v3USDCCollAssetsArb = ['ARB', 'ETH', 'GMX', 'WBTC', 'wstETH', 'ezETH'];
export const v3USDCCollAssetsBase = ['ETH', 'cbETH', 'wstETH', 'cbBTC'];
export const v3USDCCollAssetsOpt = ['ETH', 'OP', 'WBTC', 'wstETH'];

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

export const v3ETHCollAssetsEth = ['cbETH', 'wstETH', 'rETH', 'rsETH', 'weETH', 'osETH', 'WBTC', 'ezETH', 'cbBTC', 'rswETH', 'tBTC', 'ETHx'];
export const v3ETHCollAssetsBase = ['cbETH', 'ezETH', 'wstETH', 'USDC', 'weETH', 'wrsETH', 'cbBTC'];
export const v3ETHCollAssetsArb = ['weETH', 'rETH', 'wstETH', 'WBTC', 'rsETH', 'ezETH', 'USDC', 'USDT'];
export const v3ETHCollAssetsOpt = ['rETH', 'wstETH', 'WBTC', 'ezETH', 'USDC', 'USDT', 'weETH', 'wrsETH'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const v3ETHCollAssets = {
  [NetworkNumber.Eth]: v3ETHCollAssetsEth,
  [NetworkNumber.Opt]: v3ETHCollAssetsOpt,
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

export const v3USDTCollAssetsEth = ['COMP', 'ETH', 'WBTC', 'UNI', 'LINK', 'wstETH', 'cbBTC', 'tBTC', 'wUSDM', 'sFRAX'];
export const v3USDTCollAssetsArb = ['ETH', 'WBTC', 'wstETH', 'ARB', 'GMX'];
export const v3USDTCollAssetsOpt = ['ETH', 'WBTC', 'OP', 'wstETH'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const v3USDTCollAssets = {
  [NetworkNumber.Eth]: v3USDTCollAssetsEth,
  [NetworkNumber.Opt]: v3USDTCollAssetsOpt,
  [NetworkNumber.Arb]: v3USDTCollAssetsArb,
  [NetworkNumber.Base]: [],
};