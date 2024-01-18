import { MorphoBlueMarketData, MorphoBlueVersions } from '../../types';
import { NetworkNumber } from '../../types/common';

export const MORPHO_BLUE_WSTETH_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWstEthEth,
  url: 'wstetheth',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0x2a01eb9496094da03c4e364def50f5ad1280ad72',
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MORPHO_BLUE_WSTETH_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/USDC',
  value: MorphoBlueVersions.MorphoBlueWstEthUSDC,
  url: 'wstethusdc',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0x48F7E36EB6B826B2dF4B2E630B62Cd25e89E40e2',
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MorphoBlueMarkets = (networkId: NetworkNumber) => ({
  [MorphoBlueVersions.MorphoBlueWstEthEth]: MORPHO_BLUE_WSTETH_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthUSDC]: MORPHO_BLUE_WSTETH_USDC(networkId),
}) as const;