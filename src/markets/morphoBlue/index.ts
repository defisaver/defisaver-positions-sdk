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
  oracle: '0x2a01eb9496094da03c4e364def50f5ad1280ad72',
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MorphoBlueMarkets = (networkId: NetworkNumber) => ({
  [MorphoBlueVersions.MorphoBlueWstEthEth]: MORPHO_BLUE_WSTETH_ETH(networkId),
}) as const;