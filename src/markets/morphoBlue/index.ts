import { MorphoBlueMarketData, MorphoBlueVersions } from '../../types';
import { NetworkNumber } from '../../types/common';

export const MORPHO_BLUE_WSTETH_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWstEthEth,
  url: 'default',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0x369AaeD0E710B75fA16c947bE3407f610EeE6d93',
  irm: '0xBda60AaC8a47B03805751D15755F52B2ce3E1ecB',
  lltv: 0.9,
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MORPHO_BLUE_RETH_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'rETH/ETH',
  value: MorphoBlueVersions.MorphoBlueREthEth,
  url: 'default',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0xae78736cd615f374d3085123a210448e74fc6393',
  oracle: '0x369AaeD0E710B75fA16c947bE3407f610EeE6d93',
  irm: '0xBda60AaC8a47B03805751D15755F52B2ce3E1ecB',
  lltv: 0.9,
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MorphoBlueMarkets = (networkId: NetworkNumber) => ({
  [MorphoBlueVersions.MorphoBlueWstEthEth]: MORPHO_BLUE_WSTETH_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueREthEth]: MORPHO_BLUE_RETH_ETH(networkId),
}) as const;