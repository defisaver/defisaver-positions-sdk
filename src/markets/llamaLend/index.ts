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
  vaultAddress: '0x8cf1DE26729cfB7137AF1A6B2a665e099EC319b5',
  url: 'wstethcrvusd',
});
export const LLAMALEND_CRVUSD_CRV_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [1],
  label: 'LlamaLend - crvUSD/CRV',
  shortLabel: 'crvUSD/CRV',
  value: LlamaLendVersions.LlamaLendcrvUSDCRV,
  collAsset: 'crvUSD',
  baseAsset: 'CRV',
  controllerAddress: getConfigContractAddress('LlamaLendCrvUSDCRVController', networkId),
  vaultAddress: '0x4D2f44B0369f3C20c3d670D2C26b048985598450',
  url: 'crvusdcrv',
});
export const LLAMALEND_CRV_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [1],
  label: 'LlamaLend - CRV/crvUSD',
  shortLabel: 'CRV/crvUSD',
  value: LlamaLendVersions.LlamaLendCRVcrvUSD,
  collAsset: 'CRV',
  baseAsset: 'crvUSD',
  controllerAddress: getConfigContractAddress('LlamaLendCRVCrvUSDController', networkId),
  vaultAddress: '0xCeA18a8752bb7e7817F9AE7565328FE415C0f2cA',
  url: 'crvcrvusd',
});

export const LLAMALEND_TBTC_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [1],
  label: 'LlamaLend - TBTC/crvUSD',
  shortLabel: 'TBTC/crvUSD',
  value: LlamaLendVersions.LlamaLendTBTCcrvUSD,
  collAsset: 'tBTC',
  baseAsset: 'crvUSD',
  controllerAddress: getConfigContractAddress('LlamaLendTBTCCrvUSDController', networkId),
  vaultAddress: '0xb2b23C87a4B6d1b03Ba603F7C3EB9A81fDC0AAC9',
  url: 'tbtccrvusd',
});

export const LlamaLendMarkets = (networkId: NetworkNumber) => ({
  [LlamaLendVersions.LlamaLendwstETHcrvUSD]: LLAMALEND_WSTETH_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LlamaLendcrvUSDCRV]: LLAMALEND_CRVUSD_CRV_MARKET(networkId),
  [LlamaLendVersions.LlamaLendCRVcrvUSD]: LLAMALEND_CRV_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LlamaLendTBTCcrvUSD]: LLAMALEND_TBTC_CRVUSD_MARKET(networkId),
}) as const;


export const LLAMALEND_ALL_VERSIONS = [
  LlamaLendVersions.LlamaLendwstETHcrvUSD,
  LlamaLendVersions.LlamaLendcrvUSDCRV,
  LlamaLendVersions.LlamaLendCRVcrvUSD,
  LlamaLendVersions.LlamaLendTBTCcrvUSD,
];
export const getLlamaLendMarketData = (market: LlamaLendVersions, network: NetworkNumber = 1) => LlamaLendMarkets(network)[market];
