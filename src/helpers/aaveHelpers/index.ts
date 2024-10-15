import Dec from 'decimal.js';
import { assetAmountInWei, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import Web3 from 'web3';
import {
  AaveAssetData, AaveHelperCommon, AaveMarketInfo, AaveV3AggregatedPositionData, AaveV3AssetsData, AaveV3UsedAssets, AaveVersions,
} from '../../types';
import { ethToWeth, wethToEth } from '../../services/utils';
import {
  aprToApy, calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos,
} from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import { borrowOperations } from '../../constants';
import { EthAddress, NetworkNumber } from '../../types/common';
import { AaveLoanInfoV2Contract, AaveV3ViewContract } from '../../contracts';
import { BaseContract } from '../../types/contracts/generated/types';

export const AAVE_V3_MARKETS = [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi];

export const isAaveV2 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => selectedMarket.value === AaveVersions.AaveV2;
export const isAaveV3 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => AAVE_V3_MARKETS.includes(selectedMarket.value as AaveVersions);
export const isMorphoAaveV2 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => selectedMarket.value === AaveVersions.MorphoAaveV2;
export const isMorphoAaveV3 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => selectedMarket.value === AaveVersions.MorphoAaveV3Eth;
export const isMorphoAave = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => isMorphoAaveV2({ selectedMarket }) || isMorphoAaveV3({ selectedMarket });

export const aaveV3IsInIsolationMode = ({ usedAssets, assetsData }: { usedAssets: AaveV3UsedAssets, assetsData: AaveV3AssetsData }) => Object.values(usedAssets).some(({ symbol, collateral }) => collateral && assetsData[symbol].isIsolated);
export const aaveV3IsInSiloedMode = ({ usedAssets, assetsData }: { usedAssets: AaveV3UsedAssets, assetsData: AaveV3AssetsData }) => Object.values(usedAssets).some(({ symbol, debt }) => debt && assetsData[symbol].isSiloed);

export const aaveAnyGetCollSuppliedAssets = ({ usedAssets }: { usedAssets: AaveV3UsedAssets }) => Object.values(usedAssets)
  .filter(({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral);

export const aaveAnyGetSuppliableAssets = ({
  usedAssets, eModeCategory, assetsData, selectedMarket, network, ...rest
}: AaveHelperCommon) => {
  const data = {
    usedAssets, eModeCategory, assetsData, selectedMarket, network, ...rest,
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
  usedAssets, eModeCategory, assetsData, selectedMarket, network, ...rest
}: AaveHelperCommon) => aaveAnyGetSuppliableAssets({
  usedAssets, eModeCategory, assetsData, selectedMarket, network, ...rest,
}).filter(({ canBeCollateral }) => canBeCollateral);

export const aaveAnyGetEmodeMutableProps = (
  {
    eModeCategory,
    eModeCategoriesData,
    assetsData,
  }: AaveHelperCommon, _asset: string) => {
  const asset = wethToEth(_asset);

  const assetData = assetsData[asset];
  const eModeCategoryData: { collateralAssets: string[], collateralFactor: string, liquidationRatio: string } = eModeCategoriesData?.[eModeCategory] || { collateralAssets: [], collateralFactor: '0', liquidationRatio: '0' };

  if (
    eModeCategory === 0
    || !eModeCategoryData.collateralAssets.includes(asset)
    || new Dec(eModeCategoryData.collateralFactor || 0).eq(0)
  ) {
    const { liquidationRatio, collateralFactor } = assetData;
    return ({ liquidationRatio, collateralFactor });
  }
  const { liquidationRatio, collateralFactor } = eModeCategoryData;
  return ({ liquidationRatio, collateralFactor });
};

export const aaveAnyGetAggregatedPositionData = ({
  usedAssets,
  eModeCategory,
  assetsData,
  selectedMarket,
  network,
  ...rest
}: AaveHelperCommon): AaveV3AggregatedPositionData => {
  const data = {
    usedAssets, eModeCategory, assetsData, selectedMarket, network, ...rest,
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
  payload.leveragedAsset = leveragedAsset;
  payload.liquidationPrice = '';
  if (leveragedType !== '') {
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

const getApyAfterValuesEstimationInner = async (selectedMarket: AaveMarketInfo, actions: [{ action: string, amount: string, asset: string }], viewContract: BaseContract, network: NetworkNumber) => {
  const params = actions.map(({ action, asset, amount }) => {
    const isDebtAsset = borrowOperations.includes(action);
    const amountInWei = assetAmountInWei(amount, asset);
    const assetInfo = getAssetInfo(ethToWeth(asset), network);
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
      reserveAddress: assetInfo.address,
      liquidityAdded,
      liquidityTaken,
      isDebtAsset,
    };
  });
  const data = await viewContract.methods.getApyAfterValuesEstimation(
    selectedMarket.providerAddress,
    params,
  ).call();
  const rates: { [key: string]: { supplyRate: string, borrowRate: string } } = {};
  data.forEach((d: { reserveAddress: EthAddress, supplyRate: string, variableBorrowRate: string }) => {
    const asset = wethToEth(getAssetInfoByAddress(d.reserveAddress, network).symbol);
    rates[asset] = {
      supplyRate: aprToApy(new Dec(d.supplyRate.toString()).div(1e25).toString()),
      borrowRate: aprToApy(new Dec(d.variableBorrowRate.toString()).div(1e25).toString()),
    };
  });
  return rates;
};

export const getApyAfterValuesEstimation = async (selectedMarket: AaveMarketInfo, actions: [{ action: string, amount: string, asset: string }], web3: Web3, network: NetworkNumber) => {
  if (isAaveV2({ selectedMarket }) || isMorphoAaveV2({ selectedMarket })) {
    return getApyAfterValuesEstimationInner(selectedMarket, actions, AaveLoanInfoV2Contract(web3, network), network);
  }
  if (isAaveV3({ selectedMarket }) || isMorphoAaveV3({ selectedMarket })) {
    return getApyAfterValuesEstimationInner(selectedMarket, actions, AaveV3ViewContract(web3, network), network);
  }

  return {};
};