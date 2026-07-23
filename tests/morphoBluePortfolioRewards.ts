import {
  addMorphoBlueRewardsToMarketInfo,
  getMorphoBluePositionDataWithMarketInfo,
  getMorphoEarnDataWithMarketInfo,
} from '../src/morphoBlue';
import {
  IncentiveKind,
  LeverageType,
  MorphoBlueMarketInfo,
  MorphoBlueOracleType,
  MorphoBluePositionData,
} from '../src/types';

const { assert } = require('chai');

const marketInfo: MorphoBlueMarketInfo = {
  id: 'market-id',
  fee: '0',
  loanToken: 'USDC',
  collateralToken: 'WETH',
  utillization: '0.5',
  oracle: '2000',
  oracleType: MorphoBlueOracleType.MARKET_RATE,
  lltv: '0.86',
  minRatio: '116.27',
  assetsData: {
    USDC: {
      symbol: 'USDC',
      address: '0xloan',
      price: '1',
      supplyRate: '2',
      borrowRate: '4',
      supplyIncentives: [
        {
          token: 'SPK', apy: '1', incentiveKind: IncentiveKind.Reward, description: 'Existing reward',
        },
        {
          token: 'MORPHO', apy: '99', incentiveKind: IncentiveKind.Reward, description: 'Stale reward',
        },
      ],
      borrowIncentives: [],
    },
    WETH: {
      symbol: 'WETH',
      address: '0xcollateral',
      price: '2000',
      supplyRate: '0',
      borrowRate: '0',
      supplyIncentives: [],
      borrowIncentives: [],
    },
  },
};

const positionData = {
  usedAssets: {
    USDC: {
      symbol: 'USDC',
      supplied: '100',
      borrowed: '0',
      isSupplied: true,
      isBorrowed: false,
      collateral: false,
      suppliedUsd: '100',
      borrowedUsd: '0',
    },
    WETH: {
      symbol: 'WETH',
      supplied: '1',
      borrowed: '0',
      isSupplied: true,
      isBorrowed: false,
      collateral: true,
      suppliedUsd: '2000',
      borrowedUsd: '0',
    },
  },
  supplyShares: '100',
  borrowShares: '0',
  leveragedType: LeverageType.None,
} as unknown as MorphoBluePositionData;

describe('Morpho Blue portfolio rewards enrichment', () => {
  it('replaces only MORPHO incentives without mutating base market data', () => {
    const enriched = addMorphoBlueRewardsToMarketInfo(marketInfo, {
      supplyApy: '3',
      borrowApy: '4',
    });

    assert.deepEqual(marketInfo.assetsData.USDC.supplyIncentives.map(({ token, apy }) => [token, apy]), [
      ['SPK', '1'],
      ['MORPHO', '99'],
    ]);
    assert.deepEqual(enriched.assetsData.USDC.supplyIncentives.map(({ token, apy }) => [token, apy]), [
      ['SPK', '1'],
      ['MORPHO', '3'],
    ]);
    assert.deepEqual(enriched.assetsData.USDC.borrowIncentives.map(({ token, apy }) => [token, apy]), [
      ['MORPHO', '4'],
    ]);
  });

  it('recalculates lending and earn APY as pure transformations', () => {
    const enrichedMarket = addMorphoBlueRewardsToMarketInfo(marketInfo, {
      supplyApy: '3',
      borrowApy: '4',
    });
    const enrichedPosition = getMorphoBluePositionDataWithMarketInfo(positionData, enrichedMarket);
    const earnData = { apy: '0', amount: '100', amountUsd: '100' };
    const enrichedEarn = getMorphoEarnDataWithMarketInfo(earnData, enrichedMarket);

    assert.notEqual(enrichedPosition, positionData);
    assert.notEqual(enrichedPosition.netApy, undefined);
    assert.equal(earnData.apy, '0');
    assert.notEqual(enrichedEarn.apy, '0');
  });
});
