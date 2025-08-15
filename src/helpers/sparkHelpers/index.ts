import Dec from 'decimal.js';
import { assetAmountInWei, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import {
  aprToApy, calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos,
} from '../../moneymarket';
import {
  SparkAggregatedPositionData,
  SparkAssetsData, SparkHelperCommon, SparkMarketData, SparkUsedAssets,
} from '../../types';
import { calculateNetApy } from '../../staking';
import { ethToWeth, wethToEth } from '../../services/utils';
import { SparkViewContractViem } from '../../contracts';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import { borrowOperations } from '../../constants';
import { getViemProvider } from '../../services/viem';

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
}: SparkHelperCommon, _asset: string) => {
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
  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData });
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
  payload.minCollRatio = new Dec(payload.suppliedCollateralUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.suppliedCollateralUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  payload.healthRatio = new Dec(payload.liquidationLimitUsd).div(payload.borrowedUsd).toDP(4).toString();
  payload.minHealthRatio = new Dec(payload.liquidationLimitUsd).div(payload.borrowLimitUsd).toDP(4).toString();
  return payload;
};

export const getApyAfterValuesEstimation = async (selectedMarket: SparkMarketData, actions: [{ action: string, amount: string, asset: string }], provider: EthereumProvider) => {
  const client = getViemProvider(provider, NetworkNumber.Eth);
  const sparkViewContract = SparkViewContractViem(client, NetworkNumber.Eth);
  const params = actions.map(({ action, asset, amount }: { action: string, amount: string, asset: string }) => {
    const isDebtAsset = borrowOperations.includes(action);
    const amountInWei = assetAmountInWei(amount, asset);
    const assetInfo = getAssetInfo(ethToWeth(asset));
    let liquidityAdded;
    let liquidityTaken;
    if (isDebtAsset) {
      liquidityAdded = action === 'payback' ? amountInWei : '0';
      liquidityTaken = action === 'borrow' ? amountInWei : '0';
    } else {
      liquidityAdded = action === 'collateral' ? amountInWei : '0';
      liquidityTaken = action === 'withdraw' ? amountInWei : '0';
    }
    return {
      reserveAddress: assetInfo.address as EthAddress,
      liquidityAdded: BigInt(liquidityAdded),
      liquidityTaken: BigInt(liquidityTaken),
      isDebtAsset,
    };
  });
  const data = await sparkViewContract.read.getApyAfterValuesEstimation([
    selectedMarket.providerAddress,
    params,
  ]);
  const rates: { [key: string]: { supplyRate: string, borrowRate: string } } = {};
  data.forEach((d) => {
    const asset = wethToEth(getAssetInfoByAddress(d.reserveAddress).symbol);
    rates[asset] = {
      supplyRate: aprToApy(new Dec(d.supplyRate.toString()).div(1e25).toString()),
      borrowRate: aprToApy(new Dec(d.variableBorrowRate.toString()).div(1e25).toString()),
    };
  });
  return rates;
};
