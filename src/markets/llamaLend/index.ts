import { LlamaLendMarketData, LlamaLendVersions, LlamaLendVersionsType } from '../../types';
import { NetworkNumber } from '../../types/common';
import { getLLamaLendAddresses } from './contractAddresses';

export const LLAMALEND_WSTETH_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - wstETH/crvUSD',
  shortLabel: 'wstETH/crvUSD',
  value: LlamaLendVersions.LLWstethCrvusd,
  collAsset: 'wstETH',
  baseAsset: 'crvUSD',
  url: 'wstethcrvusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLWstethCrvusd),
});

export const LLAMALEND_SUSDE_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - sUSDe/crvUSD',
  shortLabel: 'sUSDe/crvUSD',
  value: LlamaLendVersions.LLSusdeCrvusd,
  collAsset: 'sUSDe',
  baseAsset: 'crvUSD',
  url: 'susdecrvusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLSusdeCrvusd),
});

export const LLAMALEND_CRV_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth, NetworkNumber.Arb],
  label: 'LlamaLend - CRV/crvUSD',
  shortLabel: 'CRV/crvUSD',
  value: LlamaLendVersions.LLCrvCrvusd,
  collAsset: 'CRV',
  baseAsset: 'crvUSD',
  url: 'crvcrvusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLCrvCrvusd),
});

export const LLAMALEND_CRVUSD_CRV_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - crvUSD/CRV',
  shortLabel: 'crvUSD/CRV',
  value: LlamaLendVersions.LLCrvusdCrv,
  collAsset: 'crvUSD',
  baseAsset: 'CRV',
  url: 'crvusdcrv',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLCrvusdCrv),
});


export const LLAMALEND_TBTC_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - tBTC/crvUSD',
  shortLabel: 'tBTC/crvUSD',
  value: LlamaLendVersions.LLTbtcCrvusd,
  collAsset: 'tBTC',
  baseAsset: 'crvUSD',
  url: 'tbtccrvusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLTbtcCrvusd),
});

export const LLAMALEND_CRVUSD_TBTC_MARKET = (networkId:NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - crvUSD/tBTC',
  shortLabel: 'crvUSD/tBTC',
  value: LlamaLendVersions.LLCrvusdTbtc,
  collAsset: 'crvUSD',
  baseAsset: 'tBTC',
  url: 'crvusdtbtc',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLCrvusdTbtc),
});

export const LLAMALEND_WETH_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth, NetworkNumber.Arb],
  label: 'LlamaLend - ETH/crvUSD',
  shortLabel: 'ETH/crvUSD',
  value: LlamaLendVersions.LLWethCrvusd,
  collAsset: 'ETH',
  baseAsset: 'crvUSD',
  url: 'wethcrvusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLWethCrvusd),
});

export const LLAMALEND_CRVUSD_WETH_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - crvUSD/ETH',
  shortLabel: 'crvUSD/ETH',
  value: LlamaLendVersions.LLCrvusdWeth,
  collAsset: 'crvUSD',
  baseAsset: 'ETH',
  url: 'crvusdweth',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLCrvusdWeth),
});

export const LLAMALEND_ARB_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Arb],
  label: 'LlamaLend - ARB/crvUSD',
  shortLabel: 'ARB/crvUSD',
  value: LlamaLendVersions.LLArbCrvusd,
  collAsset: 'ARB',
  baseAsset: 'crvUSD',
  url: 'arbcrvusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLArbCrvusd),
});

export const LLAMALEND_FXN_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Arb],
  label: 'LlamaLend - FXN/crvUSD',
  shortLabel: 'FXN/crvUSD',
  value: LlamaLendVersions.LLFxnCrvusd,
  collAsset: 'FXN',
  baseAsset: 'crvUSD',
  url: 'fxncrvusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLFxnCrvusd),
});

export const LLAMALEND_WBTC_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Arb],
  label: 'LlamaLend - WBTC/crvUSD',
  shortLabel: 'WBTC/crvUSD',
  value: LlamaLendVersions.LLWbtcCrvusd,
  collAsset: 'WBTC',
  baseAsset: 'crvUSD',
  url: 'wbtcusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLWbtcCrvusd),
});

export const LlamaLendMarkets = (networkId: NetworkNumber):Record<LlamaLendVersionsType, LlamaLendMarketData> => ({
  [LlamaLendVersions.LLWstethCrvusd]: LLAMALEND_WSTETH_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLCrvusdCrv]: LLAMALEND_CRVUSD_CRV_MARKET(networkId),
  [LlamaLendVersions.LLCrvCrvusd]: LLAMALEND_CRV_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLTbtcCrvusd]: LLAMALEND_TBTC_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLCrvusdTbtc]: LLAMALEND_CRVUSD_TBTC_MARKET(networkId),
  [LlamaLendVersions.LLWethCrvusd]: LLAMALEND_WETH_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLCrvusdWeth]: LLAMALEND_CRVUSD_WETH_MARKET(networkId),
  [LlamaLendVersions.LLArbCrvusd]: LLAMALEND_ARB_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLFxnCrvusd]: LLAMALEND_FXN_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLWbtcCrvusd]: LLAMALEND_WBTC_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLSusdeCrvusd]: LLAMALEND_SUSDE_CRVUSD_MARKET(networkId),
}) as const;


export const getLlamaLendMarketData = (market: LlamaLendVersionsType, network: NetworkNumber = 1) => LlamaLendMarkets(network)[market];


export const getLlamaLendMarketFromControllerAddress = (controllerAddress: string, network: NetworkNumber) => {
  const markets = LlamaLendMarkets(network);
  const market = Object.values(markets).find((market) => market.controllerAddress === controllerAddress);
  if (!market) throw new Error('Market not found');
  return market;
};
