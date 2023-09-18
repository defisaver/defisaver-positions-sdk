
import { getAssetInfo } from '@defisaver/tokens';
import { NetworkNumber } from '../types/common';

export const compoundV2CollateralAssets = [
  'cETH', 'cDAI', 'cBAT', 'cZRX', 'cUSDC', 'cWBTC Legacy', 'cWBTC', 'cUSDT',
  'cTUSD', 'cLINK', 'cUSDP', 'cUNI', 'cCOMP', 'cMKR', 'cSUSHI', 'cAAVE', 'cYFI',
].map((symbol) => getAssetInfo(symbol));

export const v3USDCCollAssets = {
  [NetworkNumber.Eth]: [
    'ETH', 'COMP', 'WBTC', 'UNI', 'LINK',
  ],
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Arb]: [],
  [NetworkNumber.Base]: [],
} as const;

export const v3ETHCollAssets = {
  [NetworkNumber.Eth]: [
    'cbETH', 'wstETH',
  ],
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Arb]: [],
  [NetworkNumber.Base]: [],
} as const;