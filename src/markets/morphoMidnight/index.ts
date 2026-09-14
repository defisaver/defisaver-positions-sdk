import {
  MorphoMidnightCollateralParams, MorphoMidnightMarketData, MorphoMidnightVersions, NetworkNumber,
} from '../../types';
import { ZERO_ADDRESS } from '../../constants';

/**
 * Morpho Midnight core contract, one per chain. Every Midnight market on a chain trades against its core,
 * whoever curates the order book — it is part of the market struct the id is hashed from, and it is what
 * offer tuples encode for `Midnight.take`. Listed at
 * https://docs.morpho.org/get-started/resources/addresses/.
 */
export const MIDNIGHT_BASE = '0xAdedD8ab6dE832766Fedf0FaC4992E5C4D3EA18A' as const;
export const MIDNIGHT_ETH = '0x471686c42792F93528B000beF54bC10E3aa2045f' as const;

export const midnightCoreAddress = (network: NetworkNumber) => (
  network === NetworkNumber.Eth ? MIDNIGHT_ETH : MIDNIGHT_BASE
);

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const WETH_BASE = '0x4200000000000000000000000000000000000006' as const;
const CBBTC_BASE = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as const;
const CBETH_BASE = '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' as const;

const USDC_ETH = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;
const WETH_ETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as const;
const WBTC_ETH = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as const;
const CBBTC_ETH = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as const;
const STRUSD_ETH = '0x280839980a7eD0D7717F64125fE241012E5F5815' as const;
const WSRUSD_ETH = '0xd3fD63209FA2D55B07A0f6db36C2f43900be3094' as const;
const USD3_ETH = '0x056B269Eb1f75477a8666ae8C7fE01b64dD55eCc' as const;
const REUSD_ETH = '0x5086bf358635B81D8C47C66d1C8b9E567Db70c72' as const;
const SIUSD_ETH = '0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB' as const;
const WSTETH_ETH = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as const;

// Tenor's ERC-4626 collateral vaults, one per pair and shared by that pair's whole maturity ladder. Each
// is a collateral of its markets on-chain without being an asset the app deals in — see the note above
// the Tenor markets below, and https://www.docs.tenor.finance/technical-docs/addresses/#vaults.
const TENOR_CBBTC_USDC_VAULT_BASE = '0xf6a70085b7f79FA76B04EbF7A2D7D87C3c5c04BC' as const;
const TENOR_WETH_USDC_VAULT_BASE = '0xe690a58EF52854513462745237F6A213a0d54dF1' as const;
const TENOR_CBETH_WETH_VAULT_BASE = '0xFa750DD0099eAdB72d401244De73ce7B89edf90F' as const;

const TENOR_WETH_USDC_VAULT_ETH = '0x7579a75658A7A0b7d277296dFaEecF4018746091' as const;
const TENOR_STRUSD_USDC_VAULT_ETH = '0xef6955d886fce26D87753dA45192eA50F59dc91c' as const;
const TENOR_WSRUSD_USDC_VAULT_ETH = '0x09409fa71bCfd3f433571dbeec0C0A9C19B0d30E' as const;
const TENOR_USD3_USDC_VAULT_ETH = '0x26C46ACb48B46cC99ccB3cf6C365BdaFa2556E80' as const;
const TENOR_REUSD_USDC_VAULT_ETH = '0xe3891d8cA7E00Bc42157D9bb5797C88D9159AAC6' as const;
const TENOR_SIUSD_USDC_VAULT_ETH = '0x226ecbf4755a5F81ed721E18c3fDA11f004Ea9e0' as const;
const TENOR_WSTETH_WETH_VAULT_ETH = '0xe1Bdb88eE5DBaCE653ecD2123E8396BB5BA8adc5' as const;


// Sourced from the official listing at https://markets.morpho.org/fixed/base

// BASE — USDC/cbBTC, 86% LLTV, monthly maturity ladder

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20260731 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20260731',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
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
  curator: 'Morpho',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20260828 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20260828',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
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
  curator: 'Morpho',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20260925 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20260925',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260925_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
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
  curator: 'Morpho',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261030 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20261030',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261030_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
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
  curator: 'Morpho',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261127 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20261127',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261127_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
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
  curator: 'Morpho',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261225 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20261225',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261225_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
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
  curator: 'Morpho',
});

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20270129 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  // This public term is also listed by Tenor, but has no Tenor curator vault and
  // therefore uses the same Morpho market ID as the generic market entry.
  chainIds: [NetworkNumber.Base],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url: 'cbbtc-usdc-20270129',
  value: MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20270129_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }],
  maturity: 1801234800, // 2027-01-29T15:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xfbbdc1b3e507fc738bca29973750ecb3f2357159191fa4d01f59cea1a895dcfd',
  protocolName: 'morpho-midnight',
  curator: 'Morpho',
});

// ── Tenor-curated ────────────────────────────────────────────────────────────────────────────────

