import Dec from 'decimal.js';
import {
  LlamaLendAggregatedPositionData, LlamaLendAssetsData, LlamaLendMarketData, LlamaLendUsedAssets,
} from '../../types';
import { MMUsedAssets, NetworkNumber } from '../../types/common';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import { mapRange } from '../../services/utils';
import { calculateNetApy } from '../../staking';

export const getLlamaLendAggregatedData = ({
  loanExists, usedAssets, network, selectedMarket, numOfBands, assetsData, ...rest
}:{
  loanExists: boolean, usedAssets: LlamaLendUsedAssets, network: NetworkNumber, selectedMarket: LlamaLendMarketData, numOfBands: number | string, assetsData: LlamaLendAssetsData,
}): LlamaLendAggregatedPositionData => {
  const collAsset = selectedMarket.collAsset;
  const debtAsset = selectedMarket.baseAsset;
  const payload = {} as LlamaLendAggregatedPositionData;

  // payload.supplied = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ supplied }: { supplied: string }) => supplied);
  // payload.borrowed = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowed }: { borrowed: string }) => borrowed);
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ collateral }: { collateral: boolean }) => collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  payload.suppliedForYieldUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedForYield }: { suppliedForYield?: string }) => suppliedForYield || '0');

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy(usedAssets, assetsData as any);
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  payload.ratio = loanExists
    ? new Dec(payload.suppliedUsd)
      .dividedBy(payload.borrowedUsd)
      .times(100)
      .toString()
    : '0';

  // this is all approximation
  payload.minAllowedRatio = mapRange(numOfBands, 4, 50, 115, 140); // collateral ratio
  payload.collFactor = new Dec(1).div(payload.minAllowedRatio).mul(100).toString(); // collateral factor = 1 / collateral ratio
  // only take in consideration collAsset
  payload.borrowLimitUsd = usedAssets?.[collAsset]?.isSupplied
    ? new Dec(usedAssets[collAsset].suppliedUsd).mul(payload.collFactor).toString()
    : '0';

  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets as unknown as MMUsedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, usedAssets[collAsset].price, payload.borrowedUsd, payload.borrowLimitUsd);
  }

  return payload;
};
