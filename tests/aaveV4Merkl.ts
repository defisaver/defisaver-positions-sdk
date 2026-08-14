import { getAssetInfo } from '@defisaver/tokens';
import { attachAaveV4MerklIncentives, buildAaveV4MerklRewardMap } from '../src/aaveV4/merkl';
import { calculateNetApyAaveV4, getAaveV4ApplicableIncentives } from '../src/helpers/aaveV4Helpers';
import {
  AAVE_V4_BLUECHIP_SPOKE,
  AAVE_V4_MAIN_SPOKE,
  AAVE_V4_PAXOS_HUB,
  AAVE_V4_PRIME_HUB,
  AAVE_V4_USDG_PENDLE_SPOKE,
} from '../src/markets/aaveV4';
import { aprToApy } from '../src/moneymarket';
import {
  AaveV4AssetsData,
  AaveV4ReserveAssetData,
  AaveV4UsedReserveAssets,
  EthAddress,
  IncentiveKind,
  IncentiveSide,
  MerklOpportunity,
  NetworkNumber,
  OpportunityAction,
  OpportunityStatus,
} from '../src/types';

const { assert } = require('chai');

const BLUECHIP_SPOKE = AAVE_V4_BLUECHIP_SPOKE(NetworkNumber.Eth).address;
const USDG_PENDLE_SPOKE = AAVE_V4_USDG_PENDLE_SPOKE(NetworkNumber.Eth).address;
const MAIN_SPOKE = AAVE_V4_MAIN_SPOKE(NetworkNumber.Eth).address;
const PRIME_HUB = AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address;
const PAXOS_HUB = AAVE_V4_PAXOS_HUB(NetworkNumber.Eth).address;
const USDC = getAssetInfo('USDC').address as EthAddress;
const WBTC = getAssetInfo('WBTC').address as EthAddress;
const USDG = getAssetInfo('USDG').address as EthAddress;

// The live campaigns from DEV-13263 / DEV-13284
const SPOKE_CAMPAIGN_APR = 2.0075355051683546;
const HUB_CAMPAIGN_APR = 2;

const opportunity = (over: Partial<MerklOpportunity>): MerklOpportunity => ({
  chainId: 1,
  type: 'AAVE_V4_SPOKE_BORROW',
  status: OpportunityStatus.LIVE,
  action: OpportunityAction.BORROW,
  apr: 2,
  tokens: [{ address: USDC, symbol: 'USDC' }],
  ...over,
} as unknown as MerklOpportunity);

// Merkl lists the same USDC borrow reward twice: once scoped to the Bluechip Spoke, once to the Prime Hub
const campaigns = buildAaveV4MerklRewardMap([
  opportunity({ type: 'AAVE_V4_SPOKE_BORROW', explorerAddress: BLUECHIP_SPOKE, apr: SPOKE_CAMPAIGN_APR }),
  opportunity({ type: 'AAVE_V4_HUB_BORROW', explorerAddress: PRIME_HUB, apr: HUB_CAMPAIGN_APR }),
], NetworkNumber.Eth);

const reserve = (over: Partial<AaveV4ReserveAssetData>): AaveV4ReserveAssetData => ({
  symbol: 'USDC',
  underlying: USDC,
  hub: PRIME_HUB,
  supplyIncentives: [],
  borrowIncentives: [],
  supplyRate: '0',
  drawnRate: '0',
  collateralRisk: 0,
  collateralFactor: 0,
  ...over,
} as unknown as AaveV4ReserveAssetData);

describe('Aave V4 Merkl campaign matching', () => {
  it('attaches a spoke campaign only to reserves of that spoke', () => {
    const onBluechip = attachAaveV4MerklIncentives(reserve({}), BLUECHIP_SPOKE, campaigns);
    assert.lengthOf(onBluechip.spokeBorrowIncentives!, 1);
    assert.equal(onBluechip.spokeBorrowIncentives![0].apy, aprToApy(SPOKE_CAMPAIGN_APR));

    const onPendle = attachAaveV4MerklIncentives(reserve({ hub: PAXOS_HUB }), USDG_PENDLE_SPOKE, campaigns);
    assert.lengthOf(onPendle.spokeBorrowIncentives!, 0);
  });

  it('attaches a hub campaign only to reserves of that hub (DEV-13284)', () => {
    const onPrime = attachAaveV4MerklIncentives(reserve({ hub: PRIME_HUB }), MAIN_SPOKE, campaigns);
    assert.lengthOf(onPrime.hubBorrowIncentives!, 1);

    // USDC borrowed from the Paxos Hub must not inherit the Prime Hub reward
    const onPaxos = attachAaveV4MerklIncentives(reserve({ hub: PAXOS_HUB }), USDG_PENDLE_SPOKE, campaigns);
    assert.lengthOf(onPaxos.hubBorrowIncentives!, 0);
  });

  it('matches addresses regardless of casing', () => {
    const lowercased = attachAaveV4MerklIncentives(
      reserve({ hub: PRIME_HUB.toLowerCase() as AaveV4ReserveAssetData['hub'] }),
      BLUECHIP_SPOKE.toLowerCase(),
      campaigns,
    );
    assert.lengthOf(lowercased.spokeBorrowIncentives!, 1);
    assert.lengthOf(lowercased.hubBorrowIncentives!, 1);
  });

  it('ignores campaigns without an explorerAddress', () => {
    const withoutScope = buildAaveV4MerklRewardMap([
      opportunity({ type: 'AAVE_V4_HUB_BORROW', explorerAddress: undefined }),
    ], NetworkNumber.Eth);
    assert.isEmpty(withoutScope.hub);
  });
});

describe('Aave V4 applicable incentives', () => {
  it('counts the same reward stream listed at both scopes only once (DEV-13263)', () => {
    const enriched = attachAaveV4MerklIncentives(reserve({}), BLUECHIP_SPOKE, campaigns);
    const applicable = getAaveV4ApplicableIncentives(enriched, IncentiveSide.Borrow);
    assert.lengthOf(applicable, 1);
    assert.equal(applicable[0].apy, aprToApy(SPOKE_CAMPAIGN_APR));
  });

  it('applies the hub reward when no spoke campaign exists', () => {
    const enriched = attachAaveV4MerklIncentives(reserve({}), MAIN_SPOKE, campaigns);
    const applicable = getAaveV4ApplicableIncentives(enriched, IncentiveSide.Borrow);
    assert.lengthOf(applicable, 1);
    assert.equal(applicable[0].apy, aprToApy(HUB_CAMPAIGN_APR));
  });

  it('keeps intrinsic incentives alongside the Merkl reward', () => {
    const staking = {
      apy: '-3', token: 'weETH', incentiveKind: IncentiveKind.Staking, description: '',
    };
    const enriched = attachAaveV4MerklIncentives(reserve({ borrowIncentives: [staking] }), BLUECHIP_SPOKE, campaigns);
    const applicable = getAaveV4ApplicableIncentives(enriched, IncentiveSide.Borrow);
    assert.lengthOf(applicable, 2);
    assert.deepEqual(applicable[0], staking);
  });
});

describe('Aave V4 net APY with Merkl incentives', () => {
  // The DEV-13263 position: 2.15 WBTC ($137,885) supplied at 0%, 98,615 USDC ($98,601)
  // borrowed at ~4.005% APY on the Bluechip Spoke from the Prime Hub, no risk premium.
  const wbtcReserve = reserve({ symbol: 'WBTC', underlying: WBTC, collateralFactor: 0.845 });
  const usdcReserve = reserve({ drawnRate: '0.0392695' });

  const assetsData = {
    'WBTC-0': attachAaveV4MerklIncentives(wbtcReserve, BLUECHIP_SPOKE, campaigns),
    'USDC-1': attachAaveV4MerklIncentives(usdcReserve, BLUECHIP_SPOKE, campaigns),
  } as unknown as AaveV4AssetsData;

  const usedAssets = {
    'WBTC-0': {
      symbol: 'WBTC', reserveId: 0, isSupplied: true, isBorrowed: false, collateral: true, collateralFactor: 0.845, suppliedUsd: '137885', borrowedUsd: '0',
    },
    'USDC-1': {
      symbol: 'USDC', reserveId: 1, isSupplied: false, isBorrowed: true, collateral: false, collateralFactor: 0, suppliedUsd: '0', borrowedUsd: '98601',
    },
  } as unknown as AaveV4UsedReserveAssets;

  it('does not flip a clearly negative position positive by double-counting the borrow reward', () => {
    const { netApy, totalInterestUsd, incentiveUsd } = calculateNetApyAaveV4({ usedAssets, assetsData });

    // one ~2.03% reward on $98,601, not two (broken math yielded ~$3,991 and a +$42 total)
    assert.approximately(+incentiveUsd, 1999.7, 5);
    assert.isBelow(+totalInterestUsd, 0);
    assert.approximately(+totalInterestUsd, -1949, 10);
    assert.approximately(+netApy, -4.96, 0.05);
  });

  // The DEV-13284 position: $979,667 PT USDG (intrinsic ~3.05% incentive) supplied on the USDG
  // Pendle Spoke, $895,130 USDC borrowed at ~2.33% from the Paxos Hub — the Prime Hub USDC
  // campaign must not inflate its net APY (broken matching showed 31.98% instead of ~10.6%).
  it('does not apply another hub\'s reward to the borrowed asset', () => {
    const ptUsdgReserve = reserve({
      symbol: 'PT USDG',
      underlying: USDG,
      hub: PAXOS_HUB,
      collateralFactor: 0.94,
      supplyIncentives: [{
        apy: '3.05', token: 'PT USDG', incentiveKind: IncentiveKind.Staking, description: '',
      }],
    });
    const usdcFromPaxos = reserve({ hub: PAXOS_HUB, drawnRate: '0.023032' });

    const pendleAssetsData = {
      'PT USDG-0': attachAaveV4MerklIncentives(ptUsdgReserve, USDG_PENDLE_SPOKE, campaigns),
      'USDC-1': attachAaveV4MerklIncentives(usdcFromPaxos, USDG_PENDLE_SPOKE, campaigns),
    } as unknown as AaveV4AssetsData;

    const pendleUsedAssets = {
      'PT USDG-0': {
        symbol: 'PT USDG', reserveId: 0, isSupplied: true, isBorrowed: false, collateral: true, collateralFactor: 0.94, suppliedUsd: '979667', borrowedUsd: '0',
      },
      'USDC-1': {
        symbol: 'USDC', reserveId: 1, isSupplied: false, isBorrowed: true, collateral: false, collateralFactor: 0, suppliedUsd: '0', borrowedUsd: '895130',
      },
    } as unknown as AaveV4UsedReserveAssets;

    const { netApy, incentiveUsd } = calculateNetApyAaveV4({ usedAssets: pendleUsedAssets, assetsData: pendleAssetsData });

    // only the intrinsic supply incentive — no Merkl reward on the Paxos Hub borrow
    assert.approximately(+incentiveUsd, 29880, 15);
    assert.approximately(+netApy, 10.6, 0.2);
  });
});