// Tenor Midnight markets are the same structs as Morpho's (`MorphoMidnightMarketData`), on the same core
// contract; only the order book differs. Identify them on Morpho's `/v0/midnight/markets` by `market_id`
// = Tenor's `fixedMarketIdentifier`; they come back `listed: false`, meaning Tenor — not Morpho — serves
// the book.
//
// Every market below is verified by replaying `MidnightView.toId` over the struct these fields build:
// core address, maturity, rcfThreshold, loan token, gates and the whole ordered collateral set have to
// match or the hash does not come back as the recorded `marketId`. On-chain each market carries **two**
// collaterals — the pair's own token, and Tenor's ERC-4626 vault at 98% LLTV (the `metadata.vault` of the
// parent tenor market, listed at https://www.docs.tenor.finance/technical-docs/addresses/#vaults). The
// vault is not an asset the app deals in, so it carries `hidden: true`: everything that renders or prices
// a position skips it and sees a single-collateral market.
//
// It is only flagged, never dropped or reordered: the market id is the hash of the full struct, so a
// `Market` handed to the core has to carry the complete set in the chain's own order or the call
// addresses a market of its own making — which does not revert, because markets are permissionless. On
// Base the vault happens to come last every time; on mainnet the order varies per market, which is why
// the flag lives on the entry rather than in a second list. The take path builds no struct — offer
// tuples carry the market's full collateral set straight from the router's offer JSON.

export const MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20260827 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbBTC/USDC',
  shortLabel: 'Tenor cbBTC/USDC',
  url: 'tenor-cbbtc-usdc-20260827',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }, {
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
    hidden: true,
  }],
  maturity: 1787788800, // 2026-08-27T00:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x44495af1cca7842191a65a73978e01ed72238731e193c3b11460083efd60a318',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20260924 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbBTC/USDC',
  shortLabel: 'Tenor cbBTC/USDC',
  url: 'tenor-cbbtc-usdc-20260924',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260924_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }, {
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
    hidden: true,
  }],
  maturity: 1790208000, // 2026-09-24T00:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x99fbed74bc7cef3c90d68709d8de8f820261a45875ca197a0e65338affd09481',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20261022 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbBTC/USDC',
  shortLabel: 'Tenor cbBTC/USDC',
  url: 'tenor-cbbtc-usdc-20261022',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20261022_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }, {
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
    hidden: true,
  }],
  maturity: 1792627200, // 2026-10-22T00:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x2f4f088f20c0bebe6167f8c9d7aec11115c08eb73486b6f9642f7c7260d4d094',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20261119 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbBTC/USDC',
  shortLabel: 'Tenor cbBTC/USDC',
  url: 'tenor-cbbtc-usdc-20261119',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20261119_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }, {
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
    hidden: true,
  }],
  maturity: 1795046400, // 2026-11-19T00:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x776e8d667a394650c21615c9b5a9b5355f4aa777db3cebaebb057ffba588c7af',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20261217 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbBTC/USDC',
  shortLabel: 'Tenor cbBTC/USDC',
  url: 'tenor-cbbtc-usdc-20261217',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20261217_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: CBBTC_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }, {
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
    hidden: true,
  }],
  maturity: 1797465600, // 2026-12-17T00:00:00Z
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xd82863083585d715a2e0d8ed61e0e20e4f6c566171d3bfed513ad55797177b17',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20260827 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor WETH/USDC',
  shortLabel: 'Tenor WETH/USDC',
  url: 'tenor-weth-usdc-20260827',
  value: MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260827_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: WETH_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4',
  }, {
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
    hidden: true,
  }],
  maturity: 1787788800,
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xf27319855df886a604dda3d5675007f0aa6eee504c99f1d789c86b21075f7c20',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20260924 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor WETH/USDC',
  shortLabel: 'Tenor WETH/USDC',
  url: 'tenor-weth-usdc-20260924',
  value: MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260924_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: WETH_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4',
  }, {
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
    hidden: true,
  }],
  maturity: 1790208000,
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x9b7fed2a6b24c47b8995dfa4fb2b4bc87fe245c10fb842865e568611a96804aa',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261022 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor WETH/USDC',
  shortLabel: 'Tenor WETH/USDC',
  url: 'tenor-weth-usdc-20261022',
  value: MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261022_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: WETH_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4',
  }, {
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
    hidden: true,
  }],
  maturity: 1792627200,
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xfc2562129c7d538fcb6b2490d07aa5c69971d9d0b75e2f9bbf054ef99a311474',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261119 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor WETH/USDC',
  shortLabel: 'Tenor WETH/USDC',
  url: 'tenor-weth-usdc-20261119',
  value: MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261119_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: WETH_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4',
  }, {
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
    hidden: true,
  }],
  maturity: 1795046400,
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x8da96adc9a55288bda5f07eb062d501db04d0fa152dd0f78341f6232bc4f884d',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261217 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor WETH/USDC',
  shortLabel: 'Tenor WETH/USDC',
  url: 'tenor-weth-usdc-20261217',
  value: MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261217_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: WETH_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4',
  }, {
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
    hidden: true,
  }],
  maturity: 1797465600,
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x24684af2c2c9edaa0ab4472dd9b8cc238aa33b7cc8151ae02fe614536f91af86',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20260827 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbETH/WETH',
  shortLabel: 'Tenor cbETH/WETH',
  url: 'tenor-cbeth-weth-20260827',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260827_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: WETH_BASE,
  collaterals: [{
    token: CBETH_BASE,
    lltv: 0.945,
    liquidationCursor: '300000000000000000',
    oracle: '0xB03855Ad5AFD6B8db8091DD5551CAC4ed621d9E6',
  }, {
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
    hidden: true,
  }],
  maturity: 1787788800,
  rcfThreshold: '4000000000000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x13cdfedf56f731817322c6932b48f496da937c36a51c7178ac63ed915d02fc98',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20260924 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbETH/WETH',
  shortLabel: 'Tenor cbETH/WETH',
  url: 'tenor-cbeth-weth-20260924',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260924_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: WETH_BASE,
  collaterals: [{
    token: CBETH_BASE,
    lltv: 0.945,
    liquidationCursor: '300000000000000000',
    oracle: '0xB03855Ad5AFD6B8db8091DD5551CAC4ed621d9E6',
  }, {
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
    hidden: true,
  }],
  maturity: 1790208000,
  rcfThreshold: '4000000000000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x74e310372280cc5c648a1f185db1ee906d2985a7dab8119568a9213f083efec0',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261022 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbETH/WETH',
  shortLabel: 'Tenor cbETH/WETH',
  url: 'tenor-cbeth-weth-20261022',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261022_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: WETH_BASE,
  collaterals: [{
    token: CBETH_BASE,
    lltv: 0.945,
    liquidationCursor: '300000000000000000',
    oracle: '0xB03855Ad5AFD6B8db8091DD5551CAC4ed621d9E6',
  }, {
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
    hidden: true,
  }],
  maturity: 1792627200,
  rcfThreshold: '4000000000000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xcfce553a004af262e842c1b83cdfc01835bb83fbee7a8128f9b91663e2ebaf43',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261119 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbETH/WETH',
  shortLabel: 'Tenor cbETH/WETH',
  url: 'tenor-cbeth-weth-20261119',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261119_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: WETH_BASE,
  collaterals: [{
    token: CBETH_BASE,
    lltv: 0.945,
    liquidationCursor: '300000000000000000',
    oracle: '0xB03855Ad5AFD6B8db8091DD5551CAC4ed621d9E6',
  }, {
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
    hidden: true,
  }],
  maturity: 1795046400,
  rcfThreshold: '4000000000000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0xb1aa171a525fa9f3333ed47d816170930e9a1a83a1816a6b44ee0d89e1610691',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261217 = (networkId = NetworkNumber.Base): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbETH/WETH',
  shortLabel: 'Tenor cbETH/WETH',
  url: 'tenor-cbeth-weth-20261217',
  value: MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261217_Base,
  midnight: MIDNIGHT_BASE,
  loanToken: WETH_BASE,
  collaterals: [{
    token: CBETH_BASE,
    lltv: 0.945,
    liquidationCursor: '300000000000000000',
    oracle: '0xB03855Ad5AFD6B8db8091DD5551CAC4ed621d9E6',
  }, {
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
    hidden: true,
  }],
  maturity: 1797465600,
  rcfThreshold: '4000000000000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x001f992fd7dbc6f0fee600f1b1c627c4a7b6d70762043221a514b57f8df37cb7',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

