import Dec from 'decimal.js';
import {
  calcLeverageLiqPrice, getAssetsTotal, getExposure, isLeveragedPos,
} from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import {
  LeverageType, MMAssetsData, MMUsedAsset, MMUsedAssets,
} from '../../types/common';
import { MorphoMidnightAggregatedPositionData, MorphoMidnightAssetsData, MorphoMidnightMarketInfo } from '../../types';

/**
 * Aggregate a Morpho Midnight position. Midnight markets are multi-collateral, so the borrow limit is
 * the sum of each collateral's USD value times its own lltv (Aave-v4 style), rather than a single pair.
 *
 * Note on amounts: `borrowedUsd` is derived from the position's `debt`, which is the face value owed at
 * maturity (principal + fixed interest). Health is therefore measured against the full maturity debt,
 * matching how MidnightView computes `ratio`. Fixed-rate APY is not derived on-chain in MVP, so
 * `netApy` reflects the `'0'` rates in `assetsData` (see the module getter).
 */
export const getMorphoMidnightAggregatedPositionData = ({
  usedAssets,
  assetsData,
  marketInfo,
}: {
  usedAssets: MMUsedAssets,
  assetsData: MorphoMidnightAssetsData,
  marketInfo: MorphoMidnightMarketInfo,
}): MorphoMidnightAggregatedPositionData => {
  const payload = {} as MorphoMidnightAggregatedPositionData;

  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);

  // borrowLimit = Σ collateralUsd_i * lltv_i (per-collateral lltv carried on assetsData)
  payload.borrowLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[symbol]?.lltv || 0),
  );
  payload.liquidationLimitUsd = payload.borrowLimitUsd;

  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();

  const loanTokenPrice = assetsData[marketInfo.loanToken]?.price || '0';
  payload.leftToBorrow = new Dec(loanTokenPrice).eq(0) ? '0' : new Dec(payload.leftToBorrowUsd).div(loanTokenPrice).toString();

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData: assetsData as unknown as MMAssetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  payload.ltv = new Dec(payload.suppliedCollateralUsd).eq(0) ? '0' : new Dec(payload.borrowedUsd).div(payload.suppliedCollateralUsd).toString();
  payload.ratio = new Dec(payload.borrowedUsd).eq(0) ? '0' : new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString();
  payload.healthRatio = new Dec(payload.borrowedUsd).eq(0) ? 'Infinity' : new Dec(payload.liquidationLimitUsd).div(payload.borrowedUsd).toDP(4).toString();

  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  payload.liquidationPrice = '';
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedAsset].price;
    if (leveragedType === LeverageType.VolatilePair) {
      const borrowedAsset = (Object.values(usedAssets) as MMUsedAsset[]).find(({ borrowedUsd }: { borrowedUsd: string }) => +borrowedUsd > 0);
      const borrowedAssetPrice = assetsData[borrowedAsset!.symbol].price;
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

  payload.minCollRatio = new Dec(payload.borrowLimitUsd).eq(0) ? '0' : new Dec(payload.suppliedCollateralUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.liquidationLimitUsd).eq(0) ? '0' : new Dec(payload.suppliedCollateralUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  payload.exposure = getExposure(payload.borrowedUsd, payload.suppliedUsd);

  return payload;
};
