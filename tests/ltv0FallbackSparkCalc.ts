import { sparkGetAggregatedPositionData, sparkGetUserReserveLtvAndLltv } from '../src/helpers/sparkHelpers';

const { assert } = require('chai');

/**
 * Pure (no-RPC) tests for the Spark LTV-0 safety-ratio fallback math, mirroring
 * SparkRatioHelper.getSafetyRatioWithLtvZeroFallback: LTV-0 collateral is credited at LLTV - 5%
 * (floored at 0), where LTV-0 means the RESERVE ltv is zeroed (offboarding) — even inside the
 * active eMode category, where the LLTV used is the eMode liquidation threshold.
 * Run: `npx mocha tests/ltv0FallbackSparkCalc.ts`.
 */

// Reserve configs modeled on Spark mainnet after the offboardings: sDAI/GNO ltv 0 with a real
// liquidation threshold, DAI ltv 0 with a 1bp threshold (below the 5% offset), rETH ltv 0 while
// still part of the ETH eMode category.
const assetsData: any = {
  ETH: {
    symbol: 'ETH', collateralFactor: '0.8', liquidationRatio: '0.85', price: '4000', supplyRate: '0', borrowRate: '0', eModeCategory: 1,
  },
  wstETH: {
    symbol: 'wstETH', collateralFactor: '0.75', liquidationRatio: '0.8', price: '4800', supplyRate: '0', borrowRate: '0', eModeCategory: 1,
  },
  rETH: {
    symbol: 'rETH', collateralFactor: '0', liquidationRatio: '0.7', price: '4400', supplyRate: '0', borrowRate: '0', eModeCategory: 1,
  },
  sDAI: {
    symbol: 'sDAI', collateralFactor: '0', liquidationRatio: '0.8', price: '1.1', supplyRate: '0', borrowRate: '0', eModeCategory: 0,
  },
  DAI: {
    symbol: 'DAI', collateralFactor: '0', liquidationRatio: '0.0001', price: '1', supplyRate: '0', borrowRate: '0', eModeCategory: 0,
  },
};

const eModeCategoriesData: any = {
  1: {
    id: 1,
    label: 'ETH',
    collateralAssets: ['ETH', 'wstETH', 'rETH'],
    borrowAssets: ['ETH'],
    collateralFactor: '0.9',
    liquidationRatio: '0.93',
    liquidationBonus: '0.01',
    ltvZeroAssets: [],
  },
};

const usedAsset = (over: any) => ({
  isSupplied: false,
  isBorrowed: false,
  collateral: false,
  supplied: '0',
  suppliedUsd: '0',
  borrowed: '0',
  borrowedUsd: '0',
  ...over,
});

const aggregate = (usedAssets: any, eModeCategory = 0) => sparkGetAggregatedPositionData({
  usedAssets, eModeCategory, eModeCategoriesData, assetsData, selectedMarket: {} as any, network: 1,
} as any);

describe('Spark LTV-0 fallback — sparkGetUserReserveLtvAndLltv', () => {
  const data = (eModeCategory: number): any => ({
    usedAssets: {}, eModeCategory, eModeCategoriesData, assetsData,
  });

  it('returns reserve ltv/lltv outside eMode', () => {
    assert.deepEqual(sparkGetUserReserveLtvAndLltv(data(0), 'ETH'), { ltv: '0.8', lltv: '0.85' });
  });

  it('returns ltv 0 with reserve lltv for an offboarded reserve outside eMode', () => {
    assert.deepEqual(sparkGetUserReserveLtvAndLltv(data(0), 'sDAI'), { ltv: '0', lltv: '0.8' });
  });

  it('returns eMode ltv/lltv for a category member', () => {
    assert.deepEqual(sparkGetUserReserveLtvAndLltv(data(1), 'ETH'), { ltv: '0.9', lltv: '0.93' });
  });

  it('falls back to reserve props for a non-member while eMode is active', () => {
    assert.deepEqual(sparkGetUserReserveLtvAndLltv(data(1), 'sDAI'), { ltv: '0', lltv: '0.8' });
  });

  it('keeps ltv 0 but the eMode lltv for an offboarded category member', () => {
    assert.deepEqual(sparkGetUserReserveLtvAndLltv(data(1), 'rETH'), { ltv: '0', lltv: '0.93' });
  });
});

describe('Spark LTV-0 fallback — sparkGetAggregatedPositionData.safetyRatioWithLtvZeroFallback', () => {
  it('equals the regular ratio when no collateral is LTV-0', () => {
    const pos = aggregate({
      ETH: usedAsset({
        symbol: 'ETH', isSupplied: true, collateral: true, supplied: '2.5', suppliedUsd: '10000',
      }),
      DAI: usedAsset({ symbol: 'DAI', isBorrowed: true, borrowed: '4000', borrowedUsd: '4000' }),
    });
    assert.equal(pos.ratio, '200');
    assert.equal(pos.safetyRatioWithLtvZeroFallback, '200');
  });

  it('credits LTV-0 collateral at lltv - 5% while the regular ratio collapses to 0', () => {
    const pos = aggregate({
      sDAI: usedAsset({
        symbol: 'sDAI', isSupplied: true, collateral: true, supplied: '9090', suppliedUsd: '10000',
      }),
      DAI: usedAsset({ symbol: 'DAI', isBorrowed: true, borrowed: '4000', borrowedUsd: '4000' }),
    });
    assert.equal(pos.ratio, '0');
    // 10000 * (0.8 - 0.05) / 4000 * 100
    assert.equal(pos.safetyRatioWithLtvZeroFallback, '187.5');
  });

  it('sums regular and LTV-0-credited collateral in a mixed position', () => {
    const pos = aggregate({
      ETH: usedAsset({
        symbol: 'ETH', isSupplied: true, collateral: true, supplied: '2.5', suppliedUsd: '10000',
      }),
      sDAI: usedAsset({
        symbol: 'sDAI', isSupplied: true, collateral: true, supplied: '9090', suppliedUsd: '10000',
      }),
      DAI: usedAsset({ symbol: 'DAI', isBorrowed: true, borrowed: '8000', borrowedUsd: '8000' }),
    });
    assert.equal(pos.ratio, '100');
    // (10000 * 0.8 + 10000 * 0.75) / 8000 * 100
    assert.equal(pos.safetyRatioWithLtvZeroFallback, '193.75');
  });

  it('credits nothing when the lltv is at or below the 5% offset', () => {
    const pos = aggregate({
      DAI: usedAsset({
        symbol: 'DAI', isSupplied: true, collateral: true, supplied: '10000', suppliedUsd: '10000',
      }),
      ETH: usedAsset({ symbol: 'ETH', isBorrowed: true, borrowed: '0.5', borrowedUsd: '2000' }),
    });
    assert.equal(pos.ratio, '0');
    assert.equal(pos.safetyRatioWithLtvZeroFallback, '0');
  });

  it('uses the eMode lltv for an offboarded eMode member, not the eMode ltv', () => {
    const pos = aggregate({
      rETH: usedAsset({
        symbol: 'rETH', isSupplied: true, collateral: true, supplied: '2.27', suppliedUsd: '10000',
      }),
      DAI: usedAsset({ symbol: 'DAI', isBorrowed: true, borrowed: '2000', borrowedUsd: '2000' }),
    }, 1);
    // Displayed borrow-power ratio still credits the category-wide eMode ltv (0.9) — protocol behavior —
    // while the bots' fallback credits eMode lltv - 5% (0.93 - 0.05).
    assert.equal(pos.ratio, '450');
    assert.equal(pos.safetyRatioWithLtvZeroFallback, '440');
  });

  it('mirrors the regular ratio for debt-free and empty positions', () => {
    const noDebt = aggregate({
      ETH: usedAsset({
        symbol: 'ETH', isSupplied: true, collateral: true, supplied: '2.5', suppliedUsd: '10000',
      }),
    });
    assert.equal(noDebt.safetyRatioWithLtvZeroFallback, noDebt.ratio);

    const empty = aggregate({});
    assert.equal(empty.ratio, '0');
    assert.equal(empty.safetyRatioWithLtvZeroFallback, '0');
  });
});