// Tenor rolls the WETH/USDC and cbETH/WETH ladders monthly. These terms supersede the
// older Aug–Dec ladder in Tenor's UI, but remain distinct on-chain markets and order books.
const createTenorWethUsdcRollingMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor WETH/USDC',
  shortLabel: 'Tenor WETH/USDC',
  url,
  value,
  midnight: MIDNIGHT_BASE,
  loanToken: USDC_BASE,
  collaterals: [{
    token: WETH_BASE,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4',
  }, {
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
    hidden: true,
  }],
  maturity,
  rcfThreshold: '3000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

const createTenorCbEthWethRollingMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Tenor cbETH/WETH',
  shortLabel: 'Tenor cbETH/WETH',
  url,
  value,
  midnight: MIDNIGHT_BASE,
  loanToken: WETH_BASE,
  collaterals: [{
    token: CBETH_BASE,
    lltv: 0.945,
    liquidationCursor: '300000000000000000',
    oracle: '0xB03855Ad5AFD6B8db8091DD5551CAC4ed621d9E6',
  }, {
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
    hidden: true,
  }],
  maturity,
  rcfThreshold: '4000000000000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20260925 = () => createTenorWethUsdcRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260925_Base,
  'tenor-weth-usdc-20260925',
  1790348400,
  '0x436fa08b0c46b961d3021117919919d9224157f6a9efd8e371c04008feeb0597',
);
export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261030 = () => createTenorWethUsdcRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261030_Base,
  'tenor-weth-usdc-20261030',
  1793372400,
  '0x379ae30c5fcb8988c4aac92ddabb13e15c247dd0104157257e6ecf686b7a69dd',
);
export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261127 = () => createTenorWethUsdcRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261127_Base,
  'tenor-weth-usdc-20261127',
  1795791600,
  '0xb0513c347a3535d22afcbe697feb5790ab4254b4f885a6e9e77926682c6cc3f5',
);
export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261225 = () => createTenorWethUsdcRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261225_Base,
  'tenor-weth-usdc-20261225',
  1798210800,
  '0xdc209b64f909313bd3f54133ac5716a0a3ea03f7faa6332f75d906de16bd2893',
);
export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20270129 = () => createTenorWethUsdcRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20270129_Base,
  'tenor-weth-usdc-20270129',
  1801234800,
  '0x5f21188cf50dcd269250911a64824736d09770d56796cae432a529a679351475',
);

