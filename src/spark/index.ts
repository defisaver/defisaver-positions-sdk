import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { NetworkNumber } from '../types/common';
import { ethToWeth, isLayer2Network } from '../services/utils';
import { getCbETHApr, getREthApr, getStETHApr } from '../staking';
import { getDsrApy } from '../services/dsrService';
import { SparkIncentiveDataProviderContract, SparkViewContract } from '../contracts';
import {
  SparkAssetData, SparkAssetsData, SparkMarketData, SparkMarketsData,
} from '../types';

export const getSparkMarketsData = async (web3: Web3, network: NetworkNumber, selectedMarket: SparkMarketData, mainnetWeb3: Web3): Promise<SparkMarketsData> => {
  const marketAddress = selectedMarket.providerAddress;

  let rewardInfo: any[] = [];
  if (network === 10) {
    const sparkIncentivesContract = SparkIncentiveDataProviderContract(web3, network);
    rewardInfo = await sparkIncentivesContract.methods.getReservesIncentivesData(marketAddress).call();
    rewardInfo = rewardInfo.reduce((all, market) => {
      // eslint-disable-next-line no-param-reassign
      all[market.underlyingAsset] = market;
      return all;
    }, {});
  }

  const loanInfoContract = SparkViewContract(web3, network);

  const loanInfo = await loanInfoContract.methods.getFullTokensInfo(
    marketAddress,
    selectedMarket.assets.map(a => getAssetInfo(ethToWeth(a)).address),
  ).call();

  const assetsData: SparkAssetData[] = loanInfo
    .map((market, i) => ({
      symbol: selectedMarket.assets[i],
      isIsolated: new Dec(market.debtCeilingForIsolationMode).gt(0),
      debtCeilingForIsolationMode: new Dec(market.debtCeilingForIsolationMode).div(100).toString(),
      isSiloed: market.isSiloedForBorrowing,
      eModeCategory: +market.emodeCategory,
      isolationModeTotalDebt: new Dec(market.isolationModeTotalDebt).div(100).toString(),
      assetId: Number(market.assetId),
      underlyingTokenAddress: market.underlyingTokenAddress,
      supplyRate: new Dec(market.supplyRate.toString()).div(1e25).toString(),
      borrowRate: new Dec(market.borrowRateVariable.toString()).div(1e25).toString(),
      borrowRateStable: new Dec(market.borrowRateStable.toString()).div(1e25).toString(),
      collateralFactor: new Dec(market.collateralFactor.toString()).div(10000).toString(),
      liquidationRatio: new Dec(market.liquidationRatio.toString()).div(10000).toString(),
      marketLiquidity: assetAmountInEth(new Dec(market.totalSupply.toString())
        .sub(market.totalBorrow.toString())
        .toString(), selectedMarket.assets[i]),
      utilization: new Dec(market.totalBorrow.toString())
        .div(new Dec(market.totalSupply.toString()))
        .times(100)
        .toString(),
      usageAsCollateralEnabled: market.usageAsCollateralEnabled,
      supplyCap: market.supplyCap,
      borrowCap: market.borrowCap,
      totalSupply: assetAmountInEth(market.totalSupply.toString(), selectedMarket.assets[i]),
      isInactive: !market.isActive,
      isFrozen: market.isFrozen,
      isPaused: market.isPaused,
      canBeBorrowed: market.isActive && !market.isPaused && !market.isFrozen && market.borrowingEnabled,
      canBeSupplied: market.isActive && !market.isPaused && !market.isFrozen,
      canBeWithdrawn: market.isActive && !market.isPaused,
      canBePayBacked: market.isActive && !market.isPaused,
      disabledStableBorrowing: !market.stableBorrowRateEnabled,
      totalBorrow: assetAmountInEth(market.totalBorrow.toString(), selectedMarket.assets[i]),
      totalBorrowVar: assetAmountInEth(market.totalBorrowVar.toString(), selectedMarket.assets[i]),
      price: new Dec(market.price.toString()).div(1e8).toString(), // is actually price in USD
      isolationModeBorrowingEnabled: market.isolationModeBorrowingEnabled,
      isFlashLoanEnabled: market.isFlashLoanEnabled,
      eModeCategoryData: {
        label: market.label,
        liquidationBonus: new Dec(market.liquidationBonus).div(10000).toString(),
        liquidationRatio: new Dec(market.liquidationThreshold).div(10000).toString(),
        collateralFactor: new Dec(market.ltv).div(10000).toString(),
        priceSource: market.priceSource,
      },
    }));

  await Promise.all(assetsData.map(async (market) => {
    /* eslint-disable no-param-reassign */
    const rewardForMarket = (rewardInfo as any)[market.underlyingTokenAddress];
    if (market.symbol === 'wstETH') {
      market.incentiveSupplyApy = await getStETHApr(mainnetWeb3);
      market.incentiveSupplyToken = 'wstETH';
    }

    if (market.symbol === 'cbETH' && !isLayer2Network(network)) {
      market.incentiveSupplyApy = await getCbETHApr(mainnetWeb3);
      market.incentiveSupplyToken = 'cbETH';
    }

    if (market.symbol === 'rETH') {
      market.incentiveSupplyApy = await getREthApr(mainnetWeb3);
      market.incentiveSupplyToken = 'rETH';
    }

    if (market.symbol === 'sDAI') {
      market.incentiveSupplyApy = await getDsrApy(web3, network);
      market.incentiveSupplyToken = 'sDAI';
    }

    if (market.canBeBorrowed && market.incentiveSupplyApy) {
      market.incentiveBorrowApy = `-${market.incentiveSupplyApy}`;
      market.incentiveBorrowToken = market.incentiveSupplyToken;
    }

    if (!rewardForMarket) return;
    const supplyRewardData = rewardForMarket.aIncentiveData.rewardsTokenInformation[0];
    if (supplyRewardData) {
      if (supplyRewardData.emissionEndTimestamp * 1000 < Date.now()) return;
      market.incentiveSupplyToken = supplyRewardData.rewardTokenSymbol;
      const supplyEmissionPerSecond = supplyRewardData.emissionPerSecond;
      const supplyRewardPrice = new Dec(supplyRewardData.rewardPriceFeed).div(10 ** supplyRewardData.priceFeedDecimals).toString();
      market.incentiveSupplyApy = new Dec(supplyEmissionPerSecond).div((10 ** supplyRewardData.rewardTokenDecimals) / 100)
        .mul(365 * 24 * 3600)
        .mul(supplyRewardPrice)
        .div(market.price)
        .div(market.totalSupply)
        .toString();
    }
    const borrowRewardData = rewardForMarket.vIncentiveData.rewardsTokenInformation[0];
    if (borrowRewardData) {
      if (borrowRewardData.emissionEndTimestamp * 1000 < Date.now()) return;
      market.incentiveBorrowToken = borrowRewardData.rewardTokenSymbol;
      const supplyEmissionPerSecond = borrowRewardData.emissionPerSecond;
      const supplyRewardPrice = new Dec(borrowRewardData.rewardPriceFeed).div(10 ** borrowRewardData.priceFeedDecimals).toString();
      market.incentiveBorrowApy = new Dec(supplyEmissionPerSecond).div((10 ** borrowRewardData.rewardTokenDecimals) / 100)
        .mul(365 * 24 * 3600)
        .mul(supplyRewardPrice)
        .div(market.price)
        .div(market.totalBorrowVar)
        .toString();
    }
    /* eslint-enable no-param-reassign */
  }));

  const payload: SparkAssetsData = {};
  // Sort by market size
  assetsData
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalSupply).toString();
      const bMarket = new Dec(b.price).times(b.totalSupply).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((assetData: SparkAssetData, i) => {
      payload[assetData.symbol] = { ...assetData, sortIndex: i };
    });

  return { assetsData: payload };
};