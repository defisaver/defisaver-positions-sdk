import { attachFluidMerklIncentives, buildFluidMerklRewardMap } from '../src/fluid/merkl';
import { getFluidAggregatedData } from '../src/helpers/fluidHelpers';
import {
  FluidAssetData,
  FluidMarketData,
  FluidUsedAssets,
  FluidVaultType,
  IncentiveKind,
  IncentiveSource,
  MerklOpportunity,
  NetworkNumber,
  OpportunityStatus,
} from '../src/types';

const { assert } = require('chai');

const VAULT_ADDRESS = '0x1111111111111111111111111111111111111111';

const asset = (symbol: string): FluidAssetData => ({
  symbol,
  address: `0x${symbol}`,
  price: '1',
  totalSupply: '0',
  totalBorrow: '0',
  canBeSupplied: true,
  canBeBorrowed: true,
  supplyRate: '0',
  borrowRate: '0',
  supplyIncentives: [],
  borrowIncentives: [],
});

const market = (): FluidMarketData => ({
  assetsData: {
    GHO: asset('GHO'),
    USDC: asset('USDC'),
  },
  marketData: {
    vaultId: 61,
    isSmartColl: true,
    isSmartDebt: true,
    marketAddress: VAULT_ADDRESS,
    vaultType: FluidVaultType.T4,
    oracle: '0x0000000000000000000000000000000000000000',
    liquidationPenaltyPercent: '0',
    collFactor: '0.8',
    liquidationRatio: '90',
    liqFactor: '0.9',
    minRatio: '111.11',
    collAsset0: 'GHO',
    collAsset1: 'USDC',
    debtAsset0: 'GHO',
    debtAsset1: 'USDC',
    totalPositions: '1',
    totalSupplyVault: '1000',
    totalSupplyVaultUsd: '1000',
    totalBorrowVault: '500',
    totalBorrowVaultUsd: '500',
    withdrawable: '0',
    borrowable: '0',
    supplyRate: '5',
    borrowRate: '10',
    liquidationMaxLimit: '0',
    oraclePrice: '1',
    incentiveSupplyRate: '0',
    incentiveBorrowRate: '0',
    tradingSupplyRate: '0',
    tradingBorrowRate: '0',
    collSharePrice: '1000',
    debtSharePrice: '500',
  },
});

const usedAssets: FluidUsedAssets = {
  GHO: {
    symbol: 'GHO',
    collateral: true,
    supplied: '600',
    suppliedUsd: '600',
    borrowed: '400',
    borrowedUsd: '400',
    isSupplied: true,
    isBorrowed: true,
  },
  USDC: {
    symbol: 'USDC',
    collateral: true,
    supplied: '400',
    suppliedUsd: '400',
    borrowed: '100',
    borrowedUsd: '100',
    isSupplied: true,
    isBorrowed: true,
  },
};

describe('Fluid Merkl rewards', () => {
  it('marks Fluid vault campaigns as Merkl incentives', () => {
    const campaigns = buildFluidMerklRewardMap([{
      chainId: NetworkNumber.Eth,
      type: 'FLUIDVAULT_COLLATERAL',
      status: OpportunityStatus.LIVE,
      identifier: VAULT_ADDRESS,
      apr: 2,
      tokens: [{ symbol: 'GHO' }],
    } as unknown as MerklOpportunity], NetworkNumber.Eth);

    assert.equal(campaigns[VAULT_ADDRESS].supply[0].source, IncentiveSource.Merkl);
    assert.equal(campaigns[VAULT_ADDRESS].supply[0].incentiveKind, IncentiveKind.Reward);
  });

  it('counts each vault campaign once for a smart collateral/debt pair', () => {
    const enriched = attachFluidMerklIncentives(market(), {
      [VAULT_ADDRESS]: {
        supply: [{
          token: 'GHO', apy: '2', source: IncentiveSource.Merkl, incentiveKind: IncentiveKind.Reward,
        }],
        borrow: [{
          token: 'GHO', apy: '3', source: IncentiveSource.Merkl, incentiveKind: IncentiveKind.Reward,
        }],
      },
    });

    // The campaign is intentionally attached to both tokens of each smart side for display.
    assert.lengthOf(enriched.assetsData.GHO.supplyIncentives, 1);
    assert.lengthOf(enriched.assetsData.USDC.supplyIncentives, 1);

    const aggregated = getFluidAggregatedData({
      usedAssets,
      assetsData: enriched.assetsData,
      marketData: enriched.marketData,
    }, '1', '1');

    // $20 supply reward + $15 borrow reward. Counting once per token would incorrectly yield $70.
    assert.equal(aggregated.incentiveUsd, '35');
    assert.equal(aggregated.totalInterestUsd, '35');
    assert.equal(aggregated.netApy, '7');
    assert.lengthOf(aggregated.merklSupplyIncentives, 1);
    assert.lengthOf(aggregated.merklBorrowIncentives, 1);
  });
});
