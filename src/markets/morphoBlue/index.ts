import { compareAddresses } from '../../services/utils';
import { MorphoBlueMarketData, MorphoBlueOracleType, MorphoBlueVersions } from '../../types';
import { NetworkNumber } from '../../types/common';

export const MORPHO_BLUE_WSTETH_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
export const MORPHO_BLUE_USDE_USDT = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
export const MORPHO_BLUE_MKR_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
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
export const MORPHO_BLUE_TBTC_USDC = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'tBTC/USDC',
  value: MorphoBlueVersions.MorphoBlueTBTCUSDC,
  url: 'tbtcusdc',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
  oracle: '0x57bfdF6aB73995C5af58A95A16798190e366CA5b',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.77,
  marketId: '0xe4cfbee9af4ad713b41bf79f009ca02b17c001a0c0e7bd2e6a89b1111b3d3f08',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_CBBTC_ETH_915 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'cbBTC/ETH',
  value: MorphoBlueVersions.MorphoBlueCbBTCEth_915,
  url: 'cbbtceth-2cbfb3872',
  loanToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  collateralToken: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  oracle: '0x8F653cCFEbA16cF2c0B0D16bc82Bd6756C64f5D4',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0x2cbfb38723a8d9a2ad1607015591a78cfe3a5949561b39bde42c242b22874ec0',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_CBBTC_USDC_860 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'cbBTC/USDC',
  value: MorphoBlueVersions.MorphoBlueCbBTCUSDC_860,
  url: 'cbbtcusdc-64d65c9a',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  oracle: '0xA6D6950c9F177F1De7f7757FB33539e3Ec60182a',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_SUSDE_USDC_915 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'sUSDe/USDC',
  value: MorphoBlueVersions.MorphoBlueSUSDeUSDC_915,
  url: 'susdeusdc-85c7f437',
  loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  collateralToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
  oracle: '0x873CD44b860DEDFe139f93e12A4AcCa0926Ffb87',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.915,
  marketId: '0x85c7f4374f3a403b36d54cc284983b2b02bbd8581ee0f3c36494447b87d9fcab',
  protocolName: 'morpho-blue',
});
// ezETH/ETH
export const MORPHO_BLUE_EZETH_ETH_860 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'ezETH/ETH',
  value: MorphoBlueVersions.MorphoBlueEzEthEth_860,
  url: 'ezetheth-49bb2d11',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110',
  oracle: '0x61025e2B0122ac8bE4e37365A4003d87ad888Cc3',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x49bb2d114be9041a787432952927f6f144f05ad3e83196a7d062f374ee11d0ee',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_EZETH_ETH_945 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'ezETH/ETH',
  value: MorphoBlueVersions.MorphoBlueEzEthEth_945,
  url: 'ezetheth-a0534c78',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110',
  oracle: '0x94f93f1eADb8a2f73C415AD4C19cB791e6D0192b',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  marketId: '0xa0534c78620867b7c8706e3b6df9e69a2bc67c783281b7a77e034ed75cee012e',
  protocolName: 'morpho-blue',
});
// weETH/ETH
export const MORPHO_BLUE_WEETH_ETH_860 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'weETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWeEthEth_860,
  url: 'weetheth-698fe982',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
  oracle: '0x3fa58b74e9a8eA8768eb33c8453e9C2Ed089A40a',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.86,
  marketId: '0x698fe98247a40c5771537b5786b2f3f9d78eb487b4ce4d75533cd0e94d88a115',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WEETH_ETH_945 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'weETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWeEthEth_945,
  url: 'weetheth-37e7484d',
  loanToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  collateralToken: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
  oracle: '0xbDd2F2D473E8D63d1BFb0185B5bDB8046ca48a72',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  marketId: '0x37e7484d642d90f14451f1910ba4b7b8e4c3ccdd0ec28f8b2bdb35479e472ba7',
  protocolName: 'morpho-blue',
});
// wstETH/WETH
export const MORPHO_BLUE_WSTETH_ETH_945 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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
  label: 'Morpho',
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

export const MORPHO_BLUE_RETH_ETH_945 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [1],
  label: 'Morpho',
  shortLabel: 'rETH/ETH',
  value: MorphoBlueVersions.MorphoBlueREthEth_945,
  url: 'retheth-3c83f77b',
  loanToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  collateralToken: '0xae78736Cd615f374D3085123A210448E74Fc6393',
  oracle: '0x1b4A3F92e5Fffd1d35A98751c9FE4472483579bB',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  lltv: 0.945,
  marketId: '0x3c83f77bde9541f8d3d82533b19bbc1f97eb2f1098bb991728acbfbede09cc5d',
  protocolName: 'morpho-blue',
});

