import {
  MorphoMidnightCollateralParams, MorphoMidnightMarketData, MorphoMidnightVersions, NetworkNumber,
} from '../../types';
import { ZERO_ADDRESS } from '../../constants';

/**
 * Morpho Midnight core contract on Base. Every Midnight market trades against this one, whoever curates
 * its order book — it is part of the market struct the id is hashed from, and it is what offer tuples
 * encode for `Midnight.take`.
 */
export const MIDNIGHT_BASE = '0xAdedD8ab6dE832766Fedf0FaC4992E5C4D3EA18A' as const;

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const WETH_BASE = '0x4200000000000000000000000000000000000006' as const;
const CBBTC_BASE = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as const;
const CBETH_BASE = '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' as const;

// Tenor's ERC-4626 collateral vaults, one per pair and shared by that pair's whole maturity ladder. Each
// is a collateral of its markets on-chain without being an asset the app deals in — see the note above
// the Tenor markets below, and https://www.docs.tenor.finance/technical-docs/addresses/#vaults.
const TENOR_CBBTC_USDC_VAULT_BASE = '0xf6a70085b7f79FA76B04EbF7A2D7D87C3c5c04BC' as const;
const TENOR_WETH_USDC_VAULT_BASE = '0xe690a58EF52854513462745237F6A213a0d54dF1' as const;
const TENOR_CBETH_WETH_VAULT_BASE = '0xFa750DD0099eAdB72d401244De73ce7B89edf90F' as const;


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

// ── Tenor-curated ────────────────────────────────────────────────────────────────────────────────

// Tenor Midnight markets are the same structs as Morpho's (`MorphoMidnightMarketData`), on the same core
// contract; only the order book differs. Identify them on Morpho's `/v0/midnight/markets` by `market_id`
// = Tenor's `fixedMarketIdentifier`; they come back `listed: false`, meaning Tenor — not Morpho — serves
// the book.
//
// Every market below is verified against `MidnightView.toMarket(marketId)` on Base: core address,
// maturity, rcfThreshold, loan token, gates and collaterals all match. On-chain each market carries **two**
// collaterals — the pair's own token at index 0, and Tenor's ERC-4626 vault at index 1 (98% LLTV; the
// `metadata.vault` of the parent tenor market, listed at
// https://www.docs.tenor.finance/technical-docs/addresses/#vaults). The vault is not an asset the app
// deals in, so it is split out into `hiddenCollaterals` instead of `collaterals`: everything that renders
// or prices a position sees a single-collateral market, and because the vault stays the *suffix* of the
// set, the SDK's positional `prices[i]` / `collateral[i]` reads stay aligned with `collaterals`.
//
// It is only split out, never dropped: the market id is the hash of the full struct, so a `Market` handed
// to the core has to be `[...collaterals, ...hiddenCollaterals]` or the call addresses a market of its own
// making. The take path builds no struct — offer tuples carry the market's full collateral set straight
// from the router's offer JSON.

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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBBTC_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x4a24e4bf269cE26aAD2dF00437e7730d25FCdE26',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_WETH_USDC_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0x784519B1b59A1e1498f077066bB9336672bcc3EE',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
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
  }],
  hiddenCollaterals: [{
    token: TENOR_CBETH_WETH_VAULT_BASE,
    lltv: 0.98,
    liquidationCursor: '300000000000000000',
    oracle: '0xa02f629871be35d6db0F88C944cF955554Ec87c0',
  }],
  maturity: 1797465600,
  rcfThreshold: '4000000000000000000',
  enterGate: ZERO_ADDRESS,
  liquidatorGate: ZERO_ADDRESS,
  marketId: '0x001f992fd7dbc6f0fee600f1b1c627c4a7b6d70762043221a514b57f8df37cb7',
  protocolName: 'morpho-midnight',
  curator: 'Tenor',
});

export const MorphoMidnightMarkets = (networkId: NetworkNumber) => ({
  // BASE — Morpho-curated
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260731(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260828(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260925_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20260925(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261030_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261030(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261127_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261127(networkId),
  [MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20261225_Base]: MORPHO_MIDNIGHT_CBBTC_USDC_860_20261225(networkId),
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
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260827_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20260827(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260924_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20260924(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261022_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261022(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261119_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261119(networkId),
  [MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261217_Base]: MORPHO_MIDNIGHT_TENOR_CBETH_WETH_945_20261217(networkId),
}) as const;

// Which markets Tenor's router quotes, by id, for the quote helpers that only receive one.
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

export const findMorphoMidnightMarket = (marketId: string, network: NetworkNumber = NetworkNumber.Base): MorphoMidnightMarketData | undefined => Object.values(MorphoMidnightMarkets(network)).find(
  (market) => market.marketId.toLowerCase() === marketId.toLowerCase(),
);

/**
 * The market's collateral set as the chain knows it: the listed collaterals followed by the curator's
 * hidden ones. This — not `collaterals` — is what a `Market` struct takes, since the market id is the hash
 * of that struct. Anything assembling one for a contract call goes through here so it can't quietly build
 * a market of its own instead.
 */
export const morphoMidnightMarketCollateralParams = (
  market: Pick<MorphoMidnightMarketData, 'collaterals' | 'hiddenCollaterals'>,
): MorphoMidnightCollateralParams[] => [...market.collaterals, ...(market.hiddenCollaterals || [])];
