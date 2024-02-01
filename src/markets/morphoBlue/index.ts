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
  marketId: '0xc54d7acf14de29e0e5527cabd7a576506870346a78a11a6762e2cca66322ec41',
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
  marketId: '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MORPHO_BLUE_SDAI_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'sDAI/USDC',
  value: MorphoBlueVersions.MorphoBlueSDAIUSDC,
  url: 'sdaiusdc',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
  oracle: '0x6CAFE228eC0B0bC2D076577d56D35Fe704318f6d',
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.965,
  marketId: '0x06f2842602373d247c4934f7656e513955ccc4c377f0febc0d9ca2c3bcc191b1',
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MORPHO_BLUE_WBTC_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'WBTC/USDC',
  value: MorphoBlueVersions.MorphoBlueWBTCUSDC,
  url: 'wbtcusdc',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  oracle: '0xDddd770BADd886dF3864029e4B377B5F6a2B6b83',
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49',
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MORPHO_BLUE_ETH_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'ETH/USDC',
  value: MorphoBlueVersions.MorphoBlueEthUSDC,
  url: 'ethusdc',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  oracle: '0xdC6fd5831277c693b1054e19E94047cB37c77615',
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0xf9acc677910cc17f650416a22e2a14d5da7ccb9626db18f1bf94efe64f92b372',
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'morpho-blue',
});

export const MorphoBlueMarkets = (networkId: NetworkNumber) => ({
  [MorphoBlueVersions.MorphoBlueWstEthEth]: MORPHO_BLUE_WSTETH_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthUSDC]: MORPHO_BLUE_WSTETH_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueSDAIUSDC]: MORPHO_BLUE_SDAI_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueWBTCUSDC]: MORPHO_BLUE_WBTC_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueEthUSDC]: MORPHO_BLUE_ETH_USDC(networkId),
}) as const;