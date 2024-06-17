import { compareAddresses } from '../../services/utils';
import { MorphoBlueMarketData, MorphoBlueOracleType, MorphoBlueVersions } from '../../types';
import { NetworkNumber } from '../../types/common';

export const MORPHO_BLUE_WSTETH_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/USDC',
  value: MorphoBlueVersions.MorphoBlueWstEthUSDC,
  url: 'wstethusdc',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0x48F7E36EB6B826B2dF4B2E630B62Cd25e89E40e2',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
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
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.965,
  marketId: '0x06f2842602373d247c4934f7656e513955ccc4c377f0febc0d9ca2c3bcc191b1',
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
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49',
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
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0xf9acc677910cc17f650416a22e2a14d5da7ccb9626db18f1bf94efe64f92b372',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WBTC_USDT = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'WBTC/USDT',
  value: MorphoBlueVersions.MorphoBlueWBTCUSDT,
  url: 'wbtcusdt',
  loanToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  collateralToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  oracle: '0x008bF4B1cDA0cc9f0e882E0697f036667652E1ef',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0xa921ef34e2fc7a27ccc50ae7e4b154e16c9799d3387076c421423ef52ac4df99',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WBTC_PYUSD = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'WBTC/PYUSD',
  value: MorphoBlueVersions.MorphoBlueWBTCPYUSD,
  url: 'wbtcpyusd',
  loanToken: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
  collateralToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  oracle: '0xc53c90d6E9A5B69E4ABf3d5Ae4c79225C7FeF3d2',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x9337a95dcb09d10abb33fdb955dd27b46e345f5510d54d9403f570f8f37b5983',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WBTC_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'WBTC/ETH',
  value: MorphoBlueVersions.MorphoBlueWBTCEth,
  url: 'wbtceth',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  oracle: '0xc29B3Bc033640baE31ca53F8a0Eb892AdF68e663',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0x138eec0e4a1937eb92ebc70043ed539661dd7ed5a89fb92a720b341650288a40',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_USDT = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/USDT',
  value: MorphoBlueVersions.MorphoBlueWstEthUSDT,
  url: 'wstethusdt',
  loanToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0x95DB30fAb9A3754e42423000DF27732CB2396992',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0xe7e9694b754c4d4f7e21faf7223f6fa71abaeb10296a4c43a54a7977149687d2',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_USDA_EXCHANGE_RATE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/USDA',
  value: MorphoBlueVersions.MorphoBlueWstEthUSDA_Exchange_Rate,
  url: 'wstethusda',
  loanToken: '0x0000206329b97DB379d5E1Bf586BbDB969C63274',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0xBC693693fDBB177Ad05ff38633110016BC043AC5',
  oracleType: MorphoBlueOracleType.LIDO_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x423cb007534ac88febb8ce39f544ab303e8b757f8415ed891fc76550f8f4c965',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_PYUSD = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/PYUSD',
  value: MorphoBlueVersions.MorphoBlueWstEthPYUSD,
  url: 'wstethpyusd',
  loanToken: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0x27679a17b7419fB10Bd9D143f21407760fdA5C53',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x124ddf1fa02a94085d1fcc35c46c7e180ddb8a0d3ec1181cf67a75341501c9e6',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WEETH_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'weETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWeEthEth,
  url: 'weetheth',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
  oracle: '0x3fa58b74e9a8eA8768eb33c8453e9C2Ed089A40a',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x698fe98247a40c5771537b5786b2f3f9d78eb487b4ce4d75533cd0e94d88a115',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_USDE_USDT = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'USDe/USDT',
  value: MorphoBlueVersions.MorphoBlueUSDeUSDT,
  url: 'usdeusdt',
  loanToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  collateralToken: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
  oracle: '0xAf5060C11D3E8325a8ECF84c07fAB7Ac2297A72d',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0xcec858380cba2d9ca710fce3ce864d74c3f620d53826f69d08508902e09be86f',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_SUSDE_USDT = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'sUSDe/USDT',
  value: MorphoBlueVersions.MorphoBlueSUSDeUSDT,
  url: 'susdeusdt',
  loanToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  collateralToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
  oracle: '0xE47E36457D0cF83A74AE1e45382B7A044f7abd99',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0xdc5333039bcf15f1237133f74d5806675d83d9cf19cfd4cfdd9be674842651bf',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_SDAI_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'sDAI/ETH',
  value: MorphoBlueVersions.MorphoBlueSDAIEth,
  url: 'sdaieth',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
  oracle: '0x0f9bb760D76af1B5Ca89102084E1963F6698AFda',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x1929f8139224cb7d5db8c270addc9ce366d37ad279e1135f73c0adce74b0f936',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_EZETH_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'ezETH/ETH',
  value: MorphoBlueVersions.MorphoBlueEzEthEth,
  url: 'ezetheth',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110',
  oracle: '0x61025e2B0122ac8bE4e37365A4003d87ad888Cc3',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x49bb2d114be9041a787432952927f6f144f05ad3e83196a7d062f374ee11d0ee',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_MKR_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'MKR/USDC',
  value: MorphoBlueVersions.MorphoBlueMKRUSDC,
  url: 'mkrusdc',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
  oracle: '0x6686788B4315A4F93d822c1Bf73910556FCe2d5a',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.77,
  marketId: '0x97bb820669a19ba5fa6de964a466292edd67957849f9631eb8b830c382f58b7f',
  protocolName: 'morpho-blue',
});
// wstETH/WETH
export const MORPHO_BLUE_WSTETH_ETH_945 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWstEthEth_945,
  url: 'wstetheth-c54d7acf',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0x2a01eb9496094da03c4e364def50f5ad1280ad72',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  marketId: '0xc54d7acf14de29e0e5527cabd7a576506870346a78a11a6762e2cca66322ec41',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_ETH_945_EXCHANGE_RATE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWstEthEth_945_Exchange_Rate,
  url: 'wstetheth-d0e50cda',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0xbD60A6770b27E084E8617335ddE769241B0e71D8',
  oracleType: MorphoBlueOracleType.LIDO_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  marketId: '0xd0e50cdac92fe2172043f5e0c36532c6369d24947e40968f34a5e8819ca9ec5d',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_ETH_965_EXCHANGE_RATE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWstEthEth_965_Exchange_Rate,
  url: 'wstetheth-b8fc70e8',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  oracle: '0xbD60A6770b27E084E8617335ddE769241B0e71D8',
  oracleType: MorphoBlueOracleType.LIDO_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.965,
  marketId: '0xb8fc70e82bc5bb53e773626fcc6a23f7eefa036918d7ef216ecfb1950a94a85e',
  protocolName: 'morpho-blue',
});
// sUSDe/DAI
export const MORPHO_BLUE_SUSDE_DAI_770 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'sUSDe/DAI',
  value: MorphoBlueVersions.MorphoBlueSUSDeDAI_770,
  url: 'susdedai-42dcfb38',
  loanToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  collateralToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
  oracle: '0x5D916980D5Ae1737a8330Bf24dF812b2911Aae25',
  oracleType: MorphoBlueOracleType.ETHENA_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.77,
  marketId: '0x42dcfb38bb98767afb6e38ccf90d59d0d3f0aa216beb3a234f12850323d17536',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_SUSDE_DAI_860 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'sUSDe/DAI',
  value: MorphoBlueVersions.MorphoBlueSUSDeDAI_860,
  url: 'susdedai-39d11026',
  loanToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  collateralToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
  oracle: '0x5D916980D5Ae1737a8330Bf24dF812b2911Aae25',
  oracleType: MorphoBlueOracleType.ETHENA_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x39d11026eae1c6ec02aa4c0910778664089cdd97c3fd23f68f7cd05e2e95af48',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_SUSDE_DAI_915 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'sUSDe/DAI',
  value: MorphoBlueVersions.MorphoBlueSUSDeDAI_915,
  url: 'susdedai-1247f1c2',
  loanToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  collateralToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
  oracle: '0x5D916980D5Ae1737a8330Bf24dF812b2911Aae25',
  oracleType: MorphoBlueOracleType.ETHENA_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0x1247f1c237eceae0602eab1470a5061a6dd8f734ba88c7cdc5d6109fb0026b28',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_SUSDE_DAI_945 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'sUSDe/DAI',
  value: MorphoBlueVersions.MorphoBlueSUSDeDAI_945,
  url: 'susdedai-0e475337',
  loanToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  collateralToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
  oracle: '0x5D916980D5Ae1737a8330Bf24dF812b2911Aae25',
  oracleType: MorphoBlueOracleType.ETHENA_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  marketId: '0xe475337d11be1db07f7c5a156e511f05d1844308e66e17d2ba5da0839d3b34d9',
  protocolName: 'morpho-blue',
});

