import { getConfigContractAddress } from '../../contracts';
import { CrvUSDMarketData, CrvUSDVersions } from '../../types';
import { NetworkNumber } from '../../types/common';

export const CRVUSD_WSTETH_MARKET = (networkId: NetworkNumber): CrvUSDMarketData => ({
  chainIds: [1],
  label: 'wstETH',
  shortLabel: 'wstETH',
  value: CrvUSDVersions.wstETH,
  collAsset: 'wstETH',
  baseAsset: 'crvUSD',
  controllerAddress: getConfigContractAddress('crvUSDwstETHController', networkId),
  ammAddress: getConfigContractAddress('crvUSDwstETHAmm', networkId),
  createCollAssets: ['wstETH', 'ETH'],
});
export const CRVUSD_ETH_MARKET = (networkId: NetworkNumber): CrvUSDMarketData => ({
  chainIds: [1],
  label: 'ETH',
  shortLabel: 'ETH',
  value: CrvUSDVersions.ETH,
  collAsset: 'ETH',
  baseAsset: 'crvUSD',
  controllerAddress: getConfigContractAddress('crvUSDETHController', networkId),
  ammAddress: getConfigContractAddress('crvUSDETHAmm', networkId),
  createCollAssets: ['ETH'],
});
export const CRVUSD_WBTC_MARKET = (networkId: NetworkNumber): CrvUSDMarketData => ({
  chainIds: [1],
  label: 'WBTC',
  shortLabel: 'WBTC',
  value: CrvUSDVersions.WBTC,
  collAsset: 'WBTC',
  baseAsset: 'crvUSD',
  controllerAddress: getConfigContractAddress('crvUSDWBTCController', networkId),
  ammAddress: getConfigContractAddress('crvUSDWBTCAmm', networkId),
  createCollAssets: ['WBTC'],
});

export const CrvUsdMarkets = (networkId: NetworkNumber) => ({
  [CrvUSDVersions.wstETH]: CRVUSD_WSTETH_MARKET(networkId),
  [CrvUSDVersions.ETH]: CRVUSD_ETH_MARKET(networkId),
  [CrvUSDVersions.WBTC]: CRVUSD_WBTC_MARKET(networkId),
}) as const;