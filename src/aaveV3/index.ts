import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, assetAmountInWei, getAssetInfo } from '@defisaver/tokens';
import { AaveV3ViewContract } from '../contracts';
import { addToObjectIf, ethToWeth, isLayer2Network } from '../services/utils';
import { AaveMarketInfo, AaveV3MarketData } from '../types/aave';
import { NetworkNumber } from '../types/common';

export { AaveMarkets } from './markets';
export * from '../types/aave';

export const test = (web3: Web3, network: NetworkNumber) => {
  const contract = AaveV3ViewContract(web3, 1);
  return contract.methods.AAVE_REFERRAL_CODE().call();
};

export async function getMarketData(web3: Web3, network: NetworkNumber, market: AaveMarketInfo): Promise<AaveV3MarketData> {
  const _addresses = market.assets.map(a => getAssetInfo(ethToWeth(a), network).address);

  const isL2 = isLayer2Network(network);

  const loanInfoContract = AaveV3ViewContract(web3, network);
  // const aaveIncentivesContract = AaveIncentiveDataProviderV3Contract();
  const marketAddress = market.providerAddress;

  // const multicallCallsObject = [
  //   {
  //     target: GhoDiscountRateStrategyAddress,
  //     abiItem: getAbiItem(config.GhoDiscountRateStrategy.abi, 'GHO_DISCOUNTED_PER_DISCOUNT_TOKEN'),
  //     params: [],
  //   },
  //   {
  //     target: GhoDiscountRateStrategyAddress,
  //     abiItem: getAbiItem(config.GhoDiscountRateStrategy.abi, 'DISCOUNT_RATE'),
  //     params: [],
  //   },
  //   {
  //     target: GhoDiscountRateStrategyAddress,
  //     abiItem: getAbiItem(config.GhoDiscountRateStrategy.abi, 'MIN_DISCOUNT_TOKEN_BALANCE'),
  //     params: [],
  //   },
  //   {
  //     target: GhoDiscountRateStrategyAddress,
  //     abiItem: getAbiItem(config.GhoDiscountRateStrategy.abi, 'MIN_DEBT_TOKEN_BALANCE'),
  //     params: [],
  //   },
  //   {
  //     target: getAssetInfo('GHO').address,
  //     abiItem: getAbiItem(config.GHO.abi, 'getFacilitatorsList'),
  //     params: [],
  //   },
  // ];

  // const ghoContract = GhoTokenContract();

  // eslint-disable-next-line prefer-const
  let [loanInfo, isBorrowAllowed, multiRes] = await Promise.all([
    loanInfoContract.methods.getFullTokensInfo(marketAddress, _addresses).call(),
    loanInfoContract.methods.isBorrowAllowed(marketAddress).call(), // Used on L2s check for PriceOracleSentinel (mainnet will always return true)
    [{ 0: null }, { 0: null }, { 0: null }, { 0: null }, { 0: null }], // isL2 ? [{}, {}, {}, {}, {}] : multicall(multicallCallsObject),
  ]);
  isBorrowAllowed = isLayer2Network(network) ? isBorrowAllowed : true;

  const [
    { 0: ghoDiscountedPerDiscountToken },
    { 0: discountRate },
    { 0: minDiscountTokenBalance },
    { 0: minGhoBalanceForDiscount },
    { 0: facilitatorsList },
  ] = multiRes;

  // let rewardInfo = null;
  // if (network === 10) {
  //   rewardInfo = await aaveIncentivesContract.methods.getReservesIncentivesData(marketAddress).call();
  //   rewardInfo = rewardInfo.reduce((all, market) => {
  //     // eslint-disable-next-line no-param-reassign
  //     all[market.underlyingAsset] = market;
  //     // all[market.underlyingAsset] = market.aIncentiveData.rewardsTokenInformation[0].emissionPerSecond;
  //     return all;
  //   }, {});
  // }

  const assetsData = await Promise.all(loanInfo
    .map(async (tokenMarket, i) => {
      const symbol = market.assets[i];
      const nativeAsset = symbol === 'GHO';

      const borrowCap = tokenMarket.borrowCap;
      const discountRateOnBorrow = '0';

      // if (nativeAsset) {
      //   borrowCap = assetAmountInEth((await ghoContract.methods.getFacilitatorBucket(facilitatorsList[0]).call())[0], 'GHO');
      //
      //   discountRateOnBorrow = aaveV3CalculateDiscountRate(
      //     tokenMarket.totalBorrow.toString(),
      //     '3160881469228662060510133', // stkAAVE total supply
      //     discountRate,
      //     minDiscountTokenBalance,
      //     minGhoBalanceForDiscount,
      //     ghoDiscountedPerDiscountToken,
      //   );
      // }

      return ({
        nativeAsset,
        ...addToObjectIf(nativeAsset, {
          discountData: {
            ghoDiscountedPerDiscountToken,
            discountRate,
            minDiscountTokenBalance,
            minGhoBalanceForDiscount,
          },
        }),
        symbol,
        isIsolated: new Dec(tokenMarket.debtCeilingForIsolationMode).gt(0),
        debtCeilingForIsolationMode: new Dec(tokenMarket.debtCeilingForIsolationMode).div(100).toString(),
        isSiloed: tokenMarket.isSiloedForBorrowing,
        eModeCategory: +tokenMarket.emodeCategory,
        isolationModeTotalDebt: new Dec(tokenMarket.isolationModeTotalDebt).div(100).toString(),
        assetId: Number(tokenMarket.assetId),
        underlyingTokenAddress: tokenMarket.underlyingTokenAddress,
        supplyRate: new Dec(tokenMarket.supplyRate.toString()).div(1e25).toString(),
        borrowRate: new Dec(tokenMarket.borrowRateVariable.toString()).div(1e25).toString(),
        borrowRateDiscounted: nativeAsset ? new Dec(tokenMarket.borrowRateVariable.toString()).div(1e25).mul(1 - parseFloat(discountRateOnBorrow)).toString() : '0',
        borrowRateStable: new Dec(tokenMarket.borrowRateStable.toString()).div(1e25).toString(),
        collateralFactor: new Dec(tokenMarket.collateralFactor.toString()).div(10000).toString(),
        liquidationRatio: new Dec(tokenMarket.liquidationRatio.toString()).div(10000).toString(),
        marketLiquidity: nativeAsset
          ? assetAmountInEth(new Dec(assetAmountInWei(borrowCap.toString(), 'GHO'))
            .sub(tokenMarket.totalBorrow.toString())
            .toString(), symbol)
          : assetAmountInEth(new Dec(tokenMarket.totalSupply.toString())
            .sub(tokenMarket.totalBorrow.toString())
            .toString(), symbol),
        utilization: new Dec(tokenMarket.totalBorrow.toString())
          .div(new Dec(tokenMarket.totalSupply.toString()))
          .times(100)
          .toString(),
        usageAsCollateralEnabled: tokenMarket.usageAsCollateralEnabled,
        supplyCap: tokenMarket.supplyCap,
        borrowCap,
        totalSupply: assetAmountInEth(tokenMarket.totalSupply.toString(), symbol),
        isInactive: !tokenMarket.isActive,
        isFrozen: tokenMarket.isFrozen,
        isPaused: tokenMarket.isPaused,
        canBeBorrowed: tokenMarket.isActive && !tokenMarket.isPaused && !tokenMarket.isFrozen && tokenMarket.borrowingEnabled && isBorrowAllowed,
        canBeSupplied: !nativeAsset && tokenMarket.isActive && !tokenMarket.isPaused && !tokenMarket.isFrozen,
        canBeWithdrawn: tokenMarket.isActive && !tokenMarket.isPaused,
        canBePayBacked: tokenMarket.isActive && !tokenMarket.isPaused,
        disabledStableBorrowing: !tokenMarket.stableBorrowRateEnabled,
        totalBorrow: assetAmountInEth(tokenMarket.totalBorrow.toString(), symbol),
        totalBorrowVar: assetAmountInEth(tokenMarket.totalBorrowVar.toString(), symbol),
        price: new Dec(tokenMarket.price.toString()).div(1e8).toString(), // is actually price in USD
        isolationModeBorrowingEnabled: tokenMarket.isolationModeBorrowingEnabled,
        isFlashLoanEnabled: tokenMarket.isFlashLoanEnabled,
        eModeCategoryData: {
          label: tokenMarket.label,
          liquidationBonus: new Dec(tokenMarket.liquidationBonus).div(10000).toString(),
          liquidationRatio: new Dec(tokenMarket.liquidationThreshold).div(10000).toString(),
          collateralFactor: new Dec(tokenMarket.ltv).div(10000).toString(),
          priceSource: tokenMarket.priceSource,
        },
      });
    }));

  // await Promise.all(loanInfo.map(async (market) => {
  //   /* eslint-disable no-param-reassign */
  //   const rewardForMarket = rewardInfo?.[market.underlyingTokenAddress];
  //   if (market.symbol === 'wstETH') {
  //     market.incentiveSupplyApy = await getStETHApr();
  //     market.incentiveSupplyToken = 'wstETH';
  //   }
  //
  //   if (market.symbol === 'cbETH' && !isLayer2Network(network)) {
  //     market.incentiveSupplyApy = await getCbETHApr();
  //     market.incentiveSupplyToken = 'cbETH';
  //   }
  //
  //   if (market.symbol === 'rETH') {
  //     market.incentiveSupplyApy = await getREthApr();
  //     market.incentiveSupplyToken = 'rETH';
  //   }
  //
  //   if (market.canBeBorrowed && market.incentiveSupplyApy) {
  //     market.incentiveBorrowApy = `-${market.incentiveSupplyApy}`;
  //     market.incentiveBorrowToken = market.incentiveSupplyToken;
  //   }
  //
  //   if (!rewardForMarket) return;
  //   const supplyRewardData = rewardForMarket.aIncentiveData.rewardsTokenInformation[0];
  //   if (supplyRewardData) {
  //     if (supplyRewardData.emissionEndTimestamp * 1000 < Date.now()) return;
  //     market.incentiveSupplyToken = supplyRewardData.rewardTokenSymbol;
  //     const supplyEmissionPerSecond = supplyRewardData.emissionPerSecond;
  //     const supplyRewardPrice = new Dec(supplyRewardData.rewardPriceFeed).div(10 ** supplyRewardData.priceFeedDecimals).toString();
  //     market.incentiveSupplyApy = new Dec(supplyEmissionPerSecond).div((10 ** supplyRewardData.rewardTokenDecimals) / 100)
  //       .mul(365 * 24 * 3600)
  //       .mul(supplyRewardPrice)
  //       .div(market.price)
  //       .div(market.totalSupply)
  //       .toString();
  //   }
  //   const borrowRewardData = rewardForMarket.vIncentiveData.rewardsTokenInformation[0];
  //   if (borrowRewardData) {
  //     if (borrowRewardData.emissionEndTimestamp * 1000 < Date.now()) return;
  //     market.incentiveBorrowToken = borrowRewardData.rewardTokenSymbol;
  //     const supplyEmissionPerSecond = borrowRewardData.emissionPerSecond;
  //     const supplyRewardPrice = new Dec(borrowRewardData.rewardPriceFeed).div(10 ** borrowRewardData.priceFeedDecimals).toString();
  //     market.incentiveBorrowApy = new Dec(supplyEmissionPerSecond).div((10 ** borrowRewardData.rewardTokenDecimals) / 100)
  //       .mul(365 * 24 * 3600)
  //       .mul(supplyRewardPrice)
  //       .div(market.price)
  //       .div(market.totalBorrowVar)
  //       .toString();
  //   }
  //   /* eslint-enable no-param-reassign */
  // }));

  return { assetsData };
}
