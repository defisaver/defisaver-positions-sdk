import Dec from 'decimal.js';
import { assetAmountInEth } from '@defisaver/tokens';
import {
  FluidAggregatedVaultData, FluidAssetData,
  FluidAssetsData, FluidDexBorrowDataStructOutput, FluidDexSupplyDataStructOutput, FluidUsedAsset,
  FluidUsedAssets,
  FluidVaultType,
  InnerFluidMarketData,
} from '../../types';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import { LeverageType, MMAssetsData } from '../../types/common';
import { getEthAmountForDecimals } from '../../services/utils';

const calculateNetApyDex = ({ marketData, suppliedUsd, borrowedUsd }: { marketData: InnerFluidMarketData, suppliedUsd: string, borrowedUsd: string }) => {
  const {
    borrowRate,
    supplyRate,
    incentiveBorrowRate,
    incentiveSupplyRate,
    tradingBorrowRate,
    tradingSupplyRate,
  } = marketData;

  const totalBorrowRate = new Dec(borrowRate).minus(tradingBorrowRate || '0').toString();
  const totalSupplyRate = new Dec(supplyRate).add(tradingSupplyRate || '0').toString();

  const borrowIncentive = new Dec(incentiveBorrowRate || '0').mul(borrowedUsd).div(100).toString();
  const supplyIncentive = new Dec(incentiveSupplyRate || '0').mul(suppliedUsd).div(100).toString();
  const incentiveUsd = new Dec(supplyIncentive).minus(borrowIncentive).toString();

  const borrowInterest = new Dec(totalBorrowRate).mul(borrowedUsd).div(100).toString();
  const supplyInterest = new Dec(totalSupplyRate).mul(suppliedUsd).div(100).toString();
  const totalInterestUsd = new Dec(supplyInterest).add(incentiveUsd).minus(borrowInterest).toString();
  const balance = new Dec(suppliedUsd).sub(borrowedUsd).toString();
  const netApy = new Dec(totalInterestUsd).div(balance).times(100).toString();

  return {
    netApy,
    incentiveUsd,
    totalInterestUsd,
  };
};

export const getFluidAggregatedData = ({
  usedAssets,
  assetsData,
  marketData,
}: {
  usedAssets: FluidUsedAssets,
  marketData: InnerFluidMarketData,
  assetsData: FluidAssetsData
},
supplyShares?: string,
borrowShares?: string,
): FluidAggregatedVaultData => {
  const payload = {} as FluidAggregatedVaultData;

  payload.suppliedUsd = [FluidVaultType.T1, FluidVaultType.T3].includes(marketData.vaultType)
    ? getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd)
    : new Dec(marketData.collSharePrice!).mul(supplyShares!).toString();
  payload.borrowedUsd = [FluidVaultType.T1, FluidVaultType.T2].includes(marketData.vaultType)
    ? getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd)
    : new Dec(marketData.debtSharePrice!).mul(borrowShares!).toString();

  const isDex = [FluidVaultType.T2, FluidVaultType.T3, FluidVaultType.T4].includes(marketData.vaultType);
  const { netApy, incentiveUsd, totalInterestUsd } = isDex ? calculateNetApyDex({ marketData, suppliedUsd: payload.suppliedUsd, borrowedUsd: payload.borrowedUsd }) : calculateNetApy({ usedAssets, assetsData: assetsData as unknown as MMAssetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  const collFactor = marketData.collFactor;
  const liqRatio = marketData.liquidationRatio;

  payload.borrowLimitUsd = new Dec(payload.suppliedUsd).mul(collFactor).toString();
  payload.liquidationLimitUsd = new Dec(payload.suppliedUsd).mul(liqRatio).div(100).toString();
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = +payload.suppliedUsd ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = +payload.suppliedUsd ? new Dec(payload.suppliedUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.minRatio = marketData.minRatio;
  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);

  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedAsset].price;
    if (leveragedType === LeverageType.LsdLeverage) {
      // Treat ETH like a stablecoin in a long stETH position
      payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedAsset].price).div(assetsData.ETH.price).toDP(18).toString();
      assetPrice = new Dec(assetPrice).div(assetsData.ETH.price).toString();
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }

  payload.minCollRatio = new Dec(payload.suppliedUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.suppliedUsd).div(payload.liquidationLimitUsd).mul(100).toString();

  return payload;
};


interface DexSupplyData {
  maxSupplyShares: string
  supplyDexFee: string
  token0PerSupplyShare: string
  token1PerSupplyShare: string
  withdrawable0: string
  withdrawable1: string
  withdrawableShares: string
  utilizationSupply0: string
  utilizationSupply1: string
  supplyRate0: string
  supplyRate1: string
  totalSupplyShares: string
  withdrawableToken0: string
  withdrawableToken1: string
  totalSupplyToken0: string
  totalSupplyToken1: string
  reservesSupplyToken0: string
  reservesSupplyToken1: string
}

