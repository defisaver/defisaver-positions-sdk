import Dec from 'decimal.js';
import { CrvUSDAggregatedPositionData, CrvUSDMarketData, CrvUSDUsedAssets } from '../../types';
import { MMUsedAssets, NetworkNumber } from '../../types/common';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import { mapRange } from '../../services/utils';

export const getCrvUsdAggregatedData = ({
  loanExists, usedAssets, network, selectedMarket, numOfBands, ...rest
}:{
  loanExists: boolean, usedAssets: CrvUSDUsedAssets, network: NetworkNumber, selectedMarket: CrvUSDMarketData, numOfBands: number | string
}): CrvUSDAggregatedPositionData => {
  const payload = {} as CrvUSDAggregatedPositionData;
  payload.supplied = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ supplied }: { supplied: string }) => supplied); // this is wrong if we are in soft-liquidations
  payload.borrowed = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowed }: { borrowed: string }) => borrowed);
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);

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
  payload.borrowLimitUsd = usedAssets?.[selectedMarket.collAsset]?.isSupplied
    ? new Dec(usedAssets[selectedMarket.collAsset].suppliedUsd).mul(payload.collFactor).toString()
    : '0';

  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets as unknown as MMUsedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, usedAssets[selectedMarket.collAsset].price, payload.borrowedUsd, payload.borrowLimitUsd);
  }

  return payload;
};