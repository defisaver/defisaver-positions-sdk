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

export const LLAMALEND_WSTETH_CRVUSD_MARKET_2 = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - wstETH/crvUSD #2',
  shortLabel: 'wstETH/crvUSD #2',
  value: LlamaLendVersions.LLWstethCrvusd2,
  collAsset: 'wstETH',
  baseAsset: 'crvUSD',
  url: 'wstethcrvusd2',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLWstethCrvusd2),
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

export const LLAMALEND_SUSDE_CRVUSD_MARKET_2 = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - sUSDe/crvUSD #2',
  shortLabel: 'sUSDe/crvUSD #2',
  value: LlamaLendVersions.LLSusdeCrvusd2,
  collAsset: 'sUSDe',
  baseAsset: 'crvUSD',
  url: 'susdecrvusd2',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLSusdeCrvusd2),
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

export const LLAMALEND_WETH_CRVUSD_MARKET_2 = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth, NetworkNumber.Arb],
  label: 'LlamaLend - ETH/crvUSD #2',
  shortLabel: 'ETH/crvUSD #2',
  value: LlamaLendVersions.LLWethCrvusd2,
  collAsset: 'ETH',
  baseAsset: 'crvUSD',
  url: 'wethcrvusd2',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLWethCrvusd2),
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

export const LLAMALEND_ARB_CRVUSD_MARKET_2 = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Arb],
  label: 'LlamaLend - ARB/crvUSD #2',
  shortLabel: 'ARB/crvUSD #2',
  value: LlamaLendVersions.LLArbCrvusd2,
  collAsset: 'ARB',
  baseAsset: 'crvUSD',
  url: 'arbcrvusd2',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLArbCrvusd2),
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
  chainIds: [NetworkNumber.Eth, NetworkNumber.Arb],
  label: 'LlamaLend - WBTC/crvUSD',
  shortLabel: 'WBTC/crvUSD',
  value: LlamaLendVersions.LLWbtcCrvusd,
  collAsset: 'WBTC',
  baseAsset: 'crvUSD',
  url: 'wbtcusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLWbtcCrvusd),
});

export const LLAMALEND_WBTC_CRVUSD_MARKET_2 = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Arb],
  label: 'LlamaLend - WBTC/crvUSD #2',
  shortLabel: 'WBTC/crvUSD #2',
  value: LlamaLendVersions.LLWbtcCrvusd2,
  collAsset: 'WBTC',
  baseAsset: 'crvUSD',
  url: 'wbtcusd2',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLWbtcCrvusd2),
});

export const LLAMALEND_USDE_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'LlamaLend - USDe/crvUSD',
  shortLabel: 'USDe/crvUSD',
  value: LlamaLendVersions.LLUsdeCrvusd,
  collAsset: 'USDe',
  baseAsset: 'crvUSD',
  url: 'usdecrvusd',
  ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLUsdeCrvusd),
});

// temp disabled
// export const LLAMALEND_PUFETH_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
//   chainIds: [NetworkNumber.Eth],
//   label: 'LlamaLend - pufETH/crvUSD',
//   shortLabel: 'pufETH/crvUSD',
//   value: LlamaLendVersions.LLPufethCrvusd,
//   collAsset: 'pufETH',
//   baseAsset: 'crvUSD',
//   url: 'pufethcrvusd',
//   ...getLLamaLendAddresses(networkId, LlamaLendVersions.LLPufethCrvusd),
// });

export const LlamaLendMarkets = (networkId: NetworkNumber):Record<LlamaLendVersionsType, LlamaLendMarketData> => ({
  [LlamaLendVersions.LLWstethCrvusd]: LLAMALEND_WSTETH_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLWstethCrvusd2]: LLAMALEND_WSTETH_CRVUSD_MARKET_2(networkId),
  [LlamaLendVersions.LLCrvusdCrv]: LLAMALEND_CRVUSD_CRV_MARKET(networkId),
  [LlamaLendVersions.LLCrvCrvusd]: LLAMALEND_CRV_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLTbtcCrvusd]: LLAMALEND_TBTC_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLCrvusdTbtc]: LLAMALEND_CRVUSD_TBTC_MARKET(networkId),
  [LlamaLendVersions.LLWethCrvusd]: LLAMALEND_WETH_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLCrvusdWeth]: LLAMALEND_CRVUSD_WETH_MARKET(networkId),
  [LlamaLendVersions.LLWethCrvusd2]: LLAMALEND_WETH_CRVUSD_MARKET_2(networkId),
  [LlamaLendVersions.LLArbCrvusd]: LLAMALEND_ARB_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLArbCrvusd2]: LLAMALEND_ARB_CRVUSD_MARKET_2(networkId),
  [LlamaLendVersions.LLFxnCrvusd]: LLAMALEND_FXN_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLWbtcCrvusd]: LLAMALEND_WBTC_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLWbtcCrvusd2]: LLAMALEND_WBTC_CRVUSD_MARKET_2(networkId),
  [LlamaLendVersions.LLSusdeCrvusd]: LLAMALEND_SUSDE_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LLSusdeCrvusd2]: LLAMALEND_SUSDE_CRVUSD_MARKET_2(networkId),
  [LlamaLendVersions.LLUsdeCrvusd]: LLAMALEND_USDE_CRVUSD_MARKET(networkId),
  // [LlamaLendVersions.LLPufethCrvusd]: LLAMALEND_PUFETH_CRVUSD_MARKET(networkId), // temp disabled
}) as const;


export const getLlamaLendMarketData = (market: LlamaLendVersionsType, network: NetworkNumber = 1) => LlamaLendMarkets(network)[market];


export const getLlamaLendMarketFromControllerAddress = (controllerAddress: string, network: NetworkNumber) => {
  const markets = LlamaLendMarkets(network);
  const market = Object.values(markets).find((tempMarket) => tempMarket.controllerAddress === controllerAddress);
  if (!market) throw new Error('Market not found');
  return market;
};
