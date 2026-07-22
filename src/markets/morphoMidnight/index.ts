import { MorphoMidnightMarketData, MorphoMidnightVersions, NetworkNumber } from '../../types';

// Morpho Midnight core contract on Base (same for every market).
const MIDNIGHT_BASE = '0xAdedD8ab6dE832766Fedf0FaC4992E5C4D3EA18A';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Curated Morpho Midnight markets. Each market is fixed-term: it is uniquely identified on-chain by
// `marketId` (bytes32), derived from the static struct below via MidnightView.toId. Because markets
// churn as maturities roll, this list is hand-maintained for the pairs/maturities the app supports.
// Every `marketId` here is verified against MidnightView.toId(marketStruct) in tests/morphoMidnight.ts.

// BASE

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20260731 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20260731',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  collaterals: [{
    token: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }],
  maturity: 1785510000, // 2026-07-31T15:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x168e31250e0008b50d2255a5ab85e0265acd6c12e4f9a1336134b36a65a47937',
  protocolName: 'morpho-midnight',
});

export const MORPHO_MIDNIGHT_WETH_USDC_860_20260731 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight WETH/USDC',
  shortLabel: 'WETH/USDC',
  url: 'weth-usdc-20260731',
  value: MorphoMidnightVersions.MorphoMidnightWETHUSDC_860_20260731_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  collaterals: [{
    token: '0x4200000000000000000000000000000000000006', // WETH
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4',
  }],
  maturity: 1785510000, // 2026-07-31T15:00:00Z
  rcfThreshold: '0',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xc32232fc088a7f35bd0e089fa6c16dc40fd75a0d83f843ba6e998b6795b3fe2e',
  protocolName: 'morpho-midnight',
});

export const MORPHO_MIDNIGHT_WETH_CBBTC_860_20270527 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight WETH/cbBTC',
  shortLabel: 'WETH/cbBTC',
  url: 'weth-cbbtc-20270527',
  value: MorphoMidnightVersions.MorphoMidnightWETHCbBTC_860_20270527_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
  collaterals: [{
    token: '0x4200000000000000000000000000000000000006', // WETH
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x05D2618404668D725B66c0f32B39e4EC15B393dC',
  }],
  maturity: 1811376000, // 2027-05-27T00:00:00Z
  rcfThreshold: '0',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x922dcfd5cabfdc93fed481e68829f97d22f16126fa469139a546b331c77a0011',
  protocolName: 'morpho-midnight',
});

export const MORPHO_MIDNIGHT_WETH_CBBTC_860_20270617 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight WETH/cbBTC',
  shortLabel: 'WETH/cbBTC',
  url: 'weth-cbbtc-20270617',
  value: MorphoMidnightVersions.MorphoMidnightWETHCbBTC_860_20270617_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
  collaterals: [{
    token: '0x4200000000000000000000000000000000000006', // WETH
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x05D2618404668D725B66c0f32B39e4EC15B393dC',
  }],
  maturity: 1813190400, // 2027-06-17T00:00:00Z
  rcfThreshold: '0',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xd25a2ed4ef19c61c4d106516ad1b156744b97380feb0236c616bab0034c56d91',
  protocolName: 'morpho-midnight',
});

export const MorphoMidnightMarkets = (networkId: NetworkNumber) => ({
  // BASE
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260731(networkId),
  [MorphoMidnightVersions.MorphoMidnightWETHUSDC_860_20260731_Base]: MORPHO_MIDNIGHT_WETH_USDC_860_20260731(networkId),
  [MorphoMidnightVersions.MorphoMidnightWETHCbBTC_860_20270527_Base]: MORPHO_MIDNIGHT_WETH_CBBTC_860_20270527(networkId),
  [MorphoMidnightVersions.MorphoMidnightWETHCbBTC_860_20270617_Base]: MORPHO_MIDNIGHT_WETH_CBBTC_860_20270617(networkId),
}) as const;

export const findMorphoMidnightMarket = (marketId: string, network: NetworkNumber = NetworkNumber.Base): MorphoMidnightMarketData | undefined => Object.values(MorphoMidnightMarkets(network)).find(
  (market) => market.marketId.toLowerCase() === marketId.toLowerCase(),
);
