import Dec from 'decimal.js';
import { getAssetInfoByAddress } from '@defisaver/tokens';
import { CompoundV3AssetData, BaseAdditionalAssetData } from '../types/compound';
import { getEthAmountForDecimals, wethToEth } from '../services/utils';
import { SECONDS_PER_YEAR } from '../constants';
import { aprToApy } from '../moneymarket';

export const formatMarketData = (data: any): CompoundV3AssetData => {
  const assetInfo = getAssetInfoByAddress(data.tokenAddr);
  const isWETH = assetInfo.symbol === 'WETH';
  return ({
    ...data,
    price: getEthAmountForDecimals(data.price, 8),
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
export const formatBaseData = (data: any): CompoundV3AssetData & BaseAdditionalAssetData => {
  const assetInfo = getAssetInfoByAddress(data.tokenAddr);
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
    price: getEthAmountForDecimals(data.price, 8),
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