export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20260925 = () => createTenorCbEthWethRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260925_Base,
  'tenor-cbeth-weth-20260925',
  1790348400,
  '0x65db922379427ec777fc55650b8f6cc31ab3a3f2f86a9798fc898c81cf936e17',
);
export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261030 = () => createTenorCbEthWethRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261030_Base,
  'tenor-cbeth-weth-20261030',
  1793372400,
  '0xcdea4ca06837feca3026b23a95f0bd96c3eabdc77d1211472ce0346fcc200649',
);
export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261127 = () => createTenorCbEthWethRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261127_Base,
  'tenor-cbeth-weth-20261127',
  1795791600,
  '0xbb9ee13ffe52f4d52311775b1bd4fa309e402fd01ddfa165023c42dd6e5c051d',
);
export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261225 = () => createTenorCbEthWethRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261225_Base,
  'tenor-cbeth-weth-20261225',
  1798210800,
  '0x80530386795c88ba8c1ea6d686ae6168525c819ce4e0ea6017cb59afe34fb6d2',
);
export const MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20270129 = () => createTenorCbEthWethRollingMarket(
  MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20270129_Base,
  'tenor-cbeth-weth-20270129',
  1801234800,
  '0x3cfda244eeec7e5cda2a07ef23e2a5e3fe6ba17882417cafbf3f3c432377ff1d',
);

// ── ETHEREUM ─────────────────────────────────────────────────────────────────────────────────────

const createWBTCUsdcEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Morpho Midnight WBTC/USDC',
  shortLabel: 'WBTC/USDC',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: USDC_ETH,
  collaterals: [{
    token: WBTC_ETH,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xDddd770BADd886dF3864029e4B377B5F6a2B6b83',
  }, {
    token: USDC_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x8d1A84515B54C58bAc3b18315B6b1f17dA5cf6ca',
    hidden: true,
  }],
  maturity,
  rcfThreshold: '300000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Morpho',
});

const createCbBTCUsdcEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Morpho Midnight cbBTC/USDC',
  shortLabel: 'cbBTC/USDC',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: USDC_ETH,
  collaterals: [{
    token: USDC_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x8d1A84515B54C58bAc3b18315B6b1f17dA5cf6ca',
    hidden: true,
  }, {
    token: CBBTC_ETH,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0xA6D6950c9F177F1De7f7757FB33539e3Ec60182a',
  }],
  maturity,
  rcfThreshold: '300000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Morpho',
});

export const MORPHO_MIDNIGHT_WBTC_USDC_860_20260925_ETH = () => createWBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20260925_Eth,
  'wbtc-usdc-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0x6dae37424723dd8cef0da2db84fd2819f7dfa4e3a98e602ccc3c65ee1fac61c2',
);
export const MORPHO_MIDNIGHT_WBTC_USDC_860_20261030_ETH = () => createWBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20261030_Eth,
  'wbtc-usdc-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0xe5e6fbd5d81875dbfb0c94866cb0d300e1c7b9aacc0a458e63dccbcc0ce278c8',
);
export const MORPHO_MIDNIGHT_WBTC_USDC_860_20261127_ETH = () => createWBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20261127_Eth,
  'wbtc-usdc-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0xe0efc89dc1f747ba502f6a4100b6b1db9ebd0d57569fd5a54771d3a026b6a27b',
);
export const MORPHO_MIDNIGHT_WBTC_USDC_860_20261225_ETH = () => createWBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20261225_Eth,
  'wbtc-usdc-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0x3323abf2d2a3ec804f46552db920d900bb9c7ffd3f48143ab879a918fd6c0977',
);
export const MORPHO_MIDNIGHT_WBTC_USDC_860_20270129_ETH = () => createWBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20270129_Eth,
  'wbtc-usdc-20270129',
  1801234800, // 2027-01-29T15:00:00Z
  '0xf8052f557ce70d39cf9da1bd6e37e44a49f51757afb5dc881f675490ca6b3e9f',
);
export const MORPHO_MIDNIGHT_WBTC_USDC_860_20270226_ETH = () => createWBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20270226_Eth,
  'wbtc-usdc-20270226',
  1803654000, // 2027-02-26T15:00:00Z
  '0x7e399db474781e92b22b5a647d811959f65997b1e2bb68deaade674d8afbbdbd',
);
export const MORPHO_MIDNIGHT_WBTC_USDC_860_20270326_ETH = () => createWBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20270326_Eth,
  'wbtc-usdc-20270326',
  1806073200, // 2027-03-26T15:00:00Z
  '0x54a722a6dbaa237cfe088afd295417091bfb792fe3fac96999af41635977b2b0',
);

export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20260925_ETH = () => createCbBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260925_Eth,
  'cbbtc-usdc-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0x2a9ae59053a64e409e819d3b76750948e06065b3164278915eb80cb1b7474b65',
);
export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261030_ETH = () => createCbBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261030_Eth,
  'cbbtc-usdc-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0xeea94e3f7185bb8cfcdf41aca2c9776788e86d6c14de345b911b04f75cd49959',
);
export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261127_ETH = () => createCbBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261127_Eth,
  'cbbtc-usdc-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0xa6454499939a47927d3d27d65dce18486cc2aabbf75f8f5f8482e93567f4a183',
);
export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20261225_ETH = () => createCbBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261225_Eth,
  'cbbtc-usdc-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0xcf447db8cff164867b02edbf7ee7af06d241d4f3a44b34d6e3a3ea872ddea5d6',
);
export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20270129_ETH = () => createCbBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20270129_Eth,
  'cbbtc-usdc-20270129',
  1801234800, // 2027-01-29T15:00:00Z
  '0x9ea83106928cf45829a89c02cea7c73cb3a066d2429d7ca2fcdc0015dc191df1',
);
export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20270226_ETH = () => createCbBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20270226_Eth,
  'cbbtc-usdc-20270226',
  1803654000, // 2027-02-26T15:00:00Z
  '0xf9c1a9849863863a87600beb24394985a04ad3256b0c750baee0841f35f7f0e2',
);
export const MORPHO_MIDNIGHT_CBBTC_USDC_860_20270326_ETH = () => createCbBTCUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20270326_Eth,
  'cbbtc-usdc-20270326',
  1806073200, // 2027-03-26T15:00:00Z
  '0xb00767d2cc7d5d9e27501a14e7912a089e34da675a2eb9e030072233db2c4c3b',
);

// ETHEREUM — Tenor-curated, one rolling ladder per pair

const createTenorReUSDUsdcEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Tenor reUSD/USDC',
  shortLabel: 'Tenor reUSD/USDC',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: USDC_ETH,
  collaterals: [{
    token: REUSD_ETH,
    lltv: 0.915,
    liquidationCursor: '300000000000000000',
    oracle: '0xA66a4F03Fd8031973f8C7718904ce32385f54E70',
  }, {
    token: TENOR_REUSD_USDC_VAULT_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xE5f7f5A74E6f4dA2F68b1aa017F204a1883eC0df',
    hidden: true,
  }],
  maturity,
  rcfThreshold: '500000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_REUSD_USDC_915_20260925_ETH = () => createTenorReUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorReUSDUSDC_20260925_Eth,
  'tenor-reusd-usdc-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0xdba251b941d135577e1b423301b2eb6a76dfe11479c843185d20bee9208e7393',
);
export const MORPHO_MIDNIGHT_TENOR_REUSD_USDC_915_20261030_ETH = () => createTenorReUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorReUSDUSDC_20261030_Eth,
  'tenor-reusd-usdc-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0x0fdbbc14a6275905b3fc7372e7ce2828eafced9f2c3e442990682055839092c3',
);
export const MORPHO_MIDNIGHT_TENOR_REUSD_USDC_915_20261127_ETH = () => createTenorReUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorReUSDUSDC_20261127_Eth,
  'tenor-reusd-usdc-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0x1cf59f7382f72aee174e251ffaed5b8ada9e052da326fc3f32626bb52e126db6',
);
export const MORPHO_MIDNIGHT_TENOR_REUSD_USDC_915_20261225_ETH = () => createTenorReUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorReUSDUSDC_20261225_Eth,
  'tenor-reusd-usdc-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0xc78981202d07dae20266843ca668a20057beaafe3291b326529558227a03c9ad',
);

const createTenorSiUSDUsdcEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Tenor siUSD/USDC',
  shortLabel: 'Tenor siUSD/USDC',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: USDC_ETH,
  collaterals: [{
    token: TENOR_SIUSD_USDC_VAULT_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xE872d1d33b13B52aE7cD9A0CDD4102468350e5fa',
    hidden: true,
  }, {
    token: SIUSD_ETH,
    lltv: 0.915,
    liquidationCursor: '300000000000000000',
    oracle: '0xd2cC46b9B2D761502eF933320ecf0268EC0dfa6d',
  }],
  maturity,
  rcfThreshold: '500000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_SIUSD_USDC_915_20260925_ETH = () => createTenorSiUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorSiUSDUSDC_20260925_Eth,
  'tenor-siusd-usdc-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0x48d95ace842493ce2c1c474c0cb60ac208e9d8a714258e278af9c8ae01a88fa5',
);
export const MORPHO_MIDNIGHT_TENOR_SIUSD_USDC_915_20261030_ETH = () => createTenorSiUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorSiUSDUSDC_20261030_Eth,
  'tenor-siusd-usdc-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0x64985d39a1bae43d2741e7900cd42a2456dbacaee10e73f937abb1c9885d79da',
);
export const MORPHO_MIDNIGHT_TENOR_SIUSD_USDC_915_20261127_ETH = () => createTenorSiUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorSiUSDUSDC_20261127_Eth,
  'tenor-siusd-usdc-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0xed33721166c3f28bc834ce34135cf19b407056275eedf5faf662ccc7a821b7eb',
);
export const MORPHO_MIDNIGHT_TENOR_SIUSD_USDC_915_20261225_ETH = () => createTenorSiUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorSiUSDUSDC_20261225_Eth,
  'tenor-siusd-usdc-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0xe47e71bd0faf8383881b81b7d781ab93bf7bd4d4dc44c9c40add360841e5b26d',
);

const createTenorStrUSDUsdcEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Tenor strUSD/USDC',
  shortLabel: 'Tenor strUSD/USDC',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: USDC_ETH,
  collaterals: [{
    token: STRUSD_ETH,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x1506c98cE61aC63c8438B710C054a51c5dD9A6A4',
  }, {
    token: TENOR_STRUSD_USDC_VAULT_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x361904890a43d4af2D1b8cF642A6C5e661Da5641',
    hidden: true,
  }],
  maturity,
  rcfThreshold: '300000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_STRUSD_USDC_860_20260925_ETH = () => createTenorStrUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorStrUSDUSDC_20260925_Eth,
  'tenor-strusd-usdc-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0xa46399e45fe90b7d3c0488c4c73e9b361f758c4481734832a43d764ccdde0c64',
);
export const MORPHO_MIDNIGHT_TENOR_STRUSD_USDC_860_20261030_ETH = () => createTenorStrUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorStrUSDUSDC_20261030_Eth,
  'tenor-strusd-usdc-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0xe473f755d4bd358a676d9385036d8a9e28b64aac250d0959d56d935bed80d675',
);
export const MORPHO_MIDNIGHT_TENOR_STRUSD_USDC_860_20261127_ETH = () => createTenorStrUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorStrUSDUSDC_20261127_Eth,
  'tenor-strusd-usdc-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0x41d4f364feb13ead0b892b252eeb3636969de96a5be843400c86835aa98b1d67',
);
export const MORPHO_MIDNIGHT_TENOR_STRUSD_USDC_860_20261225_ETH = () => createTenorStrUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorStrUSDUSDC_20261225_Eth,
  'tenor-strusd-usdc-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0x91e872193d98f3452424b5dd05e15ac291ed38236af5ff9ff02371bb8efbedb7',
);

const createTenorUSD3UsdcEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Tenor USD3/USDC',
  shortLabel: 'Tenor USD3/USDC',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: USDC_ETH,
  collaterals: [{
    token: USD3_ETH,
    lltv: 0.915,
    liquidationCursor: '300000000000000000',
    oracle: '0x68b4c2B2b2e245AB54a3bD55DfD5A9d84f029C06',
  }, {
    token: TENOR_USD3_USDC_VAULT_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x2C198EC459e0a035078565dEdc3c206604b57d4D',
    hidden: true,
  }],
  maturity,
  rcfThreshold: '500000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_USD3_USDC_915_20260925_ETH = () => createTenorUSD3UsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorUSD3USDC_20260925_Eth,
  'tenor-usd3-usdc-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0x1edea0a3875af341ea885fc7eac7e02bfce90c534a1602dbd40fefccfe4c24d4',
);
export const MORPHO_MIDNIGHT_TENOR_USD3_USDC_915_20261030_ETH = () => createTenorUSD3UsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorUSD3USDC_20261030_Eth,
  'tenor-usd3-usdc-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0x11c6795118a68a7bf5d8995240614454291a698ac387aa6c0e23db46ec5112ed',
);
export const MORPHO_MIDNIGHT_TENOR_USD3_USDC_915_20261127_ETH = () => createTenorUSD3UsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorUSD3USDC_20261127_Eth,
  'tenor-usd3-usdc-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0x72ee2771278a1d78e7970a60dc1723c95e16a4384893b044cdbd707347f1abf6',
);
export const MORPHO_MIDNIGHT_TENOR_USD3_USDC_915_20261225_ETH = () => createTenorUSD3UsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorUSD3USDC_20261225_Eth,
  'tenor-usd3-usdc-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0x2a6b8c5d4fc953e0f747590267d7b4018f35246ba0fdbf8adbc269a2491bdde1',
);

const createTenorWETHUsdcEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Tenor WETH/USDC',
  shortLabel: 'Tenor WETH/USDC',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: USDC_ETH,
  collaterals: [{
    token: TENOR_WETH_USDC_VAULT_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x5c4fd2864C21F0b81730B4EC74030130aA2193Ca',
    hidden: true,
  }, {
    token: WETH_ETH,
    lltv: 0.86,
    liquidationCursor: '300000000000000000',
    oracle: '0x0F948CBa8231Db7898ef36A4212581Ad7b1B4580',
  }],
  maturity,
  rcfThreshold: '300000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20260925_ETH = () => createTenorWETHUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260925_Eth,
  'tenor-weth-usdc-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0x6a463fa464b97f7ba86516be7de82761bfa411522701ede713a269c2c385c70a',
);
export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261030_ETH = () => createTenorWETHUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261030_Eth,
  'tenor-weth-usdc-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0xbd6a19559ca14acff13ac124ac0302c0ce6c41ff6a34841242752601e8b0e42c',
);
export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261127_ETH = () => createTenorWETHUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261127_Eth,
  'tenor-weth-usdc-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0x348fb368e0f88eb63e739c6753bb0fbf306fb269a8dc0585542a6e4be5c63d6c',
);
export const MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261225_ETH = () => createTenorWETHUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261225_Eth,
  'tenor-weth-usdc-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0xbe554be39e1df0ac1e8287d78ec8de26f0ea6197c6797bdeaed5350f45ae5b9f',
);

const createTenorWsrUSDUsdcEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Tenor wsrUSD/USDC',
  shortLabel: 'Tenor wsrUSD/USDC',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: USDC_ETH,
  collaterals: [{
    token: TENOR_WSRUSD_USDC_VAULT_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x7C997e4dddF1D4B7C0D5f290B92d0909ba227c14',
    hidden: true,
  }, {
    token: WSRUSD_ETH,
    lltv: 0.945,
    liquidationCursor: '300000000000000000',
    oracle: '0x938D2eDb20425cF80F008E7ec314Eb456940Da15',
  }],
  maturity,
  rcfThreshold: '700000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WSRUSD_USDC_945_20260925_ETH = () => createTenorWsrUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWsrUSDUSDC_20260925_Eth,
  'tenor-wsrusd-usdc-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0xc028a0b50ba0c606fbf83e5620018f23019b1fb5d1d15b4a5a0d17cc72edcfeb',
);
export const MORPHO_MIDNIGHT_TENOR_WSRUSD_USDC_945_20261030_ETH = () => createTenorWsrUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWsrUSDUSDC_20261030_Eth,
  'tenor-wsrusd-usdc-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0xc6079abce78d158671adedd6778c55edb786f4e4bc7097a59e7fb56e9ddda1b9',
);
export const MORPHO_MIDNIGHT_TENOR_WSRUSD_USDC_945_20261127_ETH = () => createTenorWsrUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWsrUSDUSDC_20261127_Eth,
  'tenor-wsrusd-usdc-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0x8d4dafdceb706a31e06fba2946e5e12ac9656f98ba430eeb695b553333d78640',
);
export const MORPHO_MIDNIGHT_TENOR_WSRUSD_USDC_945_20261225_ETH = () => createTenorWsrUSDUsdcEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWsrUSDUSDC_20261225_Eth,
  'tenor-wsrusd-usdc-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0x02763ffcac291ea4b16ed0b3e3e524ee9aa07248a6e4ea6613e3724b54cce116',
);

const createTenorWstETHWethEthMarket = (
  value: MorphoMidnightVersions,
  url: string,
  maturity: number,
  marketId: string,
): MorphoMidnightMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Tenor wstETH/WETH',
  shortLabel: 'Tenor wstETH/WETH',
  url,
  value,
  midnight: MIDNIGHT_ETH,
  loanToken: WETH_ETH,
  collaterals: [{
    token: WSTETH_ETH,
    lltv: 0.965,
    liquidationCursor: '300000000000000000',
    oracle: '0xbD60A6770b27E084E8617335ddE769241B0e71D8',
  }, {
    token: TENOR_WSTETH_WETH_VAULT_ETH,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4eA702113EFAE91B906fC9eC1415dd7a9B860c89',
    hidden: true,
  }],
  maturity,
  rcfThreshold: '600000000000000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId,
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MORPHO_MIDNIGHT_TENOR_WSTETH_WETH_965_20260925_ETH = () => createTenorWstETHWethEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWstETHWETH_20260925_Eth,
  'tenor-wsteth-weth-20260925',
  1790348400, // 2026-09-25T15:00:00Z
  '0x9ac6a639ace1c291b68b212eb1a95fd080332793f7bfc7dbed58b92bc518ca70',
);
export const MORPHO_MIDNIGHT_TENOR_WSTETH_WETH_965_20261030_ETH = () => createTenorWstETHWethEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWstETHWETH_20261030_Eth,
  'tenor-wsteth-weth-20261030',
  1793372400, // 2026-10-30T15:00:00Z
  '0xf032c0184869e9b856b20cdcc298a1ebbec2cd4ee86e6189ff94852fa368a1b3',
);
export const MORPHO_MIDNIGHT_TENOR_WSTETH_WETH_965_20261127_ETH = () => createTenorWstETHWethEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWstETHWETH_20261127_Eth,
  'tenor-wsteth-weth-20261127',
  1795791600, // 2026-11-27T15:00:00Z
  '0x0cc2301b2247d109d5a05d7a95012077cbdf9908f9f72f315de601c1f7b438f9',
);
export const MORPHO_MIDNIGHT_TENOR_WSTETH_WETH_965_20261225_ETH = () => createTenorWstETHWethEthMarket(
  MorphoMidnightVersions.MorphoMidnightTenorWstETHWETH_20261225_Eth,
  'tenor-wsteth-weth-20261225',
  1798210800, // 2026-12-25T15:00:00Z
  '0x646f7959780a1555f7696aad335a197fe45710f73f0bcf70f26712923249af4b',
);

/**
 * Collaterals we deliberately do not list. Their markets are defined and verified above — they are real
 * markets — but withheld from the map below, so nothing in the app offers, prices or routes to them.
 */
const EXCLUDED_COLLATERALS: string[] = [STRUSD_ETH, WSRUSD_ETH, REUSD_ETH, SIUSD_ETH, USD3_ETH];

const isExcludedMarket = (market: MorphoMidnightMarketData): boolean => market.collaterals.some(
  (collateral) => !collateral.hidden
    && EXCLUDED_COLLATERALS.some((token) => token.toLowerCase() === collateral.token.toLowerCase()),
);

const allMorphoMidnightMarkets = (networkId: NetworkNumber) => ({
  // BASE — Morpho-curated
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260731(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260828(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260925_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260925(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261030_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261030(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261127_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261127(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261225_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261225(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20270129_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20270129(networkId),
  // BASE — Tenor-curated
  [MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base]: MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20260827(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260924_Base]: MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20260924(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20261022_Base]: MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20261022(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20261119_Base]: MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20261119(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20261217_Base]: MORPHO_MIDNIGHT_TENOR_CBBTC_USDC_860_20261217(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260827_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20260827(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260924_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20260924(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261022_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261022(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261119_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261119(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261217_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261217(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260925_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20260925(),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261030_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261030(),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261127_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261127(),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261225_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261225(),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20270129_Base]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20270129(),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260827_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20260827(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260924_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20260924(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261022_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261022(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261119_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261119(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261217_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261217(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260925_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20260925(),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261030_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261030(),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261127_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261127(),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261225_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261225(),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20270129_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20270129(),
  // ETHEREUM — Morpho-curated
  [MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20260925_Eth]: MORPHO_MIDNIGHT_WBTC_USDC_860_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20261030_Eth]: MORPHO_MIDNIGHT_WBTC_USDC_860_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20261127_Eth]: MORPHO_MIDNIGHT_WBTC_USDC_860_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20261225_Eth]: MORPHO_MIDNIGHT_WBTC_USDC_860_20261225_ETH(),
  [MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20270129_Eth]: MORPHO_MIDNIGHT_WBTC_USDC_860_20270129_ETH(),
  [MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20270226_Eth]: MORPHO_MIDNIGHT_WBTC_USDC_860_20270226_ETH(),
  [MorphoMidnightVersions.MorphoMidnightWBTCUSDC_860_20270326_Eth]: MORPHO_MIDNIGHT_WBTC_USDC_860_20270326_ETH(),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260925_Eth]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261030_Eth]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261127_Eth]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261225_Eth]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261225_ETH(),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20270129_Eth]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20270129_ETH(),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20270226_Eth]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20270226_ETH(),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20270326_Eth]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20270326_ETH(),
  // ETHEREUM — Tenor-curated
  [MorphoMidnightVersions.MorphoMidnightTenorReUSDUSDC_20260925_Eth]: MORPHO_MIDNIGHT_TENOR_REUSD_USDC_915_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorReUSDUSDC_20261030_Eth]: MORPHO_MIDNIGHT_TENOR_REUSD_USDC_915_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorReUSDUSDC_20261127_Eth]: MORPHO_MIDNIGHT_TENOR_REUSD_USDC_915_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorReUSDUSDC_20261225_Eth]: MORPHO_MIDNIGHT_TENOR_REUSD_USDC_915_20261225_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorSiUSDUSDC_20260925_Eth]: MORPHO_MIDNIGHT_TENOR_SIUSD_USDC_915_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorSiUSDUSDC_20261030_Eth]: MORPHO_MIDNIGHT_TENOR_SIUSD_USDC_915_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorSiUSDUSDC_20261127_Eth]: MORPHO_MIDNIGHT_TENOR_SIUSD_USDC_915_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorSiUSDUSDC_20261225_Eth]: MORPHO_MIDNIGHT_TENOR_SIUSD_USDC_915_20261225_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorStrUSDUSDC_20260925_Eth]: MORPHO_MIDNIGHT_TENOR_STRUSD_USDC_860_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorStrUSDUSDC_20261030_Eth]: MORPHO_MIDNIGHT_TENOR_STRUSD_USDC_860_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorStrUSDUSDC_20261127_Eth]: MORPHO_MIDNIGHT_TENOR_STRUSD_USDC_860_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorStrUSDUSDC_20261225_Eth]: MORPHO_MIDNIGHT_TENOR_STRUSD_USDC_860_20261225_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorUSD3USDC_20260925_Eth]: MORPHO_MIDNIGHT_TENOR_USD3_USDC_915_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorUSD3USDC_20261030_Eth]: MORPHO_MIDNIGHT_TENOR_USD3_USDC_915_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorUSD3USDC_20261127_Eth]: MORPHO_MIDNIGHT_TENOR_USD3_USDC_915_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorUSD3USDC_20261225_Eth]: MORPHO_MIDNIGHT_TENOR_USD3_USDC_915_20261225_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260925_Eth]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261030_Eth]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261127_Eth]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261225_Eth]: MORPHO_MIDNIGHT_TENOR_WETH_USDC_860_20261225_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWsrUSDUSDC_20260925_Eth]: MORPHO_MIDNIGHT_TENOR_WSRUSD_USDC_945_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWsrUSDUSDC_20261030_Eth]: MORPHO_MIDNIGHT_TENOR_WSRUSD_USDC_945_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWsrUSDUSDC_20261127_Eth]: MORPHO_MIDNIGHT_TENOR_WSRUSD_USDC_945_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWsrUSDUSDC_20261225_Eth]: MORPHO_MIDNIGHT_TENOR_WSRUSD_USDC_945_20261225_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWstETHWETH_20260925_Eth]: MORPHO_MIDNIGHT_TENOR_WSTETH_WETH_965_20260925_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWstETHWETH_20261030_Eth]: MORPHO_MIDNIGHT_TENOR_WSTETH_WETH_965_20261030_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWstETHWETH_20261127_Eth]: MORPHO_MIDNIGHT_TENOR_WSTETH_WETH_965_20261127_ETH(),
  [MorphoMidnightVersions.MorphoMidnightTenorWstETHWETH_20261225_Eth]: MORPHO_MIDNIGHT_TENOR_WSTETH_WETH_965_20261225_ETH(),
}) as const;

export const MorphoMidnightMarkets = (networkId: NetworkNumber) => {
  const all = allMorphoMidnightMarkets(networkId);
  if (!EXCLUDED_COLLATERALS.length) return all;
  return Object.fromEntries(
    Object.entries(all).filter(([, market]) => !isExcludedMarket(market)),
  ) as typeof all;
};

const TENOR_MARKET_IDS = new Set(
  Object.values(MorphoMidnightMarkets(NetworkNumber.Base))
    .filter((market) => market.curator === 'Tenor')
    .map((market) => market.marketId.toLowerCase()),
);

export const isTenorMidnightMarket = (market: Pick<MorphoMidnightMarketData, 'curator'> | string): boolean => (
  typeof market === 'string'
    ? TENOR_MARKET_IDS.has(market.toLowerCase())
    : market.curator === 'Tenor'
);

export const findMorphoMidnightMarket = (marketId: string, network?: NetworkNumber): MorphoMidnightMarketData | undefined => (
  Object.values(MorphoMidnightMarkets(network ?? NetworkNumber.Base))
    .find((market) => market.marketId.toLowerCase() === marketId.toLowerCase()
      && (network === undefined || market.chainIds.includes(network)))
);

export const morphoMidnightMarketCollateralParams = (
  market: Pick<MorphoMidnightMarketData, 'collaterals'>,
): MorphoMidnightCollateralParams[] => market.collaterals.map(({
  token, lltv, liquidationCursor, oracle,
}) => ({
  token, lltv, liquidationCursor, oracle,
}));

export const morphoMidnightVisibleCollaterals = (
  market: Pick<MorphoMidnightMarketData, 'collaterals'>,
): MorphoMidnightCollateralParams[] => market.collaterals.filter((collateral) => !collateral.hidden);