// USDe/DAI
export const MORPHO_BLUE_USDE_DAI_770 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'USDe/DAI',
  value: MorphoBlueVersions.MorphoBlueUSDeDAI_770,
  url: 'usdedai-fd8493f0',
  loanToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  collateralToken: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
  oracle: '0xaE4750d0813B5E37A51f7629beedd72AF1f9cA35',
  oracleType: MorphoBlueOracleType.ETHENA_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.77,
  marketId: '0xfd8493f09eb6203615221378d89f53fcd92ff4f7d62cca87eece9a2fff59e86f',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_USDE_DAI_860 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'USDe/DAI',
  value: MorphoBlueVersions.MorphoBlueUSDeDAI_860,
  url: 'usdedai-c581c5f7',
  loanToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  collateralToken: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
  oracle: '0xaE4750d0813B5E37A51f7629beedd72AF1f9cA35',
  oracleType: MorphoBlueOracleType.ETHENA_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0xc581c5f70bd1afa283eed57d1418c6432cbff1d862f94eaf58fdd4e46afbb67f',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_USDE_DAI_915 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'USDe/DAI',
  value: MorphoBlueVersions.MorphoBlueUSDeDAI_915,
  url: 'usdedai-8e6aeb10',
  loanToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  collateralToken: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
  oracle: '0xaE4750d0813B5E37A51f7629beedd72AF1f9cA35',
  oracleType: MorphoBlueOracleType.ETHENA_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0x8e6aeb10c401de3279ac79b4b2ea15fc94b7d9cfc098d6c2a1ff7b2b26d9d02c',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_USDE_DAI_945 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho Blue',
  shortLabel: 'USDe/DAI',
  value: MorphoBlueVersions.MorphoBlueUSDeDAI_945,
  url: 'usdedai-db760246',
  loanToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  collateralToken: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
  oracle: '0xaE4750d0813B5E37A51f7629beedd72AF1f9cA35',
  oracleType: MorphoBlueOracleType.ETHENA_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  marketId: '0xdb760246f6859780f6c1b272d47a8f64710777121118e56e0cdb4b8b744a3094',
  protocolName: 'morpho-blue',
});

// BASE

export const MORPHO_BLUE_CBETH_USDC_860_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Blue',
  shortLabel: 'cbETH/USDC',
  value: MorphoBlueVersions.MorphoBlueCbEthUSDC_860_Base,
  url: 'cbethusdc-dba352d9',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  collateralToken: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  oracle: '0x4756c26E01E61c7c2F86b10f4316e179db8F9425',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.86,
  marketId: '0xdba352d93a64b17c71104cbddc6aef85cd432322a1446b5b65163cbbc615cd0c',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_ETH_945_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWstEthEth_945_Base,
  url: 'wstetheth-e3c4d4d0',
  loanToken: '0x4200000000000000000000000000000000000006',
  collateralToken: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
  oracle: '0xaE10cbdAa587646246c8253E4532A002EE4fa7A4',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.945,
  marketId: '0xe3c4d4d0e214fdc52635d7f9b2f7b3b0081771ae2efeb3cb5aae26009f34f7a7',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_ETH_965_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWstEthEth_965_Base,
  url: 'wstetheth-6aa81f51',
  loanToken: '0x4200000000000000000000000000000000000006',
  collateralToken: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
  oracle: '0xaE10cbdAa587646246c8253E4532A002EE4fa7A4',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.965,
  marketId: '0x6aa81f51dfc955df598e18006deae56ce907ac02b0b5358705f1a28fcea23cc0',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_USDC_860_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Blue',
  shortLabel: 'wstETH/USDC',
  value: MorphoBlueVersions.MorphoBlueWstEthUSDC_860_Base,
  url: 'wstethusdc-a066f389',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  collateralToken: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
  oracle: '0x957e76d8f2D3ab0B4f342cd5f4b03A6f6eF2ce5F',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.86,
  marketId: '0xa066f3893b780833699043f824e5bb88b8df039886f524f62b9a1ac83cb7f1f0',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_CBETH_ETH_965_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Blue',
  shortLabel: 'cbETH/ETH',
  value: MorphoBlueVersions.MorphoBlueCbEthEth_965_Base,
  url: 'cbetheth-6600aae6',
  loanToken: '0x4200000000000000000000000000000000000006',
  collateralToken: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  oracle: '0xB03855Ad5AFD6B8db8091DD5551CAC4ed621d9E6',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.965,
  marketId: '0x6600aae6c56d242fa6ba68bd527aff1a146e77813074413186828fd3f1cdca91',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_ETH_USDC_860_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Blue',
  shortLabel: 'ETH/USDC',
  value: MorphoBlueVersions.MorphoBlueEthUSDC_860_Base,
  url: 'ethusdc-8793cf30',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  collateralToken: '0x4200000000000000000000000000000000000006',
  oracle: '0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.86,
  marketId: '0x8793cf302b8ffd655ab97bd1c695dbd967807e8367a65cb2f4edaf1380ba1bda',
  protocolName: 'morpho-blue',
});

export const MorphoBlueMarkets = (networkId: NetworkNumber) => ({
  [MorphoBlueVersions.MorphoBlueWstEthUSDC]: MORPHO_BLUE_WSTETH_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueSDAIUSDC]: MORPHO_BLUE_SDAI_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueWBTCUSDC]: MORPHO_BLUE_WBTC_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueEthUSDC]: MORPHO_BLUE_ETH_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueWBTCUSDT]: MORPHO_BLUE_WBTC_USDT(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthUSDT]: MORPHO_BLUE_WSTETH_USDT(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthUSDA_Exchange_Rate]: MORPHO_BLUE_WSTETH_USDA_EXCHANGE_RATE(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthPYUSD]: MORPHO_BLUE_WSTETH_PYUSD(networkId),
  [MorphoBlueVersions.MorphoBlueWeEthEth]: MORPHO_BLUE_WEETH_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueWBTCPYUSD]: MORPHO_BLUE_WBTC_PYUSD(networkId),
  [MorphoBlueVersions.MorphoBlueWBTCEth]: MORPHO_BLUE_WBTC_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueUSDeUSDT]: MORPHO_BLUE_USDE_USDT(networkId),
  [MorphoBlueVersions.MorphoBlueSUSDeUSDT]: MORPHO_BLUE_SUSDE_USDT(networkId),
  [MorphoBlueVersions.MorphoBlueSDAIEth]: MORPHO_BLUE_SDAI_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueEzEthEth]: MORPHO_BLUE_EZETH_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueMKRUSDC]: MORPHO_BLUE_MKR_USDC(networkId),
  // wstETH/WETH
  [MorphoBlueVersions.MorphoBlueWstEthEth_945]: MORPHO_BLUE_WSTETH_ETH_945(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthEth_945_Exchange_Rate]: MORPHO_BLUE_WSTETH_ETH_945_EXCHANGE_RATE(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthEth_965_Exchange_Rate]: MORPHO_BLUE_WSTETH_ETH_965_EXCHANGE_RATE(networkId),
  // sUSDe/DAI
  [MorphoBlueVersions.MorphoBlueSUSDeDAI_770]: MORPHO_BLUE_SUSDE_DAI_770(networkId),
  [MorphoBlueVersions.MorphoBlueSUSDeDAI_860]: MORPHO_BLUE_SUSDE_DAI_860(networkId),
  [MorphoBlueVersions.MorphoBlueSUSDeDAI_915]: MORPHO_BLUE_SUSDE_DAI_915(networkId),
  [MorphoBlueVersions.MorphoBlueSUSDeDAI_945]: MORPHO_BLUE_SUSDE_DAI_945(networkId),
  // USDe/DAI
  [MorphoBlueVersions.MorphoBlueUSDeDAI_770]: MORPHO_BLUE_USDE_DAI_770(networkId),
  [MorphoBlueVersions.MorphoBlueUSDeDAI_860]: MORPHO_BLUE_USDE_DAI_860(networkId),
  [MorphoBlueVersions.MorphoBlueUSDeDAI_915]: MORPHO_BLUE_USDE_DAI_915(networkId),
  [MorphoBlueVersions.MorphoBlueUSDeDAI_945]: MORPHO_BLUE_USDE_DAI_945(networkId),

  // Base
  [MorphoBlueVersions.MorphoBlueCbEthUSDC_860_Base]: MORPHO_BLUE_CBETH_USDC_860_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthEth_945_Base]: MORPHO_BLUE_WSTETH_ETH_945_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthEth_965_Base]: MORPHO_BLUE_WSTETH_ETH_965_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthUSDC_860_Base]: MORPHO_BLUE_WSTETH_USDC_860_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueCbEthEth_965_Base]: MORPHO_BLUE_CBETH_ETH_965_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueEthUSDC_860_Base]: MORPHO_BLUE_ETH_USDC_860_BASE(networkId),
}) as const;

export const findMorphoBlueMarket = (collateralToken: string, loanToken: string, lltv: number, oracle: string, irm: string, network = NetworkNumber.Eth) => {
  const markets = MorphoBlueMarkets(network);
  for (const market of Object.values(markets)) {
    if (compareAddresses(market.collateralToken, collateralToken) && compareAddresses(market.loanToken, loanToken) && market.lltv === lltv && compareAddresses(market.oracle, oracle) && compareAddresses(market.irm, irm)) {
      return market;
    }
  }
  return null;
};