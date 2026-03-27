import Dec from 'decimal.js';
import {
  aprToApy,
  calcLeverageLiqPrice,
  getAssetsTotal,
  STABLE_ASSETS,
} from '../../moneymarket';
import { calculateInterestEarned } from '../../staking';
import {
  AaveV4AggregatedPositionData,
  AaveV4AssetsData,
  AaveV4ReserveAssetData,
  AaveV4UsedReserveAsset,
  AaveV4UsedReserveAssets,
  LeverageType,
  NetworkNumber,
} from '../../types';

export const calcUserRiskPremiumBps = (usedAssets: AaveV4UsedReserveAssets, assetsData: AaveV4AssetsData): number => {
  type CollateralInfo = { riskBps: number; valueUsd: Dec };
  type DebtInfo = { valueUsd: Dec };

  const collaterals: CollateralInfo[] = [];
  const debts: DebtInfo[] = [];

  Object.entries(usedAssets).forEach(([identifier, asset]) => {
    const reserveData = assetsData[identifier];
    if (!reserveData) return;

    const borrowedUsdDec = new Dec(asset.borrowedUsd || '0');
    if (asset.isBorrowed && borrowedUsdDec.gt(0)) {
      debts.push({ valueUsd: borrowedUsdDec });
    }

    const suppliedUsdDec = new Dec(asset.suppliedUsd || '0');
    const isActiveCollateral = asset.collateral
      && asset.isSupplied
      && asset.collateralFactor > 0
      && suppliedUsdDec.gt(0);

    if (isActiveCollateral) {
      // collateralRisk is stored as a fraction (e.g. 0.25), convert back to bps
      const riskBps = new Dec(reserveData.collateralRisk).mul(10000).toNumber();
      collaterals.push({
        riskBps,
        valueUsd: suppliedUsdDec,
      });
    }
  });

  const totalDebtUsd = debts.reduce((sum, d) => sum.add(d.valueUsd), new Dec(0));

  if (totalDebtUsd.lte(0)) {
    return 0;
  }

  // sort by risk ASC, value DESC
  collaterals.sort((a, b) => {
    if (a.riskBps !== b.riskBps) return a.riskBps - b.riskBps;
    return b.valueUsd.comparedTo(a.valueUsd);
  });

  let debtLeftToCover = totalDebtUsd;
  let numerator = new Dec(0); // sum(coveredUsd * riskBps)
  let coveredDebt = new Dec(0); // sum(coveredUsd)

  collaterals.forEach(({ riskBps, valueUsd }) => {
    if (debtLeftToCover.lte(0)) return;

    const coveredUsd = Dec.min(valueUsd, debtLeftToCover);

    numerator = numerator.add(coveredUsd.mul(riskBps));
    coveredDebt = coveredDebt.add(coveredUsd);

    debtLeftToCover = debtLeftToCover.sub(coveredUsd);
  });

  if (coveredDebt.lte(0)) {
    return 0;
  }

  const riskPremiumBps = numerator.div(coveredDebt);
  return riskPremiumBps.toNumber();
};

export const getApyAfterValuesEstimation = (
  usedAssets: AaveV4UsedReserveAssets,
  assetsData: AaveV4AssetsData,
): Record<string, { borrowRate: string; supplyRate: string }> => {
  const riskPremiumBps = calcUserRiskPremiumBps(usedAssets, assetsData);
  const riskPremiumFraction = new Dec(riskPremiumBps).div(10000); // bps to fraction

  const result: Record<string, { borrowRate: string; supplyRate: string }> = {};

  Object.entries(assetsData).forEach(([identifier, assetData]) => {
    const drawnRate = new Dec(assetData.drawnRate);
    const baseBorrowApr = drawnRate.mul(100);
    // finalBorrowRate = baseBorrowRate * (1 + riskPremiumFraction)
    const userBorrowApr = baseBorrowApr.mul(new Dec(1).add(riskPremiumFraction));

    result[identifier] = {
      borrowRate: aprToApy(userBorrowApr.toString()),
      // Supply rate is market-level (not user-specific), use existing value
      supplyRate: assetData.supplyRate,
    };
  });

  return result;
};

export const calculateNetApyAaveV4 = ({
  usedAssets,
  assetsData,
}: {
  usedAssets: AaveV4UsedReserveAssets,
  assetsData: AaveV4AssetsData,
}) => {
  const riskPremiumBps = calcUserRiskPremiumBps(usedAssets, assetsData);
  const riskPremiumFraction = new Dec(riskPremiumBps).div(10000);

  const sumValues = Object.entries(usedAssets).reduce((_acc, [identifier, usedAsset]) => {
    const acc = { ..._acc };
    const assetData = assetsData[identifier];
    if (!assetData) return acc;

    if (usedAsset.isSupplied) {
      const amount = usedAsset.suppliedUsd;
      acc.suppliedUsd = new Dec(acc.suppliedUsd).add(amount).toString();
      const supplyInterest = calculateInterestEarned(amount, assetData.supplyRate, 'year', true);
      acc.supplyInterest = new Dec(acc.supplyInterest).add(supplyInterest.toString()).toString();

      if (assetData.supplyIncentives) {
        for (const supplyIncentive of assetData.supplyIncentives) {
          const incentiveInterest = calculateInterestEarned(amount, supplyIncentive.apy, 'year', true);
          acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
        }
      }
    }

    if (usedAsset.isBorrowed) {
      const amount = usedAsset.borrowedUsd;
      acc.borrowedUsd = new Dec(acc.borrowedUsd).add(amount).toString();
      // User borrow rate = baseRate * (1 + riskPremiumFraction)
      const drawnRate = new Dec(assetData.drawnRate);
      const baseBorrowApr = drawnRate.mul(100);
      const userBorrowApr = baseBorrowApr.mul(new Dec(1).add(riskPremiumFraction));
      const userBorrowRate = aprToApy(userBorrowApr.toString());
      const borrowInterest = calculateInterestEarned(amount, userBorrowRate, 'year', true);
      acc.borrowInterest = new Dec(acc.borrowInterest).sub(borrowInterest.toString()).toString();

      if (assetData.borrowIncentives) {
        for (const borrowIncentive of assetData.borrowIncentives) {
          const incentiveInterest = calculateInterestEarned(amount, borrowIncentive.apy, 'year', true);
          acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
        }
      }
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
  const netApy = balance.isZero() ? '0' : new Dec(totalInterestUsd).div(balance).times(100).toString();

  return { netApy, totalInterestUsd, incentiveUsd };
};

export const aaveV4GetCollateralFactor = (assetData: AaveV4ReserveAssetData, usedAssetData: AaveV4UsedReserveAsset, useUserCollateralFactor: boolean = false): number => (useUserCollateralFactor ? usedAssetData.collateralFactor : assetData.collateralFactor);

export const isLeveragedPosAaveV4 = (usedAssets: AaveV4UsedReserveAssets, dustLimit = 5) => {
  let borrowUnstable = 0;
  let supplyStable = 0;
  let borrowStable = 0;
  let supplyUnstable = 0;
  let longAsset = '';
  let shortAsset = '';
  Object.values(usedAssets).forEach(({
    symbol, suppliedUsd, borrowedUsd, collateral, reserveId,
  }) => {
    const spokeAsset = `${symbol}-${reserveId}`;
    const isSupplied = (+suppliedUsd) > dustLimit; // ignore dust like <limit leftover supply
    const isBorrowed = (+borrowedUsd) > dustLimit; // ignore dust like <limit leftover supply
    if (isSupplied && STABLE_ASSETS.includes(symbol) && collateral) supplyStable += 1;
    if (isBorrowed && STABLE_ASSETS.includes(symbol)) borrowStable += 1;
    if (isBorrowed && !STABLE_ASSETS.includes(symbol)) {
      borrowUnstable += 1;
      shortAsset = spokeAsset;
    }
    if (isSupplied && !STABLE_ASSETS.includes(symbol) && collateral) {
      supplyUnstable += 1;
      longAsset = spokeAsset;
    }
  });
  const isLong = borrowStable > 0 && borrowUnstable === 0 && supplyUnstable === 1 && supplyStable === 0;
  const isShort = supplyStable > 0 && supplyUnstable === 0 && borrowUnstable === 1 && borrowStable === 0;
  const isVolatilePair = supplyUnstable === 1 && borrowUnstable === 1 && supplyStable === 0 && borrowStable === 0;
  if (isLong) {
    return {
      leveragedType: LeverageType.Long,
      leveragedAsset: longAsset,
    };
  }
  if (isShort) {
    return {
      leveragedType: LeverageType.Short,
      leveragedAsset: shortAsset,
    };
  }
  if (isVolatilePair) {
    return {
      leveragedType: LeverageType.VolatilePair,
      leveragedAsset: longAsset,
    };
  }
  return {
    leveragedType: LeverageType.None,
    leveragedAsset: '',
  };
};

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
  const { leveragedType, leveragedAsset } = isLeveragedPosAaveV4(usedAssets);
  payload.leveragedType = leveragedType;
  payload.leveragedAsset = leveragedAsset;
  payload.liquidationPrice = '';
  if (leveragedType !== '') {
    const leveragedAssetData = assetsData[leveragedAsset];
    let assetPrice = leveragedAssetData?.price || '0';
    if (leveragedType === LeverageType.VolatilePair) {
      const borrowedAsset = (Object.values(usedAssets) as AaveV4UsedReserveAsset[]).find(({ borrowedUsd }: { borrowedUsd: string }) => +borrowedUsd > 0);
      const borrowedAssetPrice = assetsData[`${borrowedAsset!.symbol}-${borrowedAsset!.reserveId}`].price;
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
  payload.minCollRatio = new Dec(payload.suppliedCollateralUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.suppliedCollateralUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  //   payload.healthRatio = new Dec(payload.liquidationLimitUsd).div(payload.borrowedUsd).toDP(4).toString();
  payload.minHealthRatio = new Dec(payload.liquidationLimitUsd).div(payload.borrowLimitUsd).toDP(4).toString();

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApyAaveV4({ usedAssets, assetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  return payload;
};