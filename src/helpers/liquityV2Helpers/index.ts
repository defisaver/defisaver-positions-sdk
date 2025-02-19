import Dec from 'decimal.js';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import {
  LiquityV2AggregatedTroveData, LiquityV2AssetsData, LiquityV2UsedAsset, LiquityV2UsedAssets,
} from '../../types';
import { calculateInterestEarned } from '../../staking';

export const calculateNetApyLiquityV2 = (usedAssets: LiquityV2UsedAssets, assetsData: LiquityV2AssetsData, interestRate: string) => {
  const sumValues = Object.values(usedAssets).reduce((_acc, usedAsset) => {
    const acc = { ..._acc };
    const assetData = assetsData[usedAsset.symbol];

    if (usedAsset.suppliedUsd) {
      const amount = usedAsset.suppliedUsd;
      acc.suppliedUsd = new Dec(acc.suppliedUsd).add(amount).toString();
      if (assetData.incentiveSupplyApy) {
        const incentiveInterest = calculateInterestEarned(amount, assetData.incentiveSupplyApy, 'year', true);
        acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
      }
    }

    if (usedAsset.borrowedUsd) {
      const amount = usedAsset.borrowedUsd;
      acc.borrowedUsd = new Dec(acc.borrowedUsd).add(amount).toString();
      const rate = interestRate;
      const borrowInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.borrowInterest = new Dec(acc.borrowInterest).sub(borrowInterest.toString()).toString();
    }

    return acc;
  }, {
    borrowInterest: '0', supplyInterest: '0', incentiveUsd: '0', borrowedUsd: '0', suppliedUsd: '0',
  });

  const {
    borrowedUsd, suppliedUsd, borrowInterest, supplyInterest, incentiveUsd,
  } = sumValues;

  const totalInterestUsd = new Dec(borrowInterest).add(supplyInterest).add(incentiveUsd).toString();
  const balance = new Dec(suppliedUsd).sub(borrowedUsd);
  const netApy = new Dec(totalInterestUsd).div(balance).times(100).toString();

  return { netApy, totalInterestUsd, incentiveUsd };
};

export const getLiquityV2AggregatedPositionData = ({
  usedAssets,
  assetsData,
  minCollRatio,
  interestRate,
}: {
  usedAssets: LiquityV2UsedAssets
  assetsData: LiquityV2AssetsData
  minCollRatio: string
  interestRate: string
}): LiquityV2AggregatedTroveData => {
  const payload = {} as LiquityV2AggregatedTroveData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, (usedAsset: LiquityV2UsedAsset) => usedAsset, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, (usedAsset: LiquityV2UsedAsset) => usedAsset, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  payload.borrowLimitUsd = new Dec(payload.suppliedUsd).div(minCollRatio).mul(100).toString();
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = (+payload.suppliedUsd && +payload.borrowedUsd) ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = (+payload.suppliedUsd && +payload.borrowedUsd) ? new Dec(payload.suppliedUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApyLiquityV2(usedAssets, assetsData, interestRate);
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  payload.leveragedAsset = leveragedAsset;
  payload.liquidationPrice = '';
  if (leveragedType !== '') {
    const assetPrice = assetsData[leveragedAsset].price;
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.borrowLimitUsd);
  }

  return payload;
};
