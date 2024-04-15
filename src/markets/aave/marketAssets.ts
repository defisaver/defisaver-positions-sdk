import { NetworkNumber } from '../../types/common';

export const aaveV2AssetsDefaultMarket = ['USDT', 'WBTC', 'ETH', 'YFI', 'ZRX', 'UNI', 'AAVE', 'BAT', 'BUSD', 'DAI', 'ENJ', 'KNCL', 'LINK', 'MANA', 'MKR', 'REN', 'SNX', 'SUSD', 'TUSD', 'USDC', 'CRV', 'GUSD', 'BAL', 'xSUSHI', 'RENFIL', 'RAI', 'AMPL', 'USDP', 'DPI', 'FRAX', 'FEI', 'stETH', 'ENS', 'UST', 'CVX', '1INCH', 'LUSD'];
export const morphoAaveV2AssetDefaultMarket = ['DAI', 'ETH', 'USDC', 'USDT', 'WBTC', 'stETH', 'CRV'];

export const morphoAaveV3AssetEthMarket = [
  'ETH', 'wstETH', 'DAI', 'USDC', 'WBTC', 'rETH', 'cbETH', 'sDAI', 'USDT',
];

export const aaveV3AssetsDefaultMarketEth = ['ETH', 'wstETH', 'WBTC', 'USDC', 'DAI', 'LINK', 'AAVE', 'cbETH', 'USDT', 'rETH', 'LUSD', 'CRV', 'MKR', 'SNX', 'BAL', 'UNI', 'LDO', 'ENS', '1INCH', 'FRAX', 'GHO', 'RPL', 'sDAI', 'STG', 'KNC', 'FXS', 'crvUSD', 'PYUSD', 'weETH'];
export const aaveV3AssetsDefaultMarketOpt = [
  'DAI', 'USDC.e', 'USDT', 'SUSD', 'AAVE', 'LINK', 'WBTC', 'ETH', 'OP', 'wstETH', 'LUSD', 'MAI', 'rETH', 'USDC',
];
export const aaveV3AssetsDefaultMarketArb = [
  'ETH', 'DAI', 'EURS', 'USDC', 'USDT', 'AAVE', 'LINK', 'WBTC', 'wstETH', 'MAI', 'rETH', 'LUSD', 'USDC.e', 'FRAX', 'ARB',
];
export const aaveV3AssetsDefaultMarketBase = ['ETH', 'cbETH', 'USDbC', 'wstETH', 'USDC'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const aaveV3AssetsDefaultMarket = {
  [NetworkNumber.Eth]: aaveV3AssetsDefaultMarketEth,
  [NetworkNumber.Opt]: aaveV3AssetsDefaultMarketOpt,
  [NetworkNumber.Arb]: aaveV3AssetsDefaultMarketArb,
  [NetworkNumber.Base]: aaveV3AssetsDefaultMarketBase,
} as const;