import { FtDnmmMarketData, FtDnmmVersions, NetworkNumber } from '../../types';

/**
 * ftDNMM is a single cross-margin money market per chain (PositionsManager).
 * The asset list mirrors the on-chain ConfigRegistry of the mainnet deployment.
 */
export const FT_DNMM = (networkId: NetworkNumber): FtDnmmMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Flying Tulip',
  shortLabel: 'Flying Tulip',
  url: 'ftdnmm',
  value: FtDnmmVersions.FtDnmm,
  assets: ['WETH', 'USDC', 'WBTC', 'USDT', 'wstETH'],
  protocolName: 'ftdnmm',
});

export const FtDnmmMarkets = (networkId: NetworkNumber) => ({
  [FtDnmmVersions.FtDnmm]: FT_DNMM(networkId),
});
