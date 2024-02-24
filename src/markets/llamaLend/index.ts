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
  controllerAddress: '0x5E657c5227A596a860621C5551c9735d8f4A8BE3',
  vaultAddress: '0xE21C518a09b26Bf65B16767B97249385f12780d9',
  url: 'wstethcrvusd',
});
export const LLAMALEND_CRVUSD_CRV_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [1],
  label: 'LlamaLend - crvUSD/CRV',
  shortLabel: 'crvUSD/CRV',
  value: LlamaLendVersions.LlamaLendcrvUSDCRV,
  collAsset: 'crvUSD',
  baseAsset: 'CRV',
  controllerAddress: '0x43fc0f246F952ff12B757341A91cF4040711dDE9',
  vaultAddress: '0x044aC5160e5A04E09EBAE06D786fc151F2BA5ceD',
  url: 'crvusdcrv',
});
export const LLAMALEND_CRV_CRVUSD_MARKET = (networkId: NetworkNumber): LlamaLendMarketData => ({
  chainIds: [1],
  label: 'LlamaLend - CRV/crvUSD',
  shortLabel: 'CRV/crvUSD',
  value: LlamaLendVersions.LlamaLendCRVcrvUSD,
  collAsset: 'CRV',
  baseAsset: 'crvUSD',
  controllerAddress: '0x7443944962D04720f8c220C0D25f56F869d6EfD4',
  vaultAddress: '0x67A18c18709C09D48000B321c6E1cb09F7181211',
  url: 'crvcrvusd',
});

export const LlamaLendMarkets = (networkId: NetworkNumber) => ({
  [LlamaLendVersions.LlamaLendwstETHcrvUSD]: LLAMALEND_WSTETH_CRVUSD_MARKET(networkId),
  [LlamaLendVersions.LlamaLendcrvUSDCRV]: LLAMALEND_CRVUSD_CRV_MARKET(networkId),
  [LlamaLendVersions.LlamaLendCRVcrvUSD]: LLAMALEND_CRV_CRVUSD_MARKET(networkId),
}) as const;


export const LLAMALEND_ALL_VERSIONS = [
  LlamaLendVersions.LlamaLendwstETHcrvUSD,
  LlamaLendVersions.LlamaLendcrvUSDCRV,
  LlamaLendVersions.LlamaLendCRVcrvUSD,
];
export const getLlamaLendMarketData = (market: LlamaLendVersions, network: NetworkNumber = 1) => LlamaLendMarkets(network)[market];