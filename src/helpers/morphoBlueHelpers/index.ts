import Dec from 'decimal.js';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import { MMUsedAssets } from '../../types/common';
import { MorphoBlueAggregatedPositionData, MorphoBlueAssetsData, MorphoBlueMarketInfo } from '../../types';

export const getMorphoBlueAggregatedPositionData = ({ usedAssets, assetsData, marketInfo }: { usedAssets: MMUsedAssets, assetsData: MorphoBlueAssetsData, marketInfo: MorphoBlueMarketInfo }): MorphoBlueAggregatedPositionData => {
  const payload = {} as MorphoBlueAggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);

  const {
    lltv, oracle, collateralToken, loanToken,
  } = marketInfo;

  payload.borrowLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => {
      const suppliedUsdAmount = suppliedUsd;

      return new Dec(suppliedUsdAmount).mul(lltv);
    },
  );
  payload.liquidationLimitUsd = payload.borrowLimitUsd;
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();

  payload.leftToBorrow = new Dec(usedAssets[collateralToken].supplied).mul(oracle).mul(lltv).sub(usedAssets[loanToken].borrowed)
    .toString();

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy(usedAssets, assetsData as any);
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  payload.ltv = new Dec(payload.borrowedUsd).div(payload.suppliedCollateralUsd).toString();
  payload.ltv = new Dec(usedAssets[loanToken].borrowed).div(oracle).div(usedAssets[collateralToken].supplied).toString();
  payload.ratio = new Dec(usedAssets[collateralToken].supplied).mul(oracle).div(usedAssets[loanToken].borrowed).toString();

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

  return payload;
};