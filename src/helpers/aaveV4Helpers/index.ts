import Dec from 'decimal.js';
import { calcLeverageLiqPrice, getAssetsTotal, STABLE_ASSETS } from '../../moneymarket';
import {
  AaveV4AggregatedPositionData, AaveV4AssetsData, AaveV4ReserveAssetData, AaveV4UsedReserveAsset, AaveV4UsedReserveAssets,
} from '../../types';
import { LeverageType, NetworkNumber } from '../../types/common';

export const aaveV4GetCollateralFactor = (assetData: AaveV4ReserveAssetData, usedAssetData: AaveV4UsedReserveAsset, useUserCollateralFactor: boolean = false): number => (useUserCollateralFactor ? usedAssetData.collateralFactor : assetData.collateralFactor);

export const isLeveragedPosAaveV4 = (usedAssets: AaveV4UsedReserveAssets, dustLimit = 5) => {
  let borrowUnstable = 0;
  let supplyStable = 0;
  let borrowStable = 0;
  let supplyUnstable = 0;
  let longAsset = '';
  let shortAsset = '';
  Object.values(usedAssets).forEach(({
    symbol, suppliedUsd, borrowedUsd, collateral, reserveId,
  }) => {
    const spokeAsset = `${symbol}-${reserveId}`;
    const isSupplied = (+suppliedUsd) > dustLimit; // ignore dust like <limit leftover supply
    const isBorrowed = (+borrowedUsd) > dustLimit; // ignore dust like <limit leftover supply
    if (isSupplied && STABLE_ASSETS.includes(symbol) && collateral) supplyStable += 1;
    if (isBorrowed && STABLE_ASSETS.includes(symbol)) borrowStable += 1;
    if (isBorrowed && !STABLE_ASSETS.includes(symbol)) {
      borrowUnstable += 1;
      shortAsset = spokeAsset;
    }
    if (isSupplied && !STABLE_ASSETS.includes(symbol) && collateral) {
      supplyUnstable += 1;
      longAsset = spokeAsset;
    }
  });
  const isLong = borrowStable > 0 && borrowUnstable === 0 && supplyUnstable === 1 && supplyStable === 0;
  const isShort = supplyStable > 0 && supplyUnstable === 0 && borrowUnstable === 1 && borrowStable === 0;
  const isVolatilePair = supplyUnstable === 1 && borrowUnstable === 1 && supplyStable === 0 && borrowStable === 0;
  if (isLong) {
    return {
      leveragedType: LeverageType.Long,
      leveragedAsset: longAsset,
    };
  }
  if (isShort) {
    return {
      leveragedType: LeverageType.Short,
      leveragedAsset: shortAsset,
    };
  }
  if (isVolatilePair) {
    return {
      leveragedType: LeverageType.VolatilePair,
      leveragedAsset: longAsset,
    };
  }
  return {
    leveragedType: LeverageType.None,
    leveragedAsset: '',
  };
};

export const aaveV4GetAggregatedPositionData = ({
  usedAssets,
  assetsData,
  network,
  useUserCollateralFactor = false,
}: {
  usedAssets: AaveV4UsedReserveAssets,
  assetsData: AaveV4AssetsData,
  network: NetworkNumber,
  useUserCollateralFactor?: boolean,
}): AaveV4AggregatedPositionData => {
  const payload = {} as AaveV4AggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral,
    ({ symbol, suppliedUsd, reserveId }: { symbol: string, suppliedUsd: string, reserveId: number }) => new Dec(suppliedUsd).mul(aaveV4GetCollateralFactor(assetsData[`${symbol}-${reserveId}`], usedAssets[`${symbol}-${reserveId}`], useUserCollateralFactor)),
  );
  payload.liquidationLimitUsd = payload.borrowLimitUsd;
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  payload.drawnUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ drawnUsd }: { drawnUsd: string }) => drawnUsd);
  payload.premiumUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ premiumUsd }: { premiumUsd: string }) => premiumUsd);
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = +payload.suppliedUsd ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = +payload.suppliedUsd ? new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.liqRatio = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).toString();
  payload.liqPercent = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  const { leveragedType, leveragedAsset } = isLeveragedPosAaveV4(usedAssets);
  payload.leveragedType = leveragedType;
  payload.leveragedAsset = leveragedAsset;
  payload.liquidationPrice = '';
  if (leveragedType !== '') {
    const leveragedAssetData = assetsData[leveragedAsset];
    let assetPrice = leveragedAssetData?.price || '0';
    if (leveragedType === LeverageType.VolatilePair) {
      const borrowedAsset = (Object.values(usedAssets) as AaveV4UsedReserveAsset[]).find(({ borrowedUsd }: { borrowedUsd: string }) => +borrowedUsd > 0);
      const borrowedAssetPrice = assetsData[`${borrowedAsset!.symbol}-${borrowedAsset!.reserveId}`].price;
      const leveragedAssetPrice = assetsData[leveragedAsset].price;
      const isReverse = new Dec(leveragedAssetPrice).lt(borrowedAssetPrice);
      if (isReverse) {
        payload.leveragedType = LeverageType.VolatilePairReverse;
        payload.currentVolatilePairRatio = new Dec(borrowedAssetPrice).div(leveragedAssetPrice).toDP(18).toString();
        assetPrice = new Dec(borrowedAssetPrice).div(assetPrice).toString();
      } else {
        assetPrice = new Dec(assetPrice).div(borrowedAssetPrice).toString();
        payload.currentVolatilePairRatio = new Dec(leveragedAssetPrice).div(borrowedAssetPrice).toDP(18).toString();
      }
    }
    payload.liquidationPrice = calcLeverageLiqPrice(payload.leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }
  payload.minCollRatio = new Dec(payload.suppliedCollateralUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.suppliedCollateralUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  //   payload.healthRatio = new Dec(payload.liquidationLimitUsd).div(payload.borrowedUsd).toDP(4).toString();
  payload.minHealthRatio = new Dec(payload.liquidationLimitUsd).div(payload.borrowLimitUsd).toDP(4).toString();

  // TODO: Re-implement netApy calculation
  //   const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({
  //     usedAssets,
  //     assetsData,
  //     optionalData: { healthRatio: payload.healthRatio },
  //   });
  payload.netApy = '0';
  payload.incentiveUsd = '0';
  payload.totalInterestUsd = '0';
  return payload;
};