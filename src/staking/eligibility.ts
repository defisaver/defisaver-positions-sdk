import Dec from 'decimal.js';
import { IncentiveEligibilityId, MMUsedAssets } from '../types/common';

type EthenaPairEligibilityConfig = {
  baseSymbol: string;
  pairSymbol: string;
  allowedBorrowAssets: string[];
  maxHealthRatio: string; // exclusive upper bound
  rewardSymbol: string;
};

const isEligibleForEthenaPairRewards = (
  usedAssets: MMUsedAssets,
  { healthRatio }: { healthRatio: string },
  {
    baseSymbol,
    pairSymbol,
    allowedBorrowAssets,
    maxHealthRatio,
    rewardSymbol,
  }: EthenaPairEligibilityConfig,
) => {
  const baseSuppliedUsd = usedAssets[baseSymbol]?.suppliedUsd || '0';
  const pairSuppliedUsd = usedAssets[pairSymbol]?.suppliedUsd || '0';

  const anythingElseSupplied = Object.values(usedAssets).some(
    (asset) => asset.isSupplied && asset.symbol !== baseSymbol && asset.symbol !== pairSymbol,
  );
  if (anythingElseSupplied) return { isEligible: false, eligibleUSDAmount: '0' };

  const totalAmountSupplied = new Dec(baseSuppliedUsd).add(pairSuppliedUsd);
  if (totalAmountSupplied.eq(0)) return { isEligible: false, eligibleUSDAmount: '0' };

  const percentageInBase = new Dec(baseSuppliedUsd).div(totalAmountSupplied).toNumber();
  if (percentageInBase < 0.45 || percentageInBase > 0.55) return { isEligible: false, eligibleUSDAmount: '0' };

  const percentageInPair = new Dec(pairSuppliedUsd).div(totalAmountSupplied).toNumber();
  if (percentageInPair < 0.45 || percentageInPair > 0.55) return { isEligible: false, eligibleUSDAmount: '0' };

  const anythingBorrowedNotAllowed = Object.values(usedAssets).some(
    (asset) => asset.isBorrowed && !allowedBorrowAssets.includes(asset.symbol),
  );
  if (anythingBorrowedNotAllowed) return { isEligible: false, eligibleUSDAmount: '0' };

  if (new Dec(healthRatio).gte(maxHealthRatio)) return { isEligible: false, eligibleUSDAmount: '0' };

  const halfAmountSupplied = totalAmountSupplied.div(2);
  const rewardSuppliedUsd = usedAssets[rewardSymbol]?.suppliedUsd || '0';
  const eligibleUSDAmount = Dec.min(rewardSuppliedUsd, halfAmountSupplied).toString();

  return { isEligible: true, eligibleUSDAmount };
};

export const isEligibleForEthenaUSDeRewards = (usedAssets: MMUsedAssets, { healthRatio }: { healthRatio: string }) => isEligibleForEthenaPairRewards(
  usedAssets,
  { healthRatio },
  {
    baseSymbol: 'USDe',
    pairSymbol: 'sUSDe',
    allowedBorrowAssets: ['USDC', 'USDT', 'USDS'],
    maxHealthRatio: '2.5',
    rewardSymbol: 'USDe',
  },
);

export const isEligibleForEthenaGHORewards = (usedAssets: MMUsedAssets, { healthRatio }: { healthRatio: string }) => isEligibleForEthenaPairRewards(
  usedAssets,
  { healthRatio },
  {
    baseSymbol: 'syrupUSDT',
    pairSymbol: 'GHO',
    allowedBorrowAssets: ['USDT'],
    maxHealthRatio: '2',
    rewardSymbol: 'GHO',
  },
);

export const isEligibleForAaveV3ArbitrumEthSupply = (usedAssets: MMUsedAssets) => {
  const ETHAmountSupplied = usedAssets.ETH?.suppliedUsd || '0';
  const ETHAmountBorrowed = usedAssets.ETH?.borrowedUsd || '0';
  const delta = new Dec(ETHAmountSupplied).sub(ETHAmountBorrowed).toString();

  return { isEligible: true, eligibleUSDAmount: Dec.max(delta, 0).toString() };
};

export const isEligibleForAaveV3ArbitrumETHLSBorrow = (usedAssets: MMUsedAssets) => {
  const allowedBorrowAssets = ['ETH'];
  const anythingBorrowedNotAllowed = Object.values(usedAssets).some((asset) => asset.isBorrowed && !allowedBorrowAssets.includes(asset.symbol));
  if (anythingBorrowedNotAllowed) return { isEligible: false, eligibleUSDAmount: '0' };

  const allowedSupplyAssets = ['wstETH', 'ezETH', 'weETH', 'rsETH'];
  const anythingSuppliedNotAllowed = Object.values(usedAssets).some((asset) => asset.isSupplied && !allowedSupplyAssets.includes(asset.symbol));
  if (anythingSuppliedNotAllowed) return { isEligible: false, eligibleUSDAmount: '0' };

  const ETHAmountBorrowed = usedAssets.ETH?.borrowedUsd || '0';

  return { isEligible: true, eligibleUSDAmount: ETHAmountBorrowed };
};

export const EligibilityMapping: { [key in IncentiveEligibilityId]: (usedAssets: MMUsedAssets, optionalData: any) => { isEligible: boolean; eligibleUSDAmount: string } } = {
  [IncentiveEligibilityId.AaveV3EthenaLiquidLeverage]: isEligibleForEthenaUSDeRewards,
  [IncentiveEligibilityId.AaveV3ArbitrumEthSupply]: isEligibleForAaveV3ArbitrumEthSupply,
  [IncentiveEligibilityId.AaveV3ArbitrumETHLSBorrow]: isEligibleForAaveV3ArbitrumETHLSBorrow,
  [IncentiveEligibilityId.AaveV3EthenaLiquidLeveragePlasma]: isEligibleForEthenaUSDeRewards,
  [IncentiveEligibilityId.AaveV3EthenaLiquidLeveragePlasmaGHO]: isEligibleForEthenaGHORewards,
};