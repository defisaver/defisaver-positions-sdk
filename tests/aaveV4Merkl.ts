import { getAssetInfo } from '@defisaver/tokens';
import Dec from 'decimal.js';
import { attachAaveV4MerklIncentives, buildAaveV4MerklRewardMap } from '../src/aaveV4/merkl';
import { calculateNetApyAaveV4, getAaveV4ApplicableIncentives } from '../src/helpers/aaveV4Helpers';
import {
  AAVE_V4_BLUECHIP_SPOKE,
  AAVE_V4_CORE_HUB,
  AAVE_V4_ETHENA_ECOSYSTEM_SPOKE,
  AAVE_V4_MAIN_SPOKE,
  AAVE_V4_PAXOS_HUB,
  AAVE_V4_PLUS_HUB,
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
  MerklCampaign,
  MerklOpportunity,
  NetworkNumber,
  OpportunityAction,
  OpportunityStatus,
} from '../src/types';

const { assert } = require('chai');

const BLUECHIP_SPOKE = AAVE_V4_BLUECHIP_SPOKE(NetworkNumber.Eth).address;
const ETHENA_ECOSYSTEM_SPOKE = AAVE_V4_ETHENA_ECOSYSTEM_SPOKE(NetworkNumber.Eth).address;
const USDG_PENDLE_SPOKE = AAVE_V4_USDG_PENDLE_SPOKE(NetworkNumber.Eth).address;
const MAIN_SPOKE = AAVE_V4_MAIN_SPOKE(NetworkNumber.Eth).address;
const CORE_HUB = AAVE_V4_CORE_HUB(NetworkNumber.Eth).address;
const PLUS_HUB = AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address;
const PRIME_HUB = AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address;
const PAXOS_HUB = AAVE_V4_PAXOS_HUB(NetworkNumber.Eth).address;
const USDC = getAssetInfo('USDC').address as EthAddress;
const WBTC = getAssetInfo('WBTC').address as EthAddress;
const USDG = getAssetInfo('USDG').address as EthAddress;
const USDE = '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3' as EthAddress;

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

const campaign = (
  params: NonNullable<MerklCampaign['params']>,
  over: Partial<Omit<MerklCampaign, 'params'>> = {},
): MerklCampaign => ({
  id: '1', campaignId: '0x1234', ...over, params,
});

// Merkl lists the same USDC borrow reward twice: once as the Prime Hub parent campaign, once as
// its child campaign scoped to the Bluechip Spoke (linked via parentCampaignId → parent's id)
const campaigns = buildAaveV4MerklRewardMap([
  opportunity({
    type: 'AAVE_V4_SPOKE_BORROW',
    explorerAddress: BLUECHIP_SPOKE,
    apr: SPOKE_CAMPAIGN_APR,
    campaigns: [campaign({
      spokeAddress: BLUECHIP_SPOKE, reserveId: '4', hubAddress: PRIME_HUB, hubAssetId: '4',
    }, { campaignId: '3413192378461955844', parentCampaignId: '4136256609526176092' })],
  }),
  opportunity({
    type: 'AAVE_V4_HUB_BORROW',
    explorerAddress: PRIME_HUB,
    apr: HUB_CAMPAIGN_APR,
    campaigns: [campaign(
      { hubAddress: PRIME_HUB, assetId: '4' },
      { id: '4136256609526176092', childCampaignIds: ['1'] },
    )],
  }),
], NetworkNumber.Eth);

const reserve = (over: Partial<AaveV4ReserveAssetData>): AaveV4ReserveAssetData => ({
  symbol: 'USDC',
  underlying: USDC,
  hub: PRIME_HUB,
  assetId: 4,
  reserveId: 4,
  supplyIncentives: [],
  borrowIncentives: [],
  supplyRate: '0',
  drawnRate: '0',
  collateralRisk: 0,
  collateralFactor: 0,
  ...over,
} as unknown as AaveV4ReserveAssetData);

describe('Aave V4 Merkl campaign matching', () => {
  it('attaches a spoke campaign only to its exact reserve', () => {
    const onBluechip = attachAaveV4MerklIncentives(reserve({}), BLUECHIP_SPOKE, campaigns);
    assert.lengthOf(onBluechip.spokeBorrowIncentives!, 1);
    assert.equal(onBluechip.spokeBorrowIncentives![0].apy, aprToApy(SPOKE_CAMPAIGN_APR));

    const anotherBluechipReserve = attachAaveV4MerklIncentives(reserve({ reserveId: 7 }), BLUECHIP_SPOKE, campaigns);
    assert.lengthOf(anotherBluechipReserve.spokeBorrowIncentives!, 0);

    const onPendle = attachAaveV4MerklIncentives(reserve({ hub: PAXOS_HUB }), USDG_PENDLE_SPOKE, campaigns);
    assert.lengthOf(onPendle.spokeBorrowIncentives!, 0);
  });

  it('attaches a hub campaign only to its exact hub asset (DEV-13284)', () => {
    const onPrime = attachAaveV4MerklIncentives(reserve({ hub: PRIME_HUB }), MAIN_SPOKE, campaigns);
    assert.lengthOf(onPrime.hubBorrowIncentives!, 1);

    const anotherPrimeAsset = attachAaveV4MerklIncentives(reserve({ assetId: 5 }), MAIN_SPOKE, campaigns);
    assert.lengthOf(anotherPrimeAsset.hubBorrowIncentives!, 0);

    // USDC borrowed from the Paxos Hub must not inherit the Prime Hub reward
    const onPaxos = attachAaveV4MerklIncentives(reserve({ hub: PAXOS_HUB }), USDG_PENDLE_SPOKE, campaigns);
    assert.lengthOf(onPaxos.hubBorrowIncentives!, 0);
  });

  it('does not leak a Core USDC reward onto the same token from the Plus Hub', () => {
    const ethenaCampaigns = buildAaveV4MerklRewardMap([
      opportunity({
        type: 'AAVE_V4_SPOKE_BORROW',
        apr: SPOKE_CAMPAIGN_APR,
        campaigns: [campaign({
          spokeAddress: ETHENA_ECOSYSTEM_SPOKE,
          reserveId: '7',
          hubAddress: CORE_HUB,
          hubAssetId: '5',
        }, { campaignId: '9654310212108407598', parentCampaignId: '7197768104610876659' })],
      }),
      opportunity({
        type: 'AAVE_V4_HUB_BORROW',
        apr: HUB_CAMPAIGN_APR,
        campaigns: [campaign({ hubAddress: CORE_HUB, assetId: '5' }, { id: '7197768104610876659' })],
      }),
    ], NetworkNumber.Eth);

    const fromCore = attachAaveV4MerklIncentives(
      reserve({ hub: CORE_HUB, assetId: 5, reserveId: 7 }),
      ETHENA_ECOSYSTEM_SPOKE,
      ethenaCampaigns,
    );
    assert.lengthOf(fromCore.spokeBorrowIncentives!, 1);
    assert.lengthOf(fromCore.hubBorrowIncentives!, 1);

    const fromPlus = attachAaveV4MerklIncentives(
      reserve({ hub: PLUS_HUB, assetId: 4, reserveId: 4 }),
      ETHENA_ECOSYSTEM_SPOKE,
      ethenaCampaigns,
    );
    assert.lengthOf(fromPlus.spokeBorrowIncentives!, 0);
    assert.lengthOf(fromPlus.hubBorrowIncentives!, 0);
  });

  it('distinguishes two same-token reserves on Bluechip by reserve id', () => {
    const bluechipCampaigns = buildAaveV4MerklRewardMap([
      opportunity({
        apr: 2,
        campaigns: [campaign({
          spokeAddress: BLUECHIP_SPOKE, reserveId: '4', hubAddress: PRIME_HUB, hubAssetId: '4',
        })],
      }),
      opportunity({
        apr: 3,
        campaigns: [campaign({
          spokeAddress: BLUECHIP_SPOKE, reserveId: '7', hubAddress: CORE_HUB, hubAssetId: '5',
        })],
      }),
    ], NetworkNumber.Eth);

    const fromPrime = attachAaveV4MerklIncentives(
      reserve({ hub: PRIME_HUB, assetId: 4, reserveId: 4 }), BLUECHIP_SPOKE, bluechipCampaigns,
    );
    const fromCore = attachAaveV4MerklIncentives(
      reserve({ hub: CORE_HUB, assetId: 5, reserveId: 7 }), BLUECHIP_SPOKE, bluechipCampaigns,
    );
    assert.equal(fromPrime.spokeBorrowIncentives![0].apy, aprToApy(2));
    assert.equal(fromCore.spokeBorrowIncentives![0].apy, aprToApy(3));
  });

  it('supports a direct spoke campaign without a parent campaign', () => {
    const directCampaigns = buildAaveV4MerklRewardMap([
      opportunity({
        type: 'AAVE_V4_SPOKE_SUPPLY',
        action: OpportunityAction.LEND,
        apr: 5.25,
        tokens: [{ address: USDE, symbol: 'USDe' }] as MerklOpportunity['tokens'],
        campaigns: [campaign({
          spokeAddress: ETHENA_ECOSYSTEM_SPOKE,
          reserveId: '3',
          hubAddress: PLUS_HUB,
          hubAssetId: '3',
        }, { campaignId: '0xd0560a6ca8cd5b0b7e35252ef59f53fefd30058781afd1777daf775b72e4ba37' })],
      }),
    ], NetworkNumber.Eth);

    const direct = attachAaveV4MerklIncentives(
      reserve({
        underlying: USDE, hub: PLUS_HUB, assetId: 3, reserveId: 3, supplyRate: '1.32',
      }),
      ETHENA_ECOSYSTEM_SPOKE,
      directCampaigns,
    );
    assert.lengthOf(direct.spokeSupplyIncentives!, 1);
    assert.equal(direct.spokeSupplyIncentives![0].apy, new Dec(aprToApy(5.25)).minus(1.32).toString());
    assert.equal(getAaveV4ApplicableIncentives(direct, IncentiveSide.Supply)[0].apy, direct.spokeSupplyIncentives![0].apy);
  });

  it('maps net-lending targets from nested Hub parameters without crossing Hub assets', () => {
    const netLending = buildAaveV4MerklRewardMap([
      opportunity({
        type: 'AAVE_V4_HUB_NET_LENDING', action: OpportunityAction.LEND, apr: 6,
        tokens: [{ address: USDG, symbol: 'USDG' }] as MerklOpportunity['tokens'],
        campaigns: [campaign({ distributionMethodParameters: {
          distributionMethod: 'AAVE_V4_NET_APR', distributionSettings: { hubAddress: CORE_HUB, assetId: '8' },
        } })],
      }),
      opportunity({
        type: 'AAVE_V4_HUB_NET_LENDING', action: OpportunityAction.LEND, apr: 5,
        tokens: [{ address: USDG, symbol: 'USDG' }] as MerklOpportunity['tokens'],
        campaigns: [campaign({ distributionMethodParameters: {
          distributionMethod: 'AAVE_V4_NET_APR', distributionSettings: { hubAddress: PAXOS_HUB, assetId: '3' },
        } })],
      }),
    ], NetworkNumber.Eth);

    const nativeSupplyApy = aprToApy(2);
    const core = attachAaveV4MerklIncentives(
      reserve({ hub: CORE_HUB, assetId: 8, supplyRate: nativeSupplyApy }), MAIN_SPOKE, netLending,
    );
    const paxos = attachAaveV4MerklIncentives(
      reserve({ hub: PAXOS_HUB, assetId: 3, supplyRate: nativeSupplyApy }), MAIN_SPOKE, netLending,
    );
    const wrongAsset = attachAaveV4MerklIncentives(
      reserve({ hub: CORE_HUB, assetId: 3, supplyRate: nativeSupplyApy }), MAIN_SPOKE, netLending,
    );

    assert.equal(new Dec(core.hubSupplyIncentives![0].apy).plus(nativeSupplyApy).toString(), aprToApy(6));
    assert.equal(new Dec(paxos.hubSupplyIncentives![0].apy).plus(nativeSupplyApy).toString(), aprToApy(5));
    assert.isEmpty(wrongAsset.hubSupplyIncentives);
    const aboveTarget = attachAaveV4MerklIncentives(
      reserve({ hub: CORE_HUB, assetId: 8, supplyRate: aprToApy(7) }), MAIN_SPOKE, netLending,
    );
    assert.equal(aboveTarget.hubSupplyIncentives![0].apy, '0');

    const { netApy } = calculateNetApyAaveV4({
      assetsData: { 'USDG-4': core } as AaveV4AssetsData,
      usedAssets: { 'USDG-4': {
        symbol: 'USDG', reserveId: 4, isSupplied: true, isBorrowed: false, collateral: false,
        collateralFactor: 0, suppliedUsd: '1000', borrowedUsd: '0',
      } } as unknown as AaveV4UsedReserveAssets,
    });
    assert.approximately(+netApy, +aprToApy(6), 0.000001);
  });

  it('adds a fixed-APR LEND reward on top of native supply APY', () => {
    const now = Math.floor(Date.now() / 1000);
    const additive = buildAaveV4MerklRewardMap([opportunity({
      type: 'AAVE_V4_SPOKE_SUPPLY', action: OpportunityAction.LEND, apr: 4,
      campaigns: [
        campaign({
          spokeAddress: ETHENA_ECOSYSTEM_SPOKE, reserveId: '3',
          distributionMethodParameters: { distributionMethod: 'AAVE_V4_NET_APR' },
        }, { startTimestamp: now - 1000, endTimestamp: now - 1 }),
        campaign({
          spokeAddress: ETHENA_ECOSYSTEM_SPOKE, reserveId: '3',
          distributionMethodParameters: { distributionMethod: 'FIX_APR' },
        }, { startTimestamp: now - 1, endTimestamp: now + 1000 }),
      ],
    })], NetworkNumber.Eth);
    const nativeSupplyApy = aprToApy(2);
    const enriched = attachAaveV4MerklIncentives(
      reserve({ reserveId: 3, supplyRate: nativeSupplyApy }), ETHENA_ECOSYSTEM_SPOKE, additive,
    );

    assert.equal(getAaveV4ApplicableIncentives(enriched, IncentiveSide.Supply)[0].apy, aprToApy(4));
  });

  it('does not guess how to split a mixed net/additive opportunity APR', () => {
    const mixed = buildAaveV4MerklRewardMap([opportunity({
      type: 'AAVE_V4_SPOKE_SUPPLY', action: OpportunityAction.LEND,
      campaigns: ['AAVE_V4_NET_APR', 'FIX_APR'].map((distributionMethod) => campaign({
        spokeAddress: ETHENA_ECOSYSTEM_SPOKE, reserveId: '3',
        distributionMethodParameters: { distributionMethod },
      })),
    })], NetworkNumber.Eth);
    assert.isEmpty(mixed.spoke);
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

  it('deduplicates repeated campaign params for one opportunity', () => {
    const repeated = buildAaveV4MerklRewardMap([
      opportunity({
        campaigns: [
          campaign({ spokeAddress: BLUECHIP_SPOKE, reserveId: '4' }),
          campaign({ spokeAddress: BLUECHIP_SPOKE, reserveId: 4 }),
        ],
      }),
    ], NetworkNumber.Eth);
    const enriched = attachAaveV4MerklIncentives(reserve({}), BLUECHIP_SPOKE, repeated);
    assert.lengthOf(enriched.spokeBorrowIncentives!, 1);
  });

  it('supports zero-valued reserve and asset ids', () => {
    const zeroIds = buildAaveV4MerklRewardMap([
      opportunity({ campaigns: [campaign({ spokeAddress: BLUECHIP_SPOKE, reserveId: 0 })] }),
      opportunity({
        type: 'AAVE_V4_HUB_BORROW', campaigns: [campaign({ hubAddress: PRIME_HUB, assetId: 0 })],
      }),
    ], NetworkNumber.Eth);
    const enriched = attachAaveV4MerklIncentives(reserve({ reserveId: 0, assetId: 0 }), BLUECHIP_SPOKE, zeroIds);
    assert.lengthOf(enriched.spokeBorrowIncentives!, 1);
    assert.lengthOf(enriched.hubBorrowIncentives!, 1);
  });

  it('fails closed when embedded campaign params are missing', () => {
    const withoutScope = buildAaveV4MerklRewardMap([
      opportunity({
        type: 'AAVE_V4_HUB_BORROW', explorerAddress: PRIME_HUB, campaigns: [{ id: '1', campaignId: '0x1234' }],
      }),
    ], NetworkNumber.Eth);
    assert.isEmpty(withoutScope.hub);
  });

  it('ignores matching opportunities from another chain', () => {
    const anotherChain = buildAaveV4MerklRewardMap([
      opportunity({
        chainId: NetworkNumber.Opt,
        campaigns: [campaign({ spokeAddress: BLUECHIP_SPOKE, reserveId: '4' })],
      }),
    ], NetworkNumber.Eth);
    assert.isEmpty(anotherChain.spoke);
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

  it('combines a hub campaign with a distinct (non-child) spoke campaign on the same reserve', () => {
    const mixedCampaigns = buildAaveV4MerklRewardMap([
      // a standalone spoke campaign: no parentCampaignId even though params name the hub asset
      opportunity({
        type: 'AAVE_V4_SPOKE_BORROW',
        apr: 5,
        campaigns: [campaign({
          spokeAddress: BLUECHIP_SPOKE, reserveId: '4', hubAddress: PRIME_HUB, hubAssetId: '4',
        }, { id: '10020234287529041958', campaignId: '0xec49' })],
      }),
      opportunity({
        type: 'AAVE_V4_HUB_BORROW',
        apr: HUB_CAMPAIGN_APR,
        campaigns: [campaign({ hubAddress: PRIME_HUB, assetId: '4' }, { id: '4136256609526176092' })],
      }),
    ], NetworkNumber.Eth);

    const enriched = attachAaveV4MerklIncentives(reserve({}), BLUECHIP_SPOKE, mixedCampaigns);
    const applicable = getAaveV4ApplicableIncentives(enriched, IncentiveSide.Borrow);
    assert.lengthOf(applicable, 2);
    assert.sameMembers(applicable.map((i) => i.apy), [aprToApy(5), aprToApy(HUB_CAMPAIGN_APR)]);
  });

  it('keeps a distinct spoke campaign while still dropping the parent of a sibling child campaign', () => {
    // one reserve carries both a child campaign (of the prime hub campaign) and a standalone
    // spoke campaign — the parent hub reward must stay out, the standalone reward must stay in
    const mixedCampaigns = buildAaveV4MerklRewardMap([
      opportunity({
        type: 'AAVE_V4_SPOKE_BORROW',
        apr: SPOKE_CAMPAIGN_APR,
        campaigns: [campaign({
          spokeAddress: BLUECHIP_SPOKE, reserveId: '4', hubAddress: PRIME_HUB, hubAssetId: '4',
        }, { id: '2', campaignId: '3413192378461955844', parentCampaignId: '4136256609526176092' })],
      }),
      opportunity({
        type: 'AAVE_V4_SPOKE_BORROW',
        apr: 5,
        campaigns: [campaign({
          spokeAddress: BLUECHIP_SPOKE, reserveId: '4', hubAddress: PRIME_HUB, hubAssetId: '4',
        }, { id: '10020234287529041958', campaignId: '0xec49' })],
      }),
      opportunity({
        type: 'AAVE_V4_HUB_BORROW',
        apr: HUB_CAMPAIGN_APR,
        campaigns: [campaign({ hubAddress: PRIME_HUB, assetId: '4' }, { id: '4136256609526176092' })],
      }),
    ], NetworkNumber.Eth);

    const enriched = attachAaveV4MerklIncentives(reserve({}), BLUECHIP_SPOKE, mixedCampaigns);
    const applicable = getAaveV4ApplicableIncentives(enriched, IncentiveSide.Borrow);
    assert.lengthOf(applicable, 2);
    assert.sameMembers(applicable.map((i) => i.apy), [aprToApy(SPOKE_CAMPAIGN_APR), aprToApy(5)]);
  });
});

describe('Aave V4 net APY with Merkl incentives', () => {
  // The DEV-13263 position: 2.15 WBTC ($137,885) supplied at 0%, 98,615 USDC ($98,601)
  // borrowed at ~4.005% APY on the Bluechip Spoke from the Prime Hub, no risk premium.
  const wbtcReserve = reserve({
    symbol: 'WBTC', underlying: WBTC, assetId: 0, reserveId: 0, collateralFactor: 0.845,
  });
  const usdcReserve = reserve({ drawnRate: '0.0392695' });

  const assetsData = {
    'WBTC-0': attachAaveV4MerklIncentives(wbtcReserve, BLUECHIP_SPOKE, campaigns),
    'USDC-4': attachAaveV4MerklIncentives(usdcReserve, BLUECHIP_SPOKE, campaigns),
  } as unknown as AaveV4AssetsData;

  const usedAssets = {
    'WBTC-0': {
      symbol: 'WBTC', reserveId: 0, isSupplied: true, isBorrowed: false, collateral: true, collateralFactor: 0.845, suppliedUsd: '137885', borrowedUsd: '0',
    },
    'USDC-4': {
      symbol: 'USDC', reserveId: 4, isSupplied: false, isBorrowed: true, collateral: false, collateralFactor: 0, suppliedUsd: '0', borrowedUsd: '98601',
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
