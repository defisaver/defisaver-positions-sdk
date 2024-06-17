import { NetworkNumber } from '../../types/common';

export const sparkAssetsDefaultMarketEth = ['DAI', 'sDAI', 'USDC', 'ETH', 'wstETH', 'WBTC', 'GNO', 'rETH', 'USDT', 'weETH'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const sparkAssetsDefaultMarket = {
  [NetworkNumber.Eth]: sparkAssetsDefaultMarketEth,
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Base]: [],
  [NetworkNumber.Arb]: [],
} as const;