export const parseDexSupplyData = (dexSupplyData: FluidDexSupplyDataStructOutput, collAsset0: string, collAsset1: string): DexSupplyData => {
  const {
    dexPool, // address of the dex pool
    dexId, // id of the dex pool
    fee: _fee, // fee of the dex pool (Only used as swap fees)
    lastStoredPrice, // last stored price of the dex pool
    centerPrice, // center price of the dex pool
    token0Utilization, // token0 utilization
    token1Utilization, // token1 utilization
    // ONLY FOR SUPPLY
    totalSupplyShares: totalSupplySharesWei, // total supply shares, in 1e18
    maxSupplyShares: maxSupplySharesWei, // max supply shares, in 1e18
    token0Supplied, // token0 supplied, in token0 decimals
    token1Supplied, // token1 supplied, in token1 decimals
    sharesWithdrawable, // shares withdrawable, in 1e18
    token0Withdrawable, // token0 withdrawable, in token0 decimals
    token1Withdrawable, // token1 withdrawable, in token1 decimals
    token0PerSupplyShare: token0PerSupplyShareWei, // token0 amount per 1e18 supply shares
    token1PerSupplyShare: token1PerSupplyShareWei, // token1 amount per 1e18 supply shares
    token0SupplyRate, // token0 supply rate. E.g 320 = 3.2% APR
    token1SupplyRate, // token1 supply rate. E.g 320 = 3.2% APR
    supplyToken0Reserves, // token0 reserves in the dex pool
    supplyToken1Reserves, // token1 reserves in the dex pool
  } = dexSupplyData;

  const maxSupplyShares = getEthAmountForDecimals(maxSupplySharesWei.toString(), 18);
  const fee = new Dec(_fee).div(100).toString();

  const token0PerSupplyShare = assetAmountInEth(token0PerSupplyShareWei.toString(), collAsset0);
  const token1PerSupplyShare = assetAmountInEth(token1PerSupplyShareWei.toString(), collAsset1);

  const withdrawable0 = assetAmountInEth(token0Withdrawable.toString(), collAsset0);
  const withdrawable1 = assetAmountInEth(token1Withdrawable.toString(), collAsset1);
  const utilizationSupply0 = assetAmountInEth(token0Utilization.toString(), collAsset0);
  const utilizationSupply1 = assetAmountInEth(token1Utilization.toString(), collAsset1);

  const supplyRate0 = new Dec(token0SupplyRate).div(100).toString();
  const supplyRate1 = new Dec(token1SupplyRate).div(100).toString();

  const totalSupplyShares = getEthAmountForDecimals(totalSupplySharesWei.toString(), 18); // in shares

  const withdrawableShares = getEthAmountForDecimals(sharesWithdrawable.toString(), 18);
  const withdrawableToken0 = new Dec(withdrawableShares).mul(token0PerSupplyShare).div(1e18).toString();
  const withdrawableToken1 = new Dec(withdrawableShares).mul(token1PerSupplyShare).div(1e18).toString();

  const totalSupplyToken0 = assetAmountInEth(token0Supplied.toString(), collAsset0);
  const totalSupplyToken1 = assetAmountInEth(token1Supplied.toString(), collAsset1);

  const reservesSupplyToken0 = assetAmountInEth(supplyToken0Reserves.toString(), collAsset0);
  const reservesSupplyToken1 = assetAmountInEth(supplyToken1Reserves.toString(), collAsset1);

  return {
    maxSupplyShares,
    withdrawableShares,
    supplyDexFee: fee,
    token0PerSupplyShare,
    token1PerSupplyShare,
    withdrawable0,
    withdrawable1,
    utilizationSupply0,
    utilizationSupply1,
    supplyRate0,
    supplyRate1,
    totalSupplyShares,
    withdrawableToken0,
    withdrawableToken1,
    totalSupplyToken0,
    totalSupplyToken1,
    reservesSupplyToken0,
    reservesSupplyToken1,
  };
};

interface DexBorrowData {
  maxBorrowShares: string
  borrowDexFee: string
  token0PerBorrowShare: string
  token1PerBorrowShare: string
  borrowable0: string
  borrowable1: string
  utilizationBorrow0: string
  utilizationBorrow1: string
  borrowRate0: string
  borrowRate1: string
  totalBorrowShares: string
  borrowableToken0: string
  borrowableToken1: string
  totalBorrowToken0: string
  totalBorrowToken1: string
  borrowableShares: string
  quoteTokensPerShare: string
  reservesBorrowToken0: string
  reservesBorrowToken1: string
}

