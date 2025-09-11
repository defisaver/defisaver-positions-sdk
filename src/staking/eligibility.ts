import Dec from 'decimal.js';
import { IncentiveEligibilityId, MMUsedAssets } from '../types/common';

export const isEligibleForEthenaUSDeRewards = (usedAssets: MMUsedAssets) => {
  const USDeUSDAmountSupplied = usedAssets.USDe?.suppliedUsd || '0';
  const sUSDeUSDAmountSupplied = usedAssets.sUSDe?.suppliedUsd || '0';
  const anythingElseSupplied = Object.values(usedAssets).some((asset) => asset.symbol !== 'USDe' && asset.symbol !== 'sUSDe' && asset.isSupplied);
  if (anythingElseSupplied) return { isEligible: false, eligibleUSDAmount: '0' };
  const totalAmountSupplied = new Dec(USDeUSDAmountSupplied).add(sUSDeUSDAmountSupplied).toString();
  const percentageInUSDe = new Dec(USDeUSDAmountSupplied).div(totalAmountSupplied).toNumber();
  if (percentageInUSDe < 0.45 || percentageInUSDe > 0.55) return { isEligible: false, eligibleUSDAmount: '0' }; // 45% - 55% of total amount supplied must be in USDe
  const percentageInSUSDe = new Dec(sUSDeUSDAmountSupplied).div(totalAmountSupplied).toNumber();
  if (percentageInSUSDe < 0.45 || percentageInSUSDe > 0.55) return { isEligible: false, eligibleUSDAmount: '0' }; // 45% - 55% of total amount supplied must be in sUSDe

  const allowedBorrowAssets = ['USDC', 'USDT', 'USDS'];
  const anythingBorrowedNotAllowed = Object.values(usedAssets).some((asset) => asset.isBorrowed && !allowedBorrowAssets.includes(asset.symbol));
  if (anythingBorrowedNotAllowed) return { isEligible: false, eligibleUSDAmount: '0' };

  const totalAmountBorrowed = Object.values(usedAssets).reduce((acc, asset) => {
    if (asset.isBorrowed) {
      return acc.add(asset.borrowedUsd);
    }
    return acc;
  }, new Dec(0)).toString();

  const borrowPercentage = new Dec(totalAmountBorrowed).div(totalAmountSupplied).toNumber();
  if (borrowPercentage < 0.5) return { isEligible: false, eligibleUSDAmount: '0' }; // must be looped at least once

  const halfAmountSupplied = new Dec(totalAmountSupplied).div(2).toString();
  const USDeAmountEligibleForRewards = Dec.min(USDeUSDAmountSupplied, halfAmountSupplied).toString(); // rewards are given to amount of USDe supplied up to half of total amount supplied

  return { isEligible: true, eligibleUSDAmount: USDeAmountEligibleForRewards };
};

export const EligibilityMapping: { [key in IncentiveEligibilityId]: (usedAssets: MMUsedAssets) => { isEligible: boolean; eligibleUSDAmount: string } } = {
  [IncentiveEligibilityId.AaveV3EthenaLiquidLeverage]: isEligibleForEthenaUSDeRewards,
};