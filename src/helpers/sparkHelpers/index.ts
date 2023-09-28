import Dec from 'decimal.js';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import {
  SparkAggregatedPositionData,
  SparkAssetsData, SparkHelperCommon, SparkUsedAssets,
} from '../../types';
import { calculateNetApy } from '../../staking';
import { wethToEth } from '../../services/utils';

export const sparkIsInIsolationMode = ({ usedAssets, assetsData }: { usedAssets: SparkUsedAssets, assetsData: SparkAssetsData }) => Object.values(usedAssets).some(({ symbol, collateral }) => collateral && assetsData[symbol].isIsolated);

export const sparkGetCollSuppliedAssets = ({ usedAssets }: { usedAssets: SparkUsedAssets }) => Object.values(usedAssets).filter(({ isSupplied, collateral }) => isSupplied && collateral);

export const sparkGetSuppliableAssets = ({
  usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest
}: SparkHelperCommon) => {
  const data = {
    usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest,
  };

  const collAccountAssets = sparkGetCollSuppliedAssets(data);
  const marketAssets = Object.values(assetsData);

  if (sparkIsInIsolationMode(data)) {
    const collAsset = collAccountAssets[0].symbol;
    return marketAssets.filter(d => d.canBeSupplied).map(({ symbol }) => ({ symbol, canBeCollateral: symbol === collAsset }));
  }

  return marketAssets.filter(d => d.canBeSupplied).map(({ symbol, isIsolated }) => ({ symbol, canBeCollateral: !isIsolated }));
};

export const sparkGetSuppliableAsCollAssets = ({
  usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest
}: SparkHelperCommon) => sparkGetSuppliableAssets({
  usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest,
}).filter(({ canBeCollateral }) => canBeCollateral);

export const sparkGetEmodeMutableProps = ({
  eModeCategory,
  assetsData,
}: SparkHelperCommon,
_asset: string) => {
  const asset = wethToEth(_asset);

  const assetData = assetsData[asset];
  if (
    eModeCategory === 0
    || assetData.eModeCategory !== eModeCategory
    || new Dec(assetData?.eModeCategoryData?.collateralFactor || 0).eq(0)
  ) {
    const { liquidationRatio, collateralFactor } = assetData;
    return ({ liquidationRatio, collateralFactor });
  }
  const { liquidationRatio, collateralFactor } = assetData.eModeCategoryData;
  return ({ liquidationRatio, collateralFactor });
};

export const sparkGetAggregatedPositionData = ({
  usedAssets,
  eModeCategory,
  eModeCategories,
  assetsData,
  selectedMarket,
  network,
  ...rest
}: SparkHelperCommon): SparkAggregatedPositionData => {
  const data = {
    usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest,
  };
  const payload = {} as SparkAggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  payload.borrowLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(sparkGetEmodeMutableProps(data, symbol).collateralFactor),
  );
  payload.liquidationLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(sparkGetEmodeMutableProps(data, symbol).liquidationRatio),
  );
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = +payload.suppliedUsd ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = +payload.suppliedUsd ? new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy(usedAssets, assetsData);
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  payload.liqRatio = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).toString();
  payload.liqPercent = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = data.assetsData[leveragedAsset].price; // TODO sparkPrice or price??
    if (leveragedType === 'lsd-leverage') {
      // Treat ETH like a stablecoin in a long stETH position
      payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedAsset].price).div(assetsData.ETH.price).toDP(18).toString();
      assetPrice = new Dec(assetPrice).div(assetsData.ETH.price).toString();
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }
  return payload;
};