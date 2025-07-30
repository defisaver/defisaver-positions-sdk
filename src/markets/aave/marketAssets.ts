import { AssetData, getAssetInfo } from '@defisaver/tokens';
import { NetworkNumber } from '../../types/common';

export const aaveV1AssetsDefaultMarket: AssetData[] = [
  'aETH', 'aDAI', 'aUSDC', 'aSUSD', 'aTUSD', 'aUSDT', 'aBUSD', 'aBAT', 'aLEND',
  'aLINK', 'aMANA', 'aMKR', 'aREP', 'aSNX', 'aWBTC', 'aZRX', 'aENJ', 'aREN', 'aYFI', 'aUNI', 'aAAVE',
].map((symbol) => getAssetInfo(symbol));

export const aaveV2AssetsDefaultMarket = ['USDT', 'WBTC', 'ETH', 'YFI', 'ZRX', 'UNI', 'AAVE', 'BAT', 'BUSD', 'DAI', 'ENJ', 'KNCL', 'LINK', 'MANA', 'MKR', 'REN', 'SNX', 'SUSD', 'TUSD', 'USDC', 'CRV', 'GUSD', 'BAL', 'xSUSHI', 'RENFIL', 'RAI', 'AMPL', 'USDP', 'DPI', 'FRAX', 'FEI', 'stETH', 'ENS', 'UST', 'CVX', '1INCH', 'LUSD'];
export const morphoAaveV2AssetDefaultMarket = ['DAI', 'ETH', 'USDC', 'USDT', 'WBTC', 'stETH', 'CRV'];

export const morphoAaveV3AssetEthMarket = ['ETH', 'wstETH', 'DAI', 'USDC', 'WBTC', 'rETH', 'cbETH', 'sDAI', 'USDT'];

export const aaveV3AssetsDefaultMarketEth = [
  'ETH', 'wstETH', 'WBTC', 'USDC', 'DAI', 'LINK', 'AAVE', 'cbETH', 'USDT', 'rETH', 'LUSD', 'CRV', 'MKR', 'SNX', 'BAL', 'UNI', 'LDO', 'ENS', '1INCH', 'FRAX', 'GHO', 'RPL', 'sDAI', 'STG', 'KNC', 'FXS', 'crvUSD', 'PYUSD', 'weETH', 'osETH', 'USDe', 'ETHx', 'sUSDe', 'tBTC', 'cbBTC', 'USDS', 'rsETH', 'LBTC', 'eBTC', 'RLUSD', 'PT eUSDe May', 'PT sUSDe July', 'USDtb',
  'eUSDe', 'PT USDe July', 'PT eUSDe Aug', 'EURC', 'FBTC', 'PT sUSDe Sep', 'PT USDe Sep',
];
export const aaveV3AssetsDefaultMarketOpt = [
  'DAI', 'USDC.e', 'USDT', 'SUSD', 'AAVE', 'LINK', 'WBTC', 'ETH', 'OP', 'wstETH', 'LUSD', 'MAI', 'rETH', 'USDC',
];
export const aaveV3AssetsDefaultMarketArb = ['DAI', 'LINK', 'USDC.e', 'WBTC', 'ETH', 'USDT', 'AAVE', 'EURS', 'wstETH', 'MAI', 'rETH', 'LUSD', 'USDC', 'FRAX', 'ARB', 'weETH', 'GHO', 'ezETH', 'rsETH'];
export const aaveV3AssetsDefaultMarketBase = ['ETH', 'cbETH', 'USDbC', 'wstETH', 'USDC', 'weETH', 'cbBTC', 'ezETH', 'GHO', 'wrsETH', 'LBTC', 'EURC', 'AAVE'];

// @dev Keep assets in array, do not assign directly, so we can parse it and edit it programmatically with `scripts/updateMarkets`
export const aaveV3AssetsDefaultMarket = {
  [NetworkNumber.Eth]: aaveV3AssetsDefaultMarketEth,
  [NetworkNumber.Opt]: aaveV3AssetsDefaultMarketOpt,
  [NetworkNumber.Arb]: aaveV3AssetsDefaultMarketArb,
  [NetworkNumber.Base]: aaveV3AssetsDefaultMarketBase,
} as const;

export const aaveV3AssetsLidoMarketEth = ['ETH', 'wstETH', 'USDS', 'USDC', 'ezETH', 'sUSDe', 'GHO', 'rsETH', 'tETH'];

export const aaveV3AssetsLidoMarket = {
  [NetworkNumber.Eth]: aaveV3AssetsLidoMarketEth,
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Arb]: [],
  [NetworkNumber.Base]: [],
} as const;

export const aaveV3AssetsEtherfiMarketEth = ['weETH', 'USDC', 'PYUSD', 'FRAX'];

export const aaveV3AssetsEtherfiMarket = {
  [NetworkNumber.Eth]: aaveV3AssetsEtherfiMarketEth,
  [NetworkNumber.Opt]: [],
  [NetworkNumber.Arb]: [],
  [NetworkNumber.Base]: [],
} as const;