export const parseDexBorrowData = (dexBorrowData: FluidDexBorrowDataStructOutput, debtAsset0: string, debtAsset1: string): DexBorrowData => {
  const {
    dexPool,
    dexId,
    fee: _fee,
    lastStoredPrice,
    centerPrice,
    token0Utilization,
    token1Utilization,
    totalBorrowShares: totalBorrowSharesWei,
    maxBorrowShares: maxBorrowSharesWei,
    token0Borrowed,
    token1Borrowed,
    sharesBorrowable,
    token0Borrowable,
    token1Borrowable,
    token0PerBorrowShare: token0PerBorrowShareWei,
    token1PerBorrowShare: token1PerBorrowShareWei,
    token0BorrowRate,
    token1BorrowRate,
    quoteTokensPerShare,
    borrowToken0Reserves,
    borrowToken1Reserves,
  } = dexBorrowData;

  const maxBorrowShares = getEthAmountForDecimals(maxBorrowSharesWei.toString(), 18);
  const fee = new Dec(_fee).div(100).toString();

  const token0PerBorrowShare = assetAmountInEth(token0PerBorrowShareWei.toString(), debtAsset0);
  const token1PerBorrowShare = assetAmountInEth(token1PerBorrowShareWei.toString(), debtAsset1);

  const borrowable0 = assetAmountInEth(token0Borrowable.toString(), debtAsset0);
  const borrowable1 = assetAmountInEth(token1Borrowable.toString(), debtAsset1);
  const utilizationBorrow0 = assetAmountInEth(token0Utilization.toString(), debtAsset0);
  const utilizationBorrow1 = assetAmountInEth(token1Utilization.toString(), debtAsset1);

  const borrowRate0 = new Dec(token0BorrowRate).div(100).toString();
  const borrowRate1 = new Dec(token1BorrowRate).div(100).toString();

  const totalBorrowShares = getEthAmountForDecimals(totalBorrowSharesWei.toString(), 18); // in shares

  const borrowableShares = getEthAmountForDecimals(sharesBorrowable.toString(), 18);
  const borrowableToken0 = new Dec(borrowableShares).mul(token0PerBorrowShare).div(1e18).toString();
  const borrowableToken1 = new Dec(borrowableShares).mul(token1PerBorrowShare).div(1e18).toString();

  const totalBorrowToken0 = assetAmountInEth(token0Borrowed.toString(), debtAsset0);
  const totalBorrowToken1 = assetAmountInEth(token1Borrowed.toString(), debtAsset1);

  const reservesBorrowToken0 = assetAmountInEth(borrowToken0Reserves.toString(), debtAsset0);
  const reservesBorrowToken1 = assetAmountInEth(borrowToken1Reserves.toString(), debtAsset1);

  return {
    borrowableShares,
    maxBorrowShares,
    borrowDexFee: fee,
    token0PerBorrowShare,
    token1PerBorrowShare,
    borrowable0,
    borrowable1,
    utilizationBorrow0,
    utilizationBorrow1,
    borrowRate0,
    borrowRate1,
    totalBorrowShares,
    borrowableToken0,
    borrowableToken1,
    totalBorrowToken0,
    totalBorrowToken1,
    quoteTokensPerShare: getEthAmountForDecimals(quoteTokensPerShare.toString(), 27),
    reservesBorrowToken0,
    reservesBorrowToken1,
  };
};

const EMPTY_ASSET_DATA = {
  symbol: '',
  address: '',
  price: '0',
  totalSupply: '',
  totalBorrow: '0',
  canBeSupplied: false,
  canBeBorrowed: false,
  supplyRate: '0',
  borrowRate: '0',
  supplyIncentives: [],
  borrowIncentives: [],
};

export const mergeAssetData = (existing: Partial<FluidAssetData> = {}, additional: Partial<FluidAssetData>): FluidAssetData => ({
  ...EMPTY_ASSET_DATA,
  ...existing,
  ...additional,
});

export const EMPTY_USED_ASSET = {
  isSupplied: false,
  isBorrowed: false,
  supplied: '0',
  suppliedUsd: '0',
  borrowed: '0',
  borrowedUsd: '0',
  symbol: '',
  collateral: false,
};

export const mergeUsedAssets = (existing: Partial<FluidUsedAsset> = {}, additional: Partial<FluidUsedAsset>): FluidUsedAsset => ({
  ...EMPTY_USED_ASSET,
  ...existing,
  ...additional,
});