import { getConfigContractAddress } from '../../contracts';
import { LlamaLendMarketData, LlamaLendVersions } from '../../types';
import { NetworkNumber } from '../../types/common';

export const LLAMALEND_WSTETH_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [1],
  label: 'LlamaLend - wstETH/crvUSD',
  shortLabel: 'wstETH/crvUSD',
  value: LlamaLendVersions.LlamaLendwstETHcrvUSD,
  collAsset: 'wstETH',
  baseAsset: 'crvUSD',
  controllerAddress: getConfigContractAddress('LlamaLendWstETHCrvUSDController', networkId),
});
export const LLAMALEND_CRVUSD_CRV_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [1],
  label: 'LlamaLend - crvUSD/CRV',
  shortLabel: 'crvUSD/CRV',
  value: LlamaLendVersions.LlamaLendcrvUSDCRV,
  collAsset: 'crvUSD',
  baseAsset: 'CRV',
  controllerAddress: getConfigContractAddress('crvUSDETHController', networkId),
});
export const LLAMALEND_CRV_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [1],
  label: 'LlamaLend - CRV/crvUSD',
  shortLabel: 'CRV/crvUSD',
  value: LlamaLendVersions.LlamaLendCRVcrvUSD,
  collAsset: 'CRV',
  baseAsset: 'crvUSD',
  controllerAddress: getConfigContractAddress('crvUSDWBTCController', networkId),
});

export const LlamaLendMarkets = (networkId: NetworkNumber) => ({
  [LlamaLendVersions.LlamaLendwstETHcrvUSD]: LLAMALEND_WSTETH_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LlamaLendcrvUSDCRV]: LLAMALEND_CRVUSD_CRV_MARKET(networkId),
  [LlamaLendVersions.LlamaLendCRVcrvUSD]: LLAMALEND_CRV_CRVUSD_MARKET(networkId),
}) as const;