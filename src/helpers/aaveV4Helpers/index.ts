import Dec from 'decimal.js';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import {
  AaveV4AggregatedPositionData, AaveV4AssetsData, AaveV4ReserveAssetData, AaveV4UsedReserveAsset, AaveV4UsedReserveAssets,
} from '../../types';
import { NetworkNumber } from '../../types/common';

export const aaveV4GetCollateralFactor = (assetData: AaveV4ReserveAssetData, usedAssetData: AaveV4UsedReserveAsset, useUserCollateralFactor: boolean = false): number => (useUserCollateralFactor ? usedAssetData.collateralFactor : assetData.collateralFactor);

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
  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  payload.leveragedAsset = leveragedAsset;
  payload.liquidationPrice = '';
  if (leveragedType !== '') {
    const leveragedAssetData = Object.values(assetsData).find((asset) => asset.symbol === leveragedAsset);
    let assetPrice = leveragedAssetData?.price || '0';
    if (leveragedType === 'lsd-leverage') {
      // Treat ETH like a stablecoin in a long stETH position
      const ethPrice = Object.values(assetsData).find((asset) => asset.symbol === 'ETH')?.price || '0';
      payload.leveragedLsdAssetRatio = new Dec(leveragedAssetData?.price || '0').div(ethPrice).toDP(18).toString();
      assetPrice = new Dec(assetPrice).div(ethPrice).toString();
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
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