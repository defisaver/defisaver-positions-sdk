import Dec from 'decimal.js';
import { assetAmountInWei } from '@defisaver/tokens';
import Web3 from 'web3';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import { MMUsedAssets, NetworkNumber } from '../../types/common';
import {
  MorphoAggregatedPositionData, MorphoAssetsData, MorphoMarketData, MorphoMarketInfo,
} from '../../types';
import { borrowOperations, SECONDS_PER_YEAR, WAD } from '../../constants';
import { MorphoViewContract } from '../../contracts';
import { MarketParamsStruct } from '../../types/contracts/generated/MorphoView';

export const getMorphoAggregatedPositionData = ({ usedAssets, assetsData, marketInfo }: { usedAssets: MMUsedAssets, assetsData: MorphoAssetsData, marketInfo: MorphoMarketInfo }): MorphoAggregatedPositionData => {
  const payload = {} as MorphoAggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);

  const {
    lltv, oracle, collateralToken, loanToken,
  } = marketInfo;

  payload.borrowLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => {
      const suppliedUsdAmount = suppliedUsd;

      return new Dec(suppliedUsdAmount).mul(lltv);
    },
  );
  payload.liquidationLimitUsd = payload.borrowLimitUsd;
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();

  payload.leftToBorrow = new Dec(usedAssets[collateralToken]?.supplied || 0).mul(oracle).mul(lltv).sub(usedAssets[loanToken]?.borrowed || 0)
    .toString();

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy(usedAssets, assetsData as any);
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  payload.ltv = new Dec(payload.borrowedUsd).div(payload.suppliedCollateralUsd).toString();
  payload.ltv = new Dec(usedAssets[loanToken]?.borrowed || 0).div(oracle).div(usedAssets[collateralToken]?.supplied || 1).toString(); // default to 1 because can't div 0
  payload.ratio = new Dec(usedAssets[collateralToken]?.supplied || 0).mul(oracle).div(usedAssets[loanToken]?.borrowed || 1).mul(100)
    .toString();

  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedAsset].price;
    if (leveragedType === 'lsd-leverage') {
      // Treat ETH like a stablecoin in a long stETH position
      payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedAsset].price).div(assetsData.ETH.price).toDP(18).toString();
      assetPrice = new Dec(assetPrice).div(assetsData.ETH.price).toString();
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }

  return payload;
};

const compound = (ratePerSeconds: string) => {
  const compounding = new Dec(ratePerSeconds).mul(SECONDS_PER_YEAR).toString();
  const apyNumber = Math.expm1(new Dec(compounding).div(WAD).toNumber());
  return new Dec(apyNumber).mul(WAD).floor().toString();
};

export const getSupplyRate = (totalSupplyAssets: string, totalBorrowAssets: string, borrowRate: string, fee: string) => {
  if (totalBorrowAssets === '0' || totalSupplyAssets === '0') {
    return '0';
  }
  const utillization = new Dec(totalBorrowAssets).mul(WAD).div(totalSupplyAssets).ceil()
    .toString();
  const supplyRate = new Dec(utillization).mul(borrowRate).div(WAD).ceil()
    .toString();
  const ratePerSecond = new Dec(supplyRate).mul(new Dec(WAD).minus(fee)).div(WAD).ceil()
    .toString();
  return new Dec(compound(ratePerSecond)).div(1e18).mul(100).toString();
};

export const getBorrowRate = (borrowRate: string, totalBorrowShares: string) => {
  if (totalBorrowShares === '0') {
    return '0';
  }
  return new Dec(compound(borrowRate)).div(1e18).mul(100).toString();
};

export const getApyAfterValuesEstimation = async (selectedMarket: MorphoMarketData, action: string, amount: string, asset: string, web3: Web3, network: NetworkNumber) => {
  const morphoViewContract = MorphoViewContract(web3, network);
  const lltvInWei = assetAmountInWei(selectedMarket.lltv, 'ETH');
  const marketData: MarketParamsStruct = [selectedMarket.loanToken, selectedMarket.collateralToken, selectedMarket.oracle, selectedMarket.irm, lltvInWei];
  const isBorrowOperation = borrowOperations.includes(action);
  const amountInWei = assetAmountInWei(amount, asset);
  let liquidityAdded;
  let liquidityRemoved;
  if (isBorrowOperation) {
    liquidityAdded = action === 'payback' ? amountInWei : '0';
    liquidityRemoved = action === 'borrow' ? amountInWei : '0';
  } else {
    liquidityAdded = action === 'collateral' ? amountInWei : '0';
    liquidityRemoved = action === 'withdraw' ? amountInWei : '0';
  }
  const data = await morphoViewContract.methods.getApyAfterValuesEstimation([
    marketData,
    isBorrowOperation,
    liquidityAdded,
    liquidityRemoved,
  ]).call();
  const borrowRate = getBorrowRate(data.borrowRate, data.market.totalBorrowShares);
  const supplyRate = getSupplyRate(data.market.totalSupplyAssets, data.market.totalBorrowAssets, data.borrowRate, data.market.fee);
  return { borrowRate, supplyRate };
};