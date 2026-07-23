import { MorphoMidnightMarketData, MorphoMidnightVersions, NetworkNumber } from '../../types';

// Morpho Midnight core contract on Base (same for every market).
const MIDNIGHT_BASE = '0xAdedD8ab6dE832766Fedf0FaC4992E5C4D3EA18A';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Curated Morpho Midnight markets. Each market is fixed-term: it is uniquely identified on-chain by
// `marketId` (bytes32), derived from the static struct below via MidnightView.toId. Because markets
// churn as maturities roll, this list is hand-maintained for the pairs/maturities the app supports.
// Sourced from the official listing at https://markets.morpho.org/fixed/base (see its sitemap.xml) —
// currently a single USDC/cbBTC pair offered on a monthly maturity ladder; new maturities are added
// there progressively. Every `marketId` here is verified against MidnightView.toId(marketStruct) in
// tests/morphoMidnight.ts.

// BASE — USDC/cbBTC, 86% LLTV, monthly maturity ladder

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

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20260828 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20260828',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  collaterals: [{
    token: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }],
  maturity: 1787929200, // 2026-08-28T15:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x05959752fdeff325962b9d263edb421efc6e2186a49360dba6c32e86ebf6c84c',
  protocolName: 'morpho-midnight',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20260925 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20260925',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260925_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  collaterals: [{
    token: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }],
  maturity: 1790348400, // 2026-09-25T15:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x549cd072daf99328554f3a6d2d4d6f4a07f1c59369e891e6391946f9cf75f221',
  protocolName: 'morpho-midnight',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261030 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20261030',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261030_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  collaterals: [{
    token: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }],
  maturity: 1793372400, // 2026-10-30T15:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x43d6120738c57b2bc5835901f8250fdf7fc8054efbb006c6ccba61ec898e5ed9',
  protocolName: 'morpho-midnight',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261127 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20261127',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261127_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  collaterals: [{
    token: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }],
  maturity: 1795791600, // 2026-11-27T15:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xe1878eec035b601f301484e63a49a428f8e008e2bf57a2fd88a3fc3a4c1b1acd',
  protocolName: 'morpho-midnight',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261225 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20261225',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261225_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  collaterals: [{
    token: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }],
  maturity: 1798210800, // 2026-12-25T15:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x9593c3a6dba45b6106af8dc8b45ba8c505d90d3d68a3d33f7c278dd921b637da',
  protocolName: 'morpho-midnight',
});

export const MorphoMidnightMarkets = (networkId: NetworkNumber) => ({
  // BASE
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260731(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260828(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260925_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260925(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261030_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261030(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261127_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261127(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261225_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261225(networkId),
}) as const;

export const findMorphoMidnightMarket = (marketId: string, network: NetworkNumber = NetworkNumber.Base): MorphoMidnightMarketData | undefined => Object.values(MorphoMidnightMarkets(network)).find(
  (market) => market.marketId.toLowerCase() === marketId.toLowerCase(),
);
