// TODO generate this file automatically

import { NetworkNumber } from '../../types/common';

export const aaveV2AssetsDefaultMarket = [
  'AAVE', 'BAL', 'BAT', 'BUSD', 'CRV', 'DAI', 'ENJ', 'ETH', 'GUSD', 'LINK', 'MANA', 'MKR',
  'REN', 'SNX', 'SUSD', 'TUSD', 'UNI', 'USDC', 'USDT', 'WBTC', 'YFI', 'xSUSHI', 'ZRX', 'RAI',
  'AMPL', 'DPI', 'USDP', 'RENFIL', 'FRAX', 'FEI', 'stETH', 'ENS', 'UST', 'CVX', '1INCH', 'LUSD',
] as const;

export const morphoAaveV2AssetDefaultMarket = [
  'ETH', 'stETH', 'USDC', 'WBTC', 'USDT', 'DAI', 'CRV',
];

export const morphoAaveV3AssetEthMarket = [
  'ETH', 'wstETH', 'DAI', 'USDC', 'WBTC', 'rETH', 'cbETH',
];

export const aaveV3AssetsDefaultMarket = {
  [NetworkNumber.Eth]: [
    'WBTC', 'ETH', 'wstETH', 'USDC', 'DAI', 'LINK', 'AAVE', 'cbETH', 'USDT', 'rETH', 'LUSD', 'UNI', 'MKR', 'SNX', 'BAL',
    'LDO', 'CRV', 'ENS', '1INCH', 'GHO', 'FRAX', 'RPL', 'sDAI',
  ],
  [NetworkNumber.Opt]: [
    'DAI', 'USDC.e', 'USDT', 'SUSD', 'AAVE', 'LINK', 'WBTC', 'ETH', 'OP', 'wstETH', 'LUSD', 'MAI', 'rETH',
  ],
  [NetworkNumber.Arb]: [
    'ETH', 'DAI', 'EURS', 'USDC', 'USDT', 'AAVE', 'LINK', 'WBTC', 'wstETH', 'MAI', 'rETH', 'LUSD', 'USDC.e', 'FRAX', 'ARB',
  ],
  [NetworkNumber.Base]: [
    'ETH', 'USDC', 'cbETH',
  ],
} as const;