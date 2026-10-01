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
 * SparkView.getSafetyRatioWithLtvZeroFallback deployed by the BE team. As a calibration we also
 * print our `ratio` against the old on-chain getSafetyRatio — note the on-chain ratios floor at
 * 100% (availableBorrows is clamped to 0), while ours don't, so only the fallback is asserted and
 * only for wallets whose fallback sits above that floor.
 * Run: `npx mocha tests/ltv0FallbackSpark.ts` (needs RPC in .env).
 */

// SparkView (mainnet v1.0.7) exposing getSafetyRatioWithLtvZeroFallback(market, user).
const VIEW_ADDR = '0x834e866B3A33a4b186e80FB8aD36d27961C0024E';
const NETWORK = NetworkNumber.Eth;
const RPC_KEY = 'RPC';

const VIEW_ABI = parseAbi([
  'function getSafetyRatio(address _market, address _user) view returns (uint256)',
  'function getSafetyRatioWithLtvZeroFallback(address _market, address _user) view returns (uint256)',
]);

// Wallets to validate — add/replace freely. These must be the address that OWNS the Spark position
// (the DSProxy / Safe smart wallet, or the EOA for EOA positions). The defaults are public positions
// holding LTV-0 collateral (rETH / sDAI / tBTC after Spark offboarded them) WITH debt, picked so the
// on-chain fallback sits above the 100% floor and stays comparable to our un-floored value.
const WALLETS = [
  '0xb179a578d90973F9ac0942AB3205a32d40F54240', // rETH coll, on-chain safety floored at 100%, fallback ~285%
  '0x256578ad7743FB8b1b43C2CCb33E148878d172A2', // sDAI coll, safety ~173% vs fallback ~182% (no flooring on either)
  '0xbF5Ef36C55b69a7DDfa5966F55df26870702E6e6', // tBTC coll, safety floored at 100%, fallback ~137%
  '0x28a55C4b4f9615FDE3CDAdDf6cc01FcF2E38A6b0', // mixed coll incl. rETH, safety ~605% vs fallback ~631%
];

const TOLERANCE_PCT = 1; // allow up to 1% relative diff (price/block jitter between the two reads)

// SparkView safety ratios are wads where 1e18 === 100%, so /1e16 yields a percentage.
const wadToPct = (wad: bigint) => new Dec(wad.toString()).div(new Dec(10).pow(16));
const relDiffPct = (a: Dec, b: Dec) => (a.eq(0) ? (b.eq(0) ? new Dec(0) : new Dec(100)) : a.minus(b).abs().div(a).mul(100));

describe('Spark — LTV-0 safety ratio: off-chain (SDK) vs on-chain (SparkView)', () => {
  let provider: EthereumProvider;
  let market: any;
  let marketData: any;

  before(async function () {
    this.timeout(300000);
    provider = getProvider(RPC_KEY);
    market = (sdk.markets.SparkMarkets(NETWORK) as any)[sdk.SparkVersions.SparkV1];
    marketData = await sdk.spark.getSparkMarketsData(provider, NETWORK, market);
  });

  for (const wallet of WALLETS) {
    it(`fallback matches on-chain — ${wallet}`, async function () {
      this.timeout(300000);
      const user = wallet as `0x${string}`;

      const pos = await sdk.spark.getSparkAccountData(provider, NETWORK, user, {
        selectedMarket: market, assetsData: marketData.assetsData, eModeCategoriesData: marketData.eModeCategoriesData,
      });

      const supplied = +pos.suppliedUsd;
      const borrowed = +pos.borrowedUsd;
      const ltv0Collateral = (Object.values(pos.usedAssets) as any[])
        .filter((a) => a.isSupplied && a.collateral && marketData.assetsData[a.symbol]?.collateralFactor === '0')
        .map((a) => a.symbol);

      console.log(`\n${wallet}`);
      console.log(`   supplied $${supplied.toFixed(2)}   borrowed $${borrowed.toFixed(2)}   LTV-0 collateral: ${ltv0Collateral.length ? ltv0Collateral.join(', ') : '(none)'}`);

      if (!(borrowed > 0)) {
        console.log('   no debt — fallback == ratio, nothing to compare (position likely closed; replace the wallet)');
        return;
      }

      const client = getViemProvider(provider, NETWORK);
      const [onSafety, onFb] = await Promise.all([
        client.readContract({ address: VIEW_ADDR, abi: VIEW_ABI, functionName: 'getSafetyRatio', args: [market.providerAddress, user] }),
        client.readContract({ address: VIEW_ADDR, abi: VIEW_ABI, functionName: 'getSafetyRatioWithLtvZeroFallback', args: [market.providerAddress, user] }),
      ]) as [bigint, bigint];

      const onSafetyPct = wadToPct(onSafety);
      const onFbPct = wadToPct(onFb);
      const ourRatio = new Dec(pos.ratio);
      const ourFb = new Dec(pos.safetyRatioWithLtvZeroFallback || pos.ratio);
      const baseDiff = relDiffPct(ourRatio, onSafetyPct);
      const fbDiff = relDiffPct(ourFb, onFbPct);

      console.log(`   base ratio     — ours ${ourRatio.toDP(2)}%   on-chain getSafetyRatio ${onSafetyPct.toDP(2)}%   diff ${baseDiff.toDP(3)}% (informational: on-chain floors at 100%)`);
      console.log(`   LTV-0 fallback — ours ${ourFb.toDP(2)}%   on-chain fallback ${onFbPct.toDP(2)}%   diff ${fbDiff.toDP(3)}%`);

      if (onFbPct.eq(100) && ourFb.lt(100)) {
        console.log('   on-chain fallback sits at the 100% floor — skipping the assert for this wallet');
        return;
      }
      assert.ok(fbDiff.lte(TOLERANCE_PCT), `fallback off by ${fbDiff.toDP(3)}% (ours ${ourFb.toDP(2)}% vs on-chain ${onFbPct.toDP(2)}%)`);
    });
  }
});
