import { NetworkNumber } from '../../types/common';

export const sparkAssetsDefaultMarket = {
  [NetworkNumber.Eth]: [
    'ETH', 'USDC', 'DAI', 'GNO', 'rETH', 'sDAI', 'wstETH', 'WBTC',
  ],
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Arb]: [],
  [NetworkNumber.Base]: [],
} as const;