// BASE

export const MORPHO_BLUE_CBETH_USDC_860_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
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
export const MORPHO_BLUE_CBETH_USDC_860_BASE_1c21c59d = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'cbETH/USDC',
  value: MorphoBlueVersions.MorphoBlueCbEthUSDC_860_Base_1c21c59d,
  url: 'cbethusdc-1c21c59d',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  collateralToken: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  oracle: '0xb40d93F44411D8C09aD17d7F88195eF9b05cCD96',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.86,
  marketId: '0x1c21c59df9db44bf6f645d854ee710a8ca17b479451447e9f56758aee10a2fad',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_ETH_945_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'wstETH/ETH',
  value: MorphoBlueVersions.MorphoBlueWstEthEth_945_Base,
  url: 'wstetheth-3a4048c6',
  loanToken: '0x4200000000000000000000000000000000000006',
  collateralToken: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
  oracle: '0x4A11590e5326138B514E08A9B52202D42077Ca65',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.945,
  marketId: '0x3a4048c64ba1b375330d376b1ce40e4047d03b47ab4d48af484edec9fec801ba',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_ETH_965_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
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
export const MORPHO_BLUE_WSTETH_USDC_860_BASE_13c42741 = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'wstETH/USDC',
  value: MorphoBlueVersions.MorphoBlueWstEthUSDC_860_Base_13c42741,
  url: 'wstethusdc-13c42741',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  collateralToken: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
  oracle: '0xD7A1abA119a236Fea5BBC5cAC6836465cbe9289A',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.86,
  marketId: '0x13c42741a359ac4a8aa8287d2be109dcf28344484f91185f9a79bd5a805a55ae',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_WSTETH_USDC_860_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
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
  label: 'Morpho',
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
export const MORPHO_BLUE_CBETH_ETH_945_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'cbETH/ETH',
  value: MorphoBlueVersions.MorphoBlueCbEthEth_945_Base,
  url: 'cbetheth-84662b4f',
  loanToken: '0x4200000000000000000000000000000000000006',
  collateralToken: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  oracle: '0xB03855Ad5AFD6B8db8091DD5551CAC4ed621d9E6',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.945,
  marketId: '0x84662b4f95b85d6b082b68d32cf71bb565b3f22f216a65509cc2ede7dccdfe8c',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_ETH_USDC_860_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
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
export const MORPHO_BLUE_RETH_USDC_860_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'rETH/USDC',
  value: MorphoBlueVersions.MorphoBlueREthUSDC_860_Base,
  url: 'rethusdc-db0bc9f1',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  collateralToken: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c',
  oracle: '0x7E1136C04372874cca9C3C9a2DbC461E3858b228',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.86,
  marketId: '0xdb0bc9f10a174f29a345c5f30a719933f71ccea7a2a75a632a281929bba1b535',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_RETH_ETH_945_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'rETH/ETH',
  value: MorphoBlueVersions.MorphoBlueREthEth_945_Base,
  url: 'retheth-dc69cf2c',
  loanToken: '0x4200000000000000000000000000000000000006',
  collateralToken: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c',
  oracle: '0x05f73c9910806EedE92C83DEb3f805b71C6098f2',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.945,
  marketId: '0xdc69cf2caae7b7d1783fb5a9576dc875888afad17ab3d1a3fc102f741441c165',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_CBBTC_ETH_915_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'cbBTC/ETH',
  value: MorphoBlueVersions.MorphoBlueCbBTCEth_915_Base,
  url: 'cbbtceth-5dffffc7',
  loanToken: '0x4200000000000000000000000000000000000006',
  collateralToken: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  oracle: '0x10b95702a0ce895972C91e432C4f7E19811D320E',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.915,
  marketId: '0x5dffffc7d75dc5abfa8dbe6fad9cbdadf6680cbe1428bafe661497520c84a94c',
  protocolName: 'morpho-blue',
});
export const MORPHO_BLUE_CBBTC_USDC_860_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'cbBTC/USDC',
  value: MorphoBlueVersions.MorphoBlueCbBTCUSDC_860_Base,
  url: 'cbbtcusdc-9103c3b4',
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  collateralToken: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.86,
  marketId: '0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836',
  protocolName: 'morpho-blue',
});

export const MORPHO_BLUE_WSUPEROETHB_WETH_915_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoBlueMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho',
  shortLabel: 'wsuperOETHb/WETH',
  value: MorphoBlueVersions.MorphoBlueWsuperOETHbWETH_915_Base,
  url: 'wsuperoethbweth-144bf18d',
  loanToken: '0x4200000000000000000000000000000000000006',
  collateralToken: '0x7FcD174E80f264448ebeE8c88a7C4476AAF58Ea6',
  oracle: '0x28C964c985fe84736fAdc7Cf0bBd58B54bc7CF93',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687',
  lltv: 0.915,
  marketId: '0x144bf18d6bf4c59602548a825034f73bf1d20177fc5f975fc69d5a5eba929b45',
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
  [MorphoBlueVersions.MorphoBlueWeEthEth_860]: MORPHO_BLUE_WEETH_ETH_860(networkId),
  [MorphoBlueVersions.MorphoBlueWeEthEth_945]: MORPHO_BLUE_WEETH_ETH_945(networkId),
  [MorphoBlueVersions.MorphoBlueWBTCPYUSD]: MORPHO_BLUE_WBTC_PYUSD(networkId),
  [MorphoBlueVersions.MorphoBlueWBTCEth]: MORPHO_BLUE_WBTC_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueUSDeUSDT]: MORPHO_BLUE_USDE_USDT(networkId),
  [MorphoBlueVersions.MorphoBlueSUSDeUSDT]: MORPHO_BLUE_SUSDE_USDT(networkId),
  [MorphoBlueVersions.MorphoBlueSDAIEth]: MORPHO_BLUE_SDAI_ETH(networkId),
  [MorphoBlueVersions.MorphoBlueEzEthEth_860]: MORPHO_BLUE_EZETH_ETH_860(networkId),
  [MorphoBlueVersions.MorphoBlueEzEthEth_945]: MORPHO_BLUE_EZETH_ETH_945(networkId),
  [MorphoBlueVersions.MorphoBlueMKRUSDC]: MORPHO_BLUE_MKR_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueTBTCUSDC]: MORPHO_BLUE_TBTC_USDC(networkId),
  [MorphoBlueVersions.MorphoBlueCbBTCEth_915]: MORPHO_BLUE_CBBTC_ETH_915(networkId),
  [MorphoBlueVersions.MorphoBlueCbBTCUSDC_860]: MORPHO_BLUE_CBBTC_USDC_860(networkId),
  [MorphoBlueVersions.MorphoBlueREthEth_945]: MORPHO_BLUE_RETH_ETH_945(networkId),
  [MorphoBlueVersions.MorphoBlueSUSDeUSDC_915]: MORPHO_BLUE_SUSDE_USDC_915(networkId),

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
  [MorphoBlueVersions.MorphoBlueCbEthUSDC_860_Base_1c21c59d]: MORPHO_BLUE_CBETH_USDC_860_BASE_1c21c59d(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthUSDC_860_Base]: MORPHO_BLUE_WSTETH_USDC_860_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthUSDC_860_Base_13c42741]: MORPHO_BLUE_WSTETH_USDC_860_BASE_13c42741(networkId),
  [MorphoBlueVersions.MorphoBlueEthUSDC_860_Base]: MORPHO_BLUE_ETH_USDC_860_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueREthUSDC_860_Base]: MORPHO_BLUE_RETH_USDC_860_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueREthEth_945_Base]: MORPHO_BLUE_RETH_ETH_945_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueCbBTCEth_915_Base]: MORPHO_BLUE_CBBTC_ETH_915_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueCbBTCUSDC_860_Base]: MORPHO_BLUE_CBBTC_USDC_860_BASE(networkId),

  // wsuperOETHb/WETH Base
  [MorphoBlueVersions.MorphoBlueWsuperOETHbWETH_915_Base]: MORPHO_BLUE_WSUPEROETHB_WETH_915_BASE(networkId),

  // cbETH/WETH Base
  [MorphoBlueVersions.MorphoBlueCbEthEth_945_Base]: MORPHO_BLUE_CBETH_ETH_945_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueCbEthEth_965_Base]: MORPHO_BLUE_CBETH_ETH_965_BASE(networkId),

  // wstETH/WETH Base
  [MorphoBlueVersions.MorphoBlueWstEthEth_945_Base]: MORPHO_BLUE_WSTETH_ETH_945_BASE(networkId),
  [MorphoBlueVersions.MorphoBlueWstEthEth_965_Base]: MORPHO_BLUE_WSTETH_ETH_965_BASE(networkId),
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