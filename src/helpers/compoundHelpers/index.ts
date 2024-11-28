import Dec from 'decimal.js';
import { assetAmountInWei, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import Web3 from 'web3';
import {
  BaseAdditionalAssetData, CompoundAggregatedPositionData, CompoundMarketData, CompoundV2AssetsData, CompoundV2UsedAssets, CompoundV3AssetData, CompoundV3AssetsData, CompoundV3UsedAssets, CompoundVersions,
} from '../../types';
import { getEthAmountForDecimals, handleWbtcLegacy, wethToEth } from '../../services/utils';
import { BLOCKS_IN_A_YEAR, borrowOperations, SECONDS_PER_YEAR } from '../../constants';
import {
  aprToApy, calcLeverageLiqPrice, calculateBorrowingAssetLimit, getAssetsTotal, isLeveragedPos,
} from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import { EthAddress, NetworkNumber } from '../../types/common';
import { CompoundLoanInfoContract, CompV3ViewContract } from '../../contracts';

export const formatMarketData = (data: any, network: NetworkNumber, baseAssetPrice: string): CompoundV3AssetData => {
  const assetInfo = getAssetInfoByAddress(data.tokenAddr, network);
  const isWETH = assetInfo.symbol === 'WETH';
  const price = getEthAmountForDecimals(data.price, 8);
  return ({
    ...data,
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
  });
};

// TODO: maybe not hardcode decimals
export const formatBaseData = (data: any, network: NetworkNumber, baseAssetPrice: string): CompoundV3AssetData & BaseAdditionalAssetData => {
  const assetInfo = getAssetInfoByAddress(data.tokenAddr, network);
  const totalSupply = getEthAmountForDecimals(new Dec(data.totalSupply).mul(data.supplyIndex).toString(), 15 + assetInfo.decimals);
  const totalBorrow = getEthAmountForDecimals(new Dec(data.totalBorrow).mul(data.borrowIndex).toString(), 15 + assetInfo.decimals);
  return ({
    ...data,
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

export const getIncentiveApys = (
  baseData: CompoundV3AssetData & BaseAdditionalAssetData,
  compPrice: string,
): {
  incentiveSupplyApy: string,
  incentiveBorrowApy: string,
  incentiveSupplyToken: string,
  incentiveBorrowToken: string,
} => {
  const incentiveSupplyApy = aprToApy((100 * SECONDS_PER_YEAR * +baseData.rewardSupplySpeed * +compPrice) / +baseData.price / +baseData.totalSupply).toString();
  const incentiveBorrowApy = aprToApy((100 * SECONDS_PER_YEAR * +baseData.rewardBorrowSpeed * +compPrice) / +baseData.price / +baseData.totalBorrow).toString();
  return {
    incentiveSupplyApy,
    incentiveBorrowApy,
    incentiveSupplyToken: 'COMP',
    incentiveBorrowToken: 'COMP',
  };
};

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
    if (leveragedType === 'lsd-leverage') {
      payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedAsset].price).div(assetsData.ETH.price).toString();
      assetPrice = new Dec(assetPrice).div(assetsData.ETH.price).toString();
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }

  // TO DO: handle strategies
  /* const subscribedStrategies = rest.compoundStrategies
    ? compoundV3GetSubscribedStrategies({ selectedMarket, compoundStrategies: rest.compoundStrategies })
    : []; */

  // TODO possibly move to global helper, since every protocol has the same graphData?
  // payload.ratioTooLow = false;
  // payload.ratioTooHigh = false;

  // TO DO: handle strategies
  /* if (subscribedStrategies.length) {
    subscribedStrategies.forEach(({ graphData }) => {
      payload.ratioTooLow = parseFloat(payload.ratio) < parseFloat(graphData.minRatio);
      payload.ratioTooHigh = graphData.boostEnabled && parseFloat(payload.ratio) > parseFloat(graphData.maxRatio);
    });
  } */

  return payload;
};

export const getApyAfterValuesEstimationCompoundV2 = async (actions: [{ action: string, amount: string, asset: string }], web3: Web3) => {
  const compViewContract = CompoundLoanInfoContract(web3, NetworkNumber.Eth);
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
      cTokenAddr: assetInfo.address,
      liquidityAdded,
      liquidityTaken,
      isBorrowOperation,
    };
  });
  const data = await compViewContract.methods.getApyAfterValuesEstimation(
    params,
  ).call();
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

export const getApyAfterValuesEstimationCompoundV3 = async (selectedMarket: CompoundMarketData, action: string, asset: string, amount: string, account: EthAddress, web3: Web3, network: NetworkNumber) => {
  const compV3ViewContract = CompV3ViewContract(web3, network);
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
  const data = await compV3ViewContract.methods.getApyAfterValuesEstimation(
    selectedMarket.baseMarketAddress,
    account,
    liquidityAdded,
    liquidityTaken,
  ).call();
  return {
    supplyRate: aprToApy(new Dec(data.supplyRate).div(1e18).mul(SECONDS_PER_YEAR).mul(100)
      .toString()),
    borrowRate: aprToApy(new Dec(data.borrowRate).div(1e18).mul(SECONDS_PER_YEAR).mul(100)
      .toString()),
  };
};