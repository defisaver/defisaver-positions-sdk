import Dec from 'decimal.js';
import { assetAmountInWei, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  AaveAssetData, AaveHelperCommon, AaveMarketInfo, AaveV3AggregatedPositionData, AaveV3AssetsData, AaveV3UsedAsset, AaveV3UsedAssets, AaveVersions,
} from '../../types';
import { getNativeAssetFromWrapped, getWrappedNativeAssetFromUnwrapped } from '../../services/utils';
import {
  aprToApy, calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos,
} from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import { borrowOperations } from '../../constants';
import {
  EthAddress, EthereumProvider, LeverageType, NetworkNumber,
} from '../../types/common';
import { AaveLoanInfoV2ContractViem, AaveV3ViewContractViem } from '../../contracts';
import { getViemProvider } from '../../services/viem';

export const AAVE_V3_MARKETS = [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi];

export const isAaveV2 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => selectedMarket.value === AaveVersions.AaveV2;
export const isAaveV3 = ({ selectedMarket }: { selectedMarket: Partial<AaveMarketInfo> }) => AAVE_V3_MARKETS.includes(selectedMarket.value as AaveVersions);

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
  const asset = getNativeAssetFromWrapped(_asset);

  const assetData = assetsData[asset];
  const eModeCategoryData: { collateralAssets: string[], collateralFactor: string, liquidationRatio: string, ltvZeroAssets: string[] } = eModeCategoriesData?.[eModeCategory] || {
    collateralAssets: [], ltvZeroAssets: [], collateralFactor: '0', liquidationRatio: '0',
  };

  if (
    eModeCategory === 0
    || !eModeCategoryData.collateralAssets.includes(asset)
    || new Dec(eModeCategoryData.collateralFactor || 0).eq(0)
  ) {
    const { liquidationRatio, collateralFactor } = assetData;
    return ({ liquidationRatio, collateralFactor });
  }
  if (eModeCategoryData.ltvZeroAssets.includes(asset)) return ({ liquidationRatio: '0', collateralFactor: '0' });

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
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(aaveAnyGetEmodeMutableProps(data, symbol).collateralFactor),
  );
  payload.liquidationLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(aaveAnyGetEmodeMutableProps(data, symbol).liquidationRatio),
  );
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
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
    let assetPrice = data.assetsData[leveragedAsset].price;
    if (leveragedType === LeverageType.VolatilePair) {
      const borrowedAsset = (Object.values(usedAssets) as AaveV3UsedAsset[]).find(({ borrowedUsd }: { borrowedUsd: string }) => +borrowedUsd > 0);
      const borrowedAssetPrice = data.assetsData[borrowedAsset!.symbol].price;
      const leveragedAssetPrice = data.assetsData[leveragedAsset].price;
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
  payload.healthRatio = new Dec(payload.liquidationLimitUsd).div(payload.borrowedUsd).toDP(4).toString();
  payload.minHealthRatio = new Dec(payload.liquidationLimitUsd).div(payload.borrowLimitUsd).toDP(4).toString();

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({
    usedAssets,
    assetsData,
    optionalData: { healthRatio: payload.healthRatio },
  });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  return payload;
};

const getApyAfterValuesEstimationInner = async (selectedMarket: AaveMarketInfo, actions: [{ action: string, amount: string, asset: string }], client: Client, network: NetworkNumber) => {
  const params = actions.map(({ action, asset, amount }) => {
    const isDebtAsset = borrowOperations.includes(action);
    const amountInWei = assetAmountInWei(amount, asset);
    const assetInfo = getAssetInfo(getWrappedNativeAssetFromUnwrapped(asset), network);
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
  const viewContract = isAaveV2({ selectedMarket }) ? AaveLoanInfoV2ContractViem(client, network) : AaveV3ViewContractViem(client, network);
  const data = await viewContract.read.getApyAfterValuesEstimation([selectedMarket.providerAddress, params]);
  const rates: { [key: string]: { supplyRate: string, borrowRate: string } } = {};
  data.forEach((d: { reserveAddress: EthAddress, supplyRate: BigInt, variableBorrowRate: BigInt }) => {
    const asset = getNativeAssetFromWrapped(getAssetInfoByAddress(d.reserveAddress, network).symbol);
    rates[asset] = {
      supplyRate: aprToApy(new Dec(d.supplyRate.toString()).div(1e25).toString()),
      borrowRate: aprToApy(new Dec(d.variableBorrowRate.toString()).div(1e25).toString()),
    };
  });
  return rates;
};

export const getApyAfterValuesEstimation = async (selectedMarket: AaveMarketInfo, actions: [{ action: string, amount: string, asset: string }], provider: EthereumProvider, network: NetworkNumber) => getApyAfterValuesEstimationInner(selectedMarket, actions, getViemProvider(provider, network), network);

/**
 * won't cover all cases
 */
export const getAaveUnderlyingSymbol = (_symbol = '') => {
  let symbol = _symbol
    .replace(/^aEthLido/, '')
    .replace(/^aEthEtherFi/, '')
    .replace(/^aEth/, '')
    .replace(/^aArb/, '')
    .replace(/^aOpt/, '')
    .replace(/^aLin/, '')
    .replace(/^aPla/, '')
    .replace(/^aBas/, '');
  if (symbol.startsWith('a')) symbol = symbol.slice(1);
  return getNativeAssetFromWrapped(symbol);
};