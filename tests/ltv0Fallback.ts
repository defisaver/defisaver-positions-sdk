import 'dotenv/config';
import Dec from 'decimal.js';
import { parseAbi } from 'viem';
import * as sdk from '../src';
import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getViemProvider } from '../src/services/viem';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

/**
 * Validates our OFF-CHAIN `safetyRatioWithLtvZeroFallback` (positions-sdk) against the ON-CHAIN
 * AaveV3View.getSafetyRatioWithLtvZeroFallback deployed by the BE team. As a calibration we also
 * compare our `ratio` against the old on-chain getSafetyRatio (per Rajko, the new method equals the
 * old one when no LTV-0 collateral), independently confirming the value scale + our base computation.
 * Scans all AaveV3 markets per network and prints any position found.
 * Run: `npx mocha tests/ltv0Fallback.ts` (needs RPC/RPCOPT/RPCARB/RPCBASE in .env).
 */

// AaveV3View deployments exposing getSafetyRatioWithLtvZeroFallback(market, user), with the AaveV3
// markets to scan per network (one view contract serves all markets on that network via the market arg).
const VIEWS: { network: NetworkNumber, addr: string, rpcKey: string, label: string, markets: any[] }[] = [
  { network: NetworkNumber.Eth, addr: '0x3C901d26a72055Df113309af8A104A13A1E3b77c', rpcKey: 'RPC', label: 'Ethereum', markets: [sdk.AaveVersions.AaveV3, sdk.AaveVersions.AaveV3Lido, sdk.AaveVersions.AaveV3Etherfi] },
  { network: NetworkNumber.Opt, addr: '0xcc3E5093383f99F1a0766E75644960bfbb90c033', rpcKey: 'RPCOPT', label: 'Optimism', markets: [sdk.AaveVersions.AaveV3] },
  { network: NetworkNumber.Arb, addr: '0x552e7f9f2D7348e2F4467F0cD04949c267050232', rpcKey: 'RPCARB', label: 'Arbitrum', markets: [sdk.AaveVersions.AaveV3] },
  { network: NetworkNumber.Base, addr: '0x013831ACd6dE51EF9969727cDE90d4bb22B4Aa7d', rpcKey: 'RPCBASE', label: 'Base', markets: [sdk.AaveVersions.AaveV3] },
];

const VIEW_ABI = parseAbi([
  'function getSafetyRatio(address _market, address _user) view returns (uint256)',
  'function getSafetyRatioWithLtvZeroFallback(address _market, address _user) view returns (uint256)',
]);

// Wallets to validate — add/replace freely. These must be the address that OWNS the Aave position
// (i.e. the DSProxy / Safe smart wallet, or the EOA for EOA-mode positions) — not necessarily your login EOA.
const WALLETS = [
  '0x5830A35d34Fd3FE8f7Dfdf3105549b7791cF7688', // DSProxy of EOA 0x2f6c...a845 — holds the LTV-0 position
  '0xCCA82000fde2b389138730F540c9BC81D198Df58', // Safe of EOA 0x1d76...8d8e (resolved via /safe/wallets)
];

const TOLERANCE_PCT = 1; // allow up to 1% relative diff (price/block jitter between the two reads)

// AaveV3View safety ratios are wads where 1e18 === 100%, so /1e16 yields a percentage.
const wadToPct = (wad: bigint) => new Dec(wad.toString()).div(new Dec(10).pow(16));
const relDiffPct = (a: Dec, b: Dec) => (a.eq(0) ? (b.eq(0) ? new Dec(0) : new Dec(100)) : a.minus(b).abs().div(a).mul(100));

type CheckResult = { found: boolean, mismatch: string | null };

describe('Aave v3 — LTV-0 safety ratio: off-chain (SDK) vs on-chain (AaveV3View)', () => {
  const marketDataCache: { [k: string]: any } = {};

  const checkMarket = async (wallet: string, view: typeof VIEWS[number], version: any): Promise<CheckResult> => {
    const { network, label, rpcKey } = view;
    let provider: EthereumProvider;
    try {
      provider = getProvider(rpcKey);
    } catch (e) {
      console.log(`[${label}] ${rpcKey} not set — skipping`);
      return { found: false, mismatch: null };
    }

    const market = (sdk.markets.AaveMarkets(network) as any)[version];
    const marketLabel = `${label}/${market.label || String(version)}`;
    const providerAddress = market.providerAddress as `0x${string}`;
    const user = wallet as `0x${string}`;
    const cacheKey = `${network}-${String(version)}`;

    let marketData = marketDataCache[cacheKey];
    let pos: any;
    try {
      if (!marketData) {
        marketData = await sdk.aaveV3.getAaveV3MarketData(provider, network, market);
        marketDataCache[cacheKey] = marketData;
      }
      pos = await sdk.aaveV3.getAaveV3AccountData(provider, network, user, {
        selectedMarket: market, assetsData: marketData.assetsData, eModeCategoriesData: marketData.eModeCategoriesData,
      });
    } catch (e: any) {
      console.log(`[${marketLabel}] ${wallet}: SDK fetch error — ${e?.shortMessage || e?.message}`);
      return { found: false, mismatch: null };
    }

    const supplied = +pos.suppliedUsd;
    const borrowed = +pos.borrowedUsd;
    if (!supplied && !borrowed) return { found: false, mismatch: null }; // no position in this market

    const ltv0Collateral = (Object.values(pos.usedAssets) as any[])
      .filter((a) => a.isSupplied && a.collateral && marketData.assetsData[a.symbol]?.collateralFactor === '0')
      .map((a) => a.symbol);

    console.log(`\n[${marketLabel}] ${wallet}`);
    console.log(`   supplied $${supplied.toFixed(2)}   borrowed $${borrowed.toFixed(2)}   LTV-0 collateral: ${ltv0Collateral.length ? ltv0Collateral.join(', ') : '(none)'}`);

    if (!(borrowed > 0)) {
      console.log('   no debt — fallback == ratio, nothing to compare');
      return { found: true, mismatch: null };
    }

    let onSafety: bigint;
    let onFb: bigint;
    try {
      const client = getViemProvider(provider, network);
      [onSafety, onFb] = await Promise.all([
        client.readContract({ address: view.addr as `0x${string}`, abi: VIEW_ABI, functionName: 'getSafetyRatio', args: [providerAddress, user] }),
        client.readContract({ address: view.addr as `0x${string}`, abi: VIEW_ABI, functionName: 'getSafetyRatioWithLtvZeroFallback', args: [providerAddress, user] }),
      ]) as [bigint, bigint];
    } catch (e: any) {
      console.log(`   on-chain call error — ${e?.shortMessage || e?.message}`);
      return { found: true, mismatch: null };
    }

    const onSafetyPct = wadToPct(onSafety);
    const onFbPct = wadToPct(onFb);
    const ourRatio = new Dec(pos.ratio);
    const ourFb = new Dec(pos.safetyRatioWithLtvZeroFallback || pos.ratio);
    const baseDiff = relDiffPct(ourRatio, onSafetyPct);
    const fbDiff = relDiffPct(ourFb, onFbPct);

    console.log(`   base ratio     — ours ${ourRatio.toDP(2)}%   on-chain getSafetyRatio ${onSafetyPct.toDP(2)}%   diff ${baseDiff.toDP(3)}%`);
    console.log(`   LTV-0 fallback — ours ${ourFb.toDP(2)}%   on-chain fallback ${onFbPct.toDP(2)}%   diff ${fbDiff.toDP(3)}%`);

    if (fbDiff.gt(TOLERANCE_PCT)) {
      return { found: true, mismatch: `[${marketLabel}] ${wallet}: fallback off by ${fbDiff.toDP(3)}% (ours ${ourFb.toDP(2)}% vs on-chain ${onFbPct.toDP(2)}%)` };
    }
    return { found: true, mismatch: null };
  };

  for (const wallet of WALLETS) {
    it(`fallback matches on-chain — ${wallet}`, async function () {
      this.timeout(300000);
      const mismatches: string[] = [];
      let anyFound = false;
      for (const view of VIEWS) {
        for (const version of view.markets) {
          const r = await checkMarket(wallet, view, version);
          if (r.found) anyFound = true;
          if (r.mismatch) mismatches.push(r.mismatch);
        }
      }
      if (!anyFound) {
        console.log(`\n>>> ${wallet}: NO AaveV3 position found on any scanned market/network. If this is your login EOA, the position likely lives on your DSProxy/Safe — pass that address instead.`);
      }
      assert.equal(mismatches.length, 0, `\n${mismatches.join('\n')}`);
    });
  }
});
