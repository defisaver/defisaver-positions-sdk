import Dec from 'decimal.js';
import {
  AaveAssetData, AaveHelperCommon, AaveMarketInfo, AaveV3AggregatedPositionData, AaveV3AssetsData, AaveV3UsedAssets, AaveVersions,
} from '../../types';
import { wethToEth } from '../../services/utils';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import { calculateNetApy } from '../../staking';

export const isAaveV3 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => selectedMarket.value === AaveVersions.AaveV3;
export const isMorphoAaveV2 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => selectedMarket.value === AaveVersions.MorphoAaveV2;
export const isMorphoAaveV3 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => selectedMarket.value === AaveVersions.MorphoAaveV3Eth;
export const isMorphoAave = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => isMorphoAaveV2({ selectedMarket }) || isMorphoAaveV3({ selectedMarket });

export const aaveV3IsInIsolationMode = ({ usedAssets, assetsData }: { usedAssets: AaveV3UsedAssets, assetsData: AaveV3AssetsData }) => Object.values(usedAssets).some(({ symbol, collateral }) => collateral && assetsData[symbol].isIsolated);
export const aaveV3IsInSiloedMode = ({ usedAssets, assetsData }: { usedAssets: AaveV3UsedAssets, assetsData: AaveV3AssetsData }) => Object.values(usedAssets).some(({ symbol, debt }) => debt && assetsData[symbol].isSiloed);

export const aaveAnyGetCollSuppliedAssets = ({ usedAssets }: { usedAssets: AaveV3UsedAssets }) => Object.values(usedAssets)
  .filter(({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral);

export const aaveAnyGetSuppliableAssets = ({
  usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest
}: AaveHelperCommon) => {
  const data = {
    usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest,
  };

  const collAccountAssets = aaveAnyGetCollSuppliedAssets(data);
  const marketAssets = Object.values(assetsData) as AaveAssetData[];

  if (isMorphoAave({ selectedMarket })) {
    return marketAssets.filter(({ canBeSupplied }) => canBeSupplied,
    ).map(a => ({ ...a, canBeCollateral: new Dec(assetsData[a.symbol].collateralFactor).gt(0) }));
  }

  if (collAccountAssets.length === 0 || !isAaveV3(data)) return marketAssets.filter(({ canBeSupplied }) => canBeSupplied).map(({ symbol }) => ({ symbol, canBeCollateral: true }));

  if (aaveV3IsInIsolationMode(data)) {
    const collAsset = collAccountAssets[0].symbol;
    return marketAssets.filter(d => d.canBeSupplied).map(({ symbol }) => ({ symbol, canBeCollateral: symbol === collAsset }));
  }

  return marketAssets.filter(d => d.canBeSupplied).map(({ symbol, isIsolated }) => ({ symbol, canBeCollateral: !isIsolated }));
};

export const aaveAnyGetSuppliableAsCollAssets = ({
  usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest
}: AaveHelperCommon) => aaveAnyGetSuppliableAssets({
  usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest,
}).filter(({ canBeCollateral }) => canBeCollateral);

export const aaveAnyGetEmodeMutableProps = (
  {
    eModeCategory,
    assetsData,
  }: AaveHelperCommon, _asset: string) => {
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

export const aaveAnyGetAggregatedPositionData = ({
  usedAssets,
  eModeCategory,
  eModeCategories,
  assetsData,
  selectedMarket,
  network,
  ...rest
}: AaveHelperCommon): AaveV3AggregatedPositionData => {
  const data = {
    usedAssets, eModeCategory, eModeCategories, assetsData, selectedMarket, network, ...rest,
  };
  const payload = {} as AaveV3AggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => {
      const suppliedUsdAmount = isMorphoAaveV3(data)
        // Morpho has a slightly different method for calculating health ratio than underlying pool (To account for potential errors in rounding)
        ? new Dec(suppliedUsd).minus(new Dec(suppliedUsd).div(100).times(0.1)).toString()
        : suppliedUsd;

      return new Dec(suppliedUsdAmount).mul(aaveAnyGetEmodeMutableProps(data, symbol).collateralFactor);
    },
  );
  payload.liquidationLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => {
      const suppliedUsdAmount = isMorphoAaveV3(data)
        // Morpho has a slightly different method for calculating health ratio than underlying pool (To account for potential errors in rounding)
        ? new Dec(suppliedUsd).minus(new Dec(suppliedUsd).div(100).times(0.1)).toString()
        : suppliedUsd;

      return new Dec(suppliedUsdAmount).mul(aaveAnyGetEmodeMutableProps(data, symbol).liquidationRatio);
    },
  );
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = +payload.suppliedUsd ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = +payload.suppliedUsd ? new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy(usedAssets, assetsData, isMorphoAave({ selectedMarket }));
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  payload.liqRatio = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).toString();
  payload.liqPercent = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = data.assetsData[leveragedAsset].price;
    if (leveragedType === 'lsd-leverage') {
      // Treat ETH like a stablecoin in a long stETH position
      payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedAsset].price).div(assetsData.ETH.price).toDP(18).toString();
      assetPrice = new Dec(assetPrice).div(assetsData.ETH.price).toString();
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }
  return payload;
};