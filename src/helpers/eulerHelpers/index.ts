import Dec from 'decimal.js';
import Web3 from 'web3';
import {
  EthAddress, NetworkNumber,
} from '../../types/common';
import {
  calcLeverageLiqPrice, getAssetsTotal, STABLE_ASSETS,
} from '../../moneymarket';
import { calculateInterestEarned } from '../../staking';
import {
  EulerV2AggregatedPositionData,
  EulerV2AssetsData,
  EulerV2Market,
  EulerV2UsedAssets,
} from '../../types';
import { EulerV2ViewContract } from '../../contracts';

export const isLeveragedPos = (usedAssets: EulerV2UsedAssets, dustLimit = 5) => {
  let borrowUnstable = 0;
  let supplyStable = 0;
  let borrowStable = 0;
  let supplyUnstable = 0;
  let longAsset = '';
  let shortAsset = '';
  let leverageAssetVault = '';
  Object.values(usedAssets).forEach(({
    symbol, suppliedUsd, borrowedUsd, collateral, vaultAddress,
  }) => {
    const isSupplied = (+suppliedUsd) > dustLimit; // ignore dust like <limit leftover supply
    const isBorrowed = (+borrowedUsd) > dustLimit; // ignore dust like <limit leftover supply
    if (isSupplied && STABLE_ASSETS.includes(symbol) && collateral) supplyStable += 1;
    if (isBorrowed && STABLE_ASSETS.includes(symbol)) borrowStable += 1;
    if (isBorrowed && !STABLE_ASSETS.includes(symbol)) {
      borrowUnstable += 1;
      shortAsset = symbol;
      leverageAssetVault = vaultAddress;
    }
    if (isSupplied && !STABLE_ASSETS.includes(symbol) && collateral) {
      supplyUnstable += 1;
      longAsset = symbol;
      leverageAssetVault = vaultAddress;
    }
  });
  const isLong = borrowStable > 0 && borrowUnstable === 0 && supplyUnstable === 1 && supplyStable === 0;
  const isShort = supplyStable > 0 && supplyUnstable === 0 && borrowUnstable === 1 && borrowStable === 0;
  // lsd -> liquid staking derivative
  const isLsdLeveraged = supplyUnstable === 1 && borrowUnstable === 1 && shortAsset === 'ETH' && ['stETH', 'wstETH', 'cbETH', 'rETH'].includes(longAsset);
  if (isLong) {
    return {
      leveragedType: 'long',
      leveragedAsset: longAsset,
      leveragedVault: leverageAssetVault,
    };
  }
  if (isShort) {
    return {
      leveragedType: 'short',
      leveragedAsset: shortAsset,
      leveragedVault: leverageAssetVault,
    };
  }
  if (isLsdLeveraged) {
    return {
      leveragedType: 'lsd-leverage',
      leveragedAsset: longAsset,
      leveragedVault: leverageAssetVault,
    };
  }
  return {
    leveragedType: '',
    leveragedAsset: '',
    leveragedVault: '',
  };
};

export const getEulerV2AggregatedData = ({
  usedAssets, assetsData, network, ...rest
}: { usedAssets: EulerV2UsedAssets, assetsData: EulerV2AssetsData, network: NetworkNumber }) => {
  const payload = {} as EulerV2AggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  payload.borrowLimitUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ vaultAddress, suppliedUsd }: { vaultAddress: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[vaultAddress.toLowerCase()].collateralFactor));
  payload.liquidationLimitUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ vaultAddress, suppliedUsd }: { vaultAddress: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[vaultAddress.toLowerCase()].liquidationRatio));
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = +payload.suppliedUsd ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = +payload.suppliedUsd ? new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy(usedAssets, assetsData);
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  payload.minRatio = '100';
  payload.liqRatio = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).toString();
  payload.liqPercent = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  const { leveragedType, leveragedAsset, leveragedVault } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedVault.toLowerCase()].price;
    if (leveragedType === 'lsd-leverage') {
      const ethAsset = Object.values(assetsData).find((asset) => ['WETH', 'ETH'].includes(asset.symbol));
      if (ethAsset) {
        payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedVault.toLowerCase()].price).div(ethAsset.price).toString();
        assetPrice = new Dec(assetPrice).div(ethAsset.price).toString();
      }
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }
  return payload;
};

export const calculateNetApy = (usedAssets: EulerV2UsedAssets, assetsData: EulerV2AssetsData) => {
  const sumValues = Object.values(usedAssets).reduce((_acc, usedAsset) => {
    const acc = { ..._acc };
    const assetData = assetsData[usedAsset.vaultAddress.toLowerCase()];

    if (usedAsset.isSupplied) {
      const amount = usedAsset.suppliedUsd;
      acc.suppliedUsd = new Dec(acc.suppliedUsd).add(amount).toString();
      const rate = assetData.supplyRate;
      const supplyInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.supplyInterest = new Dec(acc.supplyInterest).add(supplyInterest.toString()).toString();
    }

    if (usedAsset.isBorrowed) {
      const amount = usedAsset.borrowedUsd;
      acc.borrowedUsd = new Dec(acc.borrowedUsd).add(amount).toString();
      const rate = assetData.borrowRate;
      const borrowInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.borrowInterest = new Dec(acc.borrowInterest).sub(borrowInterest.toString()).toString();
    }

    return acc;
  }, {
    borrowInterest: '0', supplyInterest: '0', incentiveUsd: '0', borrowedUsd: '0', suppliedUsd: '0',
  });

  const {
    borrowedUsd, suppliedUsd, borrowInterest, supplyInterest, incentiveUsd,
  } = sumValues;

  const totalInterestUsd = new Dec(borrowInterest).add(supplyInterest).add(incentiveUsd).toString();
  const balance = new Dec(suppliedUsd).sub(borrowedUsd);
  const netApy = new Dec(totalInterestUsd).div(balance).times(100).toString();

  return { netApy, totalInterestUsd, incentiveUsd };
};

export const getApyAfterValuesEstimationEulerV2 = async (selectedMarket: EulerV2Market, action: string, asset: string, amount: string, account: EthAddress, web3: Web3, network: NetworkNumber) => {
  const eulerV2ViewContract = EulerV2ViewContract(web3, network);
};