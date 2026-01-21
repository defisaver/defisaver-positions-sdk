import Dec from 'decimal.js';
import { assetAmountInWei, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import {
  BaseAdditionalAssetData, CompoundAggregatedPositionData, CompoundMarketData, CompoundV2AssetsData, CompoundV2UsedAssets, CompoundV3AssetData, CompoundV3AssetsData, CompoundV3UsedAsset, CompoundV3UsedAssets, CompoundVersions,
} from '../../types';
import {
  addToArrayIf, getEthAmountForDecimals, handleWbtcLegacy, wethToEth,
} from '../../services/utils';
import { BLOCKS_IN_A_YEAR, borrowOperations, SECONDS_PER_YEAR } from '../../constants';
import {
  aprToApy, calcLeverageLiqPrice, calculateBorrowingAssetLimit, getAssetsTotal, isLeveragedPos,
} from '../../moneymarket';
import { calculateNetApy, getStakingApy, STAKING_ASSETS } from '../../staking';
import {
  EthAddress, EthereumProvider, IncentiveData, IncentiveKind, LeverageType, NetworkNumber,
} from '../../types/common';
import { CompoundLoanInfoContractViem, CompV3ViewContractViem } from '../../contracts';
import { getViemProvider } from '../../services/viem';

export const formatMarketData = (data: any, network: NetworkNumber, baseAssetPrice: string): CompoundV3AssetData => {
  const assetInfo = getAssetInfoByAddress(data.tokenAddr, network);
  const isWETH = assetInfo.symbol === 'WETH';
  const price = getEthAmountForDecimals(data.price, 8);
  return ({
    ...data,
    borrowCollateralFactor: data.borrowCollateralFactor.toString(),
    liquidateCollateralFactor: data.liquidateCollateralFactor.toString(),
    liquidationFactor: data.liquidationFactor.toString(),
    supplyReserved: data.supplyReserved.toString(),
    priceInBaseAsset: getEthAmountForDecimals(data.price, 8),
    price: new Dec(price).mul(baseAssetPrice).toString(),
    collateralFactor: getEthAmountForDecimals(data.borrowCollateralFactor, 18),
    liquidationRatio: getEthAmountForDecimals(data.liquidateCollateralFactor, 18),
    supplyCap: getEthAmountForDecimals(data.supplyCap, assetInfo.decimals),
    totalSupply: getEthAmountForDecimals(data.totalSupply, assetInfo.decimals),
    symbol: isWETH ? 'ETH' : assetInfo.symbol,
    supplyRate: '0',
    borrowRate: '0',
    canBeBorrowed: false,
    canBeSupplied: true,
    supplyIncentives: [],
    borrowIncentives: [],
  });
};

// TODO: maybe not hardcode decimals
export const formatBaseData = (data: any, network: NetworkNumber, baseAssetPrice: string): CompoundV3AssetData & BaseAdditionalAssetData => {
  const assetInfo = getAssetInfoByAddress(data.tokenAddr, network);
  const totalSupply = getEthAmountForDecimals(new Dec(data.totalSupply).mul(data.supplyIndex).toString(), 15 + assetInfo.decimals);
  const totalBorrow = getEthAmountForDecimals(new Dec(data.totalBorrow).mul(data.borrowIndex).toString(), 15 + assetInfo.decimals);
  return ({
    ...data,
    baseBorrowMin: data.baseBorrowMin.toString(),
    baseTrackingBorrowRewardsSpeed: data.baseTrackingBorrowRewardsSpeed.toString(),
    baseTrackingSupplyRewardsSpeed: data.baseTrackingSupplyRewardsSpeed.toString(),
    borrowIndex: data.borrowIndex.toString(),
    supplyIndex: data.supplyIndex.toString(),
    trackingBorrowIndex: data.trackingBorrowIndex.toString(),
    trackingSupplyIndex: data.trackingSupplyIndex.toString(),
    supplyRate: aprToApy(new Dec(data.supplyRate).div(1e18).mul(SECONDS_PER_YEAR).mul(100)
      .toString()),
    borrowRate: aprToApy(new Dec(data.borrowRate).div(1e18).mul(SECONDS_PER_YEAR).mul(100)
      .toString()),
    utilization: getEthAmountForDecimals(data.utilization, 16), // utilization is totalSupply/totalBorrow in 1e18, but we need % so when we mul with 100 it's 16 decimals
    totalSupply,
    totalBorrow,
    marketLiquidity: new Dec(totalSupply).minus(totalBorrow).toString(),
    symbol: wethToEth(assetInfo.symbol),
    priceInBaseAsset: getEthAmountForDecimals(data.price, 8),
    price: baseAssetPrice,
    collateralFactor: '0',
    liquidationRatio: '0',
    canBeBorrowed: true,
    canBeSupplied: true,
    supplyCap: '0',
    rewardSupplySpeed: getEthAmountForDecimals(data.baseTrackingSupplyRewardsSpeed, 15),
    rewardBorrowSpeed: getEthAmountForDecimals(data.baseTrackingBorrowRewardsSpeed, 15),
    minDebt: getEthAmountForDecimals(data.baseBorrowMin, assetInfo.decimals),
    isBase: true,
  });
};

export const getIncentiveApys = async (
  baseData: CompoundV3AssetData & BaseAdditionalAssetData,
  compPrice: string,
): Promise<{
  supplyIncentives: IncentiveData[],
  borrowIncentives: IncentiveData[],
}> => ({
  supplyIncentives: [{
    token: 'COMP',
    apy: aprToApy((100 * SECONDS_PER_YEAR * +baseData.rewardSupplySpeed * +compPrice) / +baseData.price / +baseData.totalSupply).toString(),
    incentiveKind: IncentiveKind.Reward,
    description: 'Eligible for protocol-level COMP incentives.',
  },
  ...addToArrayIf(STAKING_ASSETS.includes(baseData.symbol), {
    apy: await getStakingApy(baseData.symbol),
    token: baseData.symbol,
    incentiveKind: IncentiveKind.Staking,
    description: `Native ${baseData.symbol} yield.`,
  }),
  ],
  borrowIncentives: [{
    token: 'COMP',
    apy: aprToApy((100 * SECONDS_PER_YEAR * +baseData.rewardBorrowSpeed * +compPrice) / +baseData.price / +baseData.totalBorrow).toString(),
    incentiveKind: IncentiveKind.Reward,
    description: 'Eligible for protocol-level COMP incentives.',
  },
  ...addToArrayIf(STAKING_ASSETS.includes(baseData.symbol), {
    apy: new Dec(await getStakingApy(baseData.symbol)).mul(-1).toString(),
    token: baseData.symbol,
    incentiveKind: IncentiveKind.Staking,
    description: `Due to the native yield of ${baseData.symbol}, the value of the debt would increase over time.`,
  }),
  ],
});

export const getCompoundV2AggregatedData = ({
  usedAssets, assetsData, ...rest
}: { usedAssets: CompoundV2UsedAssets, assetsData: CompoundV2AssetsData }) => {
  const payload = {} as CompoundAggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  payload.borrowLimitUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[symbol].collateralFactor));

  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd).toString();

  payload.leftToBorrowUsd = leftToBorrowUsd;
  payload.borrowLimitUsd = new Dec(leftToBorrowUsd).add(payload.borrowedUsd).toString();

  payload.liquidationLimitUsd = payload.borrowLimitUsd;
  payload.ratio = payload.borrowedUsd && payload.borrowedUsd !== '0'
    ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString()
    : '0';
  payload.minRatio = '100';
  payload.collRatio = payload.borrowedUsd && payload.borrowedUsd !== '0'
    ? new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString()
    : '0';

  // Calculate borrow limits per asset
  Object.values(usedAssets).forEach((item) => {
    if (item.isBorrowed) {
      // eslint-disable-next-line no-param-reassign
      item.limit = calculateBorrowingAssetLimit(item.borrowedUsd, payload.borrowLimitUsd);
    }
  });

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    const assetPrice = assetsData[handleWbtcLegacy(leveragedAsset)].price;
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }

  return payload;
};

export const getCompoundV3AggregatedData = ({
  usedAssets, assetsData, network, selectedMarket, ...rest
}: { usedAssets: CompoundV3UsedAssets, assetsData: CompoundV3AssetsData, network: NetworkNumber, selectedMarket: CompoundMarketData }) => {
  const payload = {} as CompoundAggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  payload.borrowLimitUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[symbol].collateralFactor));
  payload.liquidationLimitUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[symbol].liquidationRatio));
  payload.debtTooLow = new Dec(usedAssets[selectedMarket.baseAsset]?.borrowed || 0).gt(0) && new Dec(usedAssets[selectedMarket.baseAsset].borrowed).lt(assetsData[selectedMarket.baseAsset].minDebt);
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = +payload.suppliedUsd ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = +payload.suppliedUsd ? new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  payload.minRatio = '100';
  payload.liqRatio = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).toString();
  payload.liqPercent = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  payload.minDebt = assetsData[selectedMarket.baseAsset].minDebt;
  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets, selectedMarket.value === CompoundVersions.CompoundV3ETH ? 0.001 : 5);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedAsset].price;
    if (leveragedType === LeverageType.VolatilePair) {
      const borrowedAsset = (Object.values(usedAssets) as CompoundV3UsedAsset[]).find(({ borrowedUsd }: { borrowedUsd: string }) => +borrowedUsd > 0);
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
  payload.minCollRatio = new Dec(payload.suppliedCollateralUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.suppliedCollateralUsd).div(payload.liquidationLimitUsd).mul(100).toString();

  return payload;
};

export const getApyAfterValuesEstimationCompoundV2 = async (actions: [{ action: string, amount: string, asset: string }], provider: EthereumProvider) => {
  const client = getViemProvider(provider, NetworkNumber.Eth);
  const compViewContract = CompoundLoanInfoContractViem(client, NetworkNumber.Eth);
  const params = actions.map(({ action, asset, amount }) => {
    const isBorrowOperation = borrowOperations.includes(action);
    const amountInWei = assetAmountInWei(amount, asset);
    const assetInfo = getAssetInfo(`c${asset}`);
    let liquidityAdded;
    let liquidityTaken;
    if (isBorrowOperation) {
      liquidityAdded = action === 'payback' ? amountInWei : '0';
      liquidityTaken = action === 'borrow' ? amountInWei : '0';
    } else {
      liquidityAdded = action === 'collateral' ? amountInWei : '0';
      liquidityTaken = action === 'withdraw' ? amountInWei : '0';
    }
    return {
      cTokenAddr: assetInfo.address as EthAddress,
      liquidityAdded: BigInt(liquidityAdded),
      liquidityTaken: BigInt(liquidityTaken),
      isBorrowOperation,
    };
  });
  const data = await compViewContract.read.getApyAfterValuesEstimation(
    [params],
  );
  const rates: { [key: string]: { supplyRate: string, borrowRate: string } } = {};
  data.forEach((d) => {
    const asset = wethToEth(getAssetInfoByAddress(d.cTokenAddr).underlyingAsset);
    rates[asset] = {
      supplyRate: aprToApy(new Dec(BLOCKS_IN_A_YEAR).times(d.supplyRate.toString()).div(1e16).toString()).toString(),
      borrowRate: aprToApy(new Dec(BLOCKS_IN_A_YEAR).times(d.borrowRate.toString()).div(1e16).toString()).toString(),
    };
  });
  return rates;
};

export const getApyAfterValuesEstimationCompoundV3 = async (selectedMarket: CompoundMarketData, action: string, asset: string, amount: string, account: EthAddress, provider: EthereumProvider, network: NetworkNumber) => {
  const client = getViemProvider(provider, NetworkNumber.Eth);
  const compV3ViewContract = CompV3ViewContractViem(client, network);
  const isBorrowOperation = borrowOperations.includes(action);
  const amountInWei = assetAmountInWei(amount, asset);
  let liquidityAdded;
  let liquidityTaken;
  if (isBorrowOperation) {
    liquidityAdded = action === 'payback' ? amountInWei : '0';
    liquidityTaken = action === 'borrow' ? amountInWei : '0';
  } else {
    liquidityAdded = action === 'collateral' ? amountInWei : '0';
    liquidityTaken = action === 'withdraw' ? amountInWei : '0';
  }
  const [_, supplyRate, borrowRate] = await compV3ViewContract.read.getApyAfterValuesEstimation([
    selectedMarket.baseMarketAddress,
    account,
    BigInt(liquidityAdded),
    BigInt(liquidityTaken),
  ]);
  return {
    supplyRate: aprToApy(new Dec(supplyRate).div(1e18).mul(SECONDS_PER_YEAR).mul(100)
      .toString()),
    borrowRate: aprToApy(new Dec(borrowRate).div(1e18).mul(SECONDS_PER_YEAR).mul(100)
      .toString()),
  };
};