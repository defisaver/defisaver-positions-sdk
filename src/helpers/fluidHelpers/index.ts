import Dec from 'decimal.js';
import {
  FluidAggregatedVaultData,
  FluidAssetsData,
  FluidUsedAssets,
  InnerFluidMarketData,
} from '../../types';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import { MMAssetsData } from '../../types/common';

export const getFluidAggregatedData = ({
  usedAssets,
  assetsData,
  marketData,
}: {
  usedAssets: FluidUsedAssets,
  marketData: InnerFluidMarketData,
  assetsData: FluidAssetsData
}): FluidAggregatedVaultData => {
  const payload = {} as FluidAggregatedVaultData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData: assetsData as unknown as MMAssetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  const collFactor = marketData.collFactor;
  const liqRatio = marketData.liquidationRatio;

  payload.borrowLimitUsd = new Dec(payload.suppliedUsd).mul(collFactor).toString();
  payload.liquidationLimitUsd = new Dec(payload.suppliedUsd).mul(liqRatio).div(100).toString();
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = +payload.suppliedUsd ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = +payload.suppliedUsd ? new Dec(payload.suppliedUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.minRatio = marketData.minRatio;
  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);

  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedAsset].price;
    if (leveragedType === 'lsd-leverage') {
      // Treat ETH like a stablecoin in a long stETH position
      payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedAsset].price).div(assetsData.ETH.price).toDP(18).toString();
      assetPrice = new Dec(assetPrice).div(assetsData.ETH.price).toString();
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }

  payload.minCollRatio = new Dec(payload.suppliedUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.suppliedUsd).div(payload.liquidationLimitUsd).mul(100).toString();

  return payload;
};