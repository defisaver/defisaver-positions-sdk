import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, assetAmountInWei, getAssetInfo } from '@defisaver/tokens';
import {
  AaveIncentiveDataProviderV3Contract, AaveV3ViewContract, GhoTokenContract, getConfigContractAbi, getConfigContractAddress,
} from '../contracts';
import {
  addToObjectIf, ethToWeth, getAbiItem, isLayer2Network,
} from '../services/utils';
import {
  AaveMarketInfo, AaveV3AssetData, AaveV3AssetsData, AaveV3IncentiveData, AaveV3MarketData,
} from '../types/aave';
import { NetworkNumber } from '../types/common';
import { getStakingApy } from '../staking';
import { multicall } from '../multicall';
import { IUiIncentiveDataProviderV3 } from '../types/contracts/generated/AaveUiIncentiveDataProviderV3';

export { AaveMarkets } from './markets';
export * from '../types/aave';

export const test = (web3: Web3, network: NetworkNumber) => {
  const contract = AaveV3ViewContract(web3, 1);
  return contract.methods.AAVE_REFERRAL_CODE().call();
};

export const aaveV3CalculateDiscountRate = (
  debtBalance: string,
  discountTokenBalance: string,
  discountRate: string,
  minDiscountTokenBalance: string,
  minGhoBalanceForDiscount: string,
  ghoDiscountedPerDiscountToken: string,
) => {
  if (new Dec(discountTokenBalance).lt(minDiscountTokenBalance) || new Dec(debtBalance).lt(minGhoBalanceForDiscount)) {
    return '0';
  }
  const discountedBalance = new Dec( // wadMul
    new Dec(discountTokenBalance).mul(ghoDiscountedPerDiscountToken).add(new Dec(1e18).div(2)),
  ).div(1e18).toDP(0);

  if (new Dec(discountedBalance).gte(debtBalance)) {
    return new Dec(discountRate).div(10000).toDP(4).toString();
  }
  return new Dec(discountedBalance)
    .mul(discountRate)
    .div(debtBalance)
    .div(10000)
    .toDP(4)
    .toString();
};

export async function getMarketData(web3: Web3, network: NetworkNumber, market: AaveMarketInfo): Promise<AaveV3MarketData> {
  const _addresses = market.assets.map(a => getAssetInfo(ethToWeth(a), network).address);

  const isL2 = isLayer2Network(network);

  const loanInfoContract = AaveV3ViewContract(web3, network);
  const aaveIncentivesContract = AaveIncentiveDataProviderV3Contract(web3, network);
  const marketAddress = market.providerAddress;

  const GhoDiscountRateStrategyAddress = getConfigContractAddress('GhoDiscountRateStrategy', NetworkNumber.Eth);
  const GhoDiscountRateStrategyAbi = getConfigContractAbi('GhoDiscountRateStrategy');
  const GhoTokenAbi = getConfigContractAbi('GHO');

  const multicallCallsObject = [
    {
      target: GhoDiscountRateStrategyAddress,
      abiItem: getAbiItem(GhoDiscountRateStrategyAbi, 'GHO_DISCOUNTED_PER_DISCOUNT_TOKEN'),
      params: [],
    },
    {
      target: GhoDiscountRateStrategyAddress,
      abiItem: getAbiItem(GhoDiscountRateStrategyAbi, 'DISCOUNT_RATE'),
      params: [],
    },
    {
      target: GhoDiscountRateStrategyAddress,
      abiItem: getAbiItem(GhoDiscountRateStrategyAbi, 'MIN_DISCOUNT_TOKEN_BALANCE'),
      params: [],
    },
    {
      target: GhoDiscountRateStrategyAddress,
      abiItem: getAbiItem(GhoDiscountRateStrategyAbi, 'MIN_DEBT_TOKEN_BALANCE'),
      params: [],
    },
    {
      target: getAssetInfo('GHO').address,
      abiItem: getAbiItem(GhoTokenAbi, 'getFacilitatorsList'),
      params: [],
    },
  ];

  const ghoContract = GhoTokenContract(web3, network);

  // eslint-disable-next-line prefer-const
  let [loanInfo, isBorrowAllowed, multiRes] = await Promise.all([
    loanInfoContract.methods.getFullTokensInfo(marketAddress, _addresses).call(),
    loanInfoContract.methods.isBorrowAllowed(marketAddress).call(), // Used on L2s check for PriceOracleSentinel (mainnet will always return true)
    isL2 ? [{ 0: null }, { 0: null }, { 0: null }, { 0: null }, { 0: null }] : multicall(multicallCallsObject, network),
  ]);
  isBorrowAllowed = isLayer2Network(network) ? isBorrowAllowed : true;

  const [
    { 0: ghoDiscountedPerDiscountToken },
    { 0: discountRate },
    { 0: minDiscountTokenBalance },
    { 0: minGhoBalanceForDiscount },
    { 0: facilitatorsList },
  ] = multiRes;

  let rewardInfo: IUiIncentiveDataProviderV3.AggregatedReserveIncentiveDataStructOutput[] | null = null;
  if (network === 10) {
    rewardInfo = await aaveIncentivesContract.methods.getReservesIncentivesData(marketAddress).call();
    rewardInfo = rewardInfo.reduce((all: any, _market: AaveV3IncentiveData) => {
      // eslint-disable-next-line no-param-reassign
      all[_market.underlyingAsset] = _market;
      return all;
    }, {});
  }

  const assetsData: AaveV3AssetsData = await Promise.all(loanInfo
    .map(async (tokenMarket, i) => {
      const symbol = market.assets[i];
      const nativeAsset = symbol === 'GHO';

      let borrowCap = tokenMarket.borrowCap;
      let discountRateOnBorrow = '0';

      if (nativeAsset && facilitatorsList && discountRate && minDiscountTokenBalance && minGhoBalanceForDiscount && ghoDiscountedPerDiscountToken) {
        borrowCap = assetAmountInEth((await ghoContract.methods.getFacilitatorBucket(facilitatorsList[0]).call())[0], 'GHO');

        discountRateOnBorrow = aaveV3CalculateDiscountRate(
          tokenMarket.totalBorrow.toString(),
          '3160881469228662060510133', // stkAAVE total supply
          discountRate,
          minDiscountTokenBalance,
          minGhoBalanceForDiscount,
          ghoDiscountedPerDiscountToken,
        );
      }

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

  await Promise.all(assetsData.map(async (_market: AaveV3AssetData) => {
    /* eslint-disable no-param-reassign */
    const rewardForMarket: IUiIncentiveDataProviderV3.AggregatedReserveIncentiveDataStructOutput | undefined = rewardInfo?.[_market.underlyingTokenAddress as any];
    if (['wstETH', 'cbETH', 'rETH'].includes(_market.symbol)) {
      if (!isLayer2Network(network) && _market.symbol === 'cbETH') return;
      _market.incentiveSupplyApy = await getStakingApy(_market.symbol);
      _market.incentiveSupplyToken = _market.symbol;
    }

    if (_market.canBeBorrowed && _market.incentiveSupplyApy) {
      _market.incentiveBorrowApy = `-${_market.incentiveSupplyApy}`;
      _market.incentiveBorrowToken = _market.incentiveSupplyToken;
    }

    if (!rewardForMarket) return;
    const supplyRewardData = rewardForMarket.aIncentiveData.rewardsTokenInformation[0];
    if (supplyRewardData) {
      if (+supplyRewardData.emissionEndTimestamp * 1000 < Date.now()) return;
      _market.incentiveSupplyToken = supplyRewardData.rewardTokenSymbol;
      const supplyEmissionPerSecond = supplyRewardData.emissionPerSecond;
      const supplyRewardPrice = new Dec(supplyRewardData.rewardPriceFeed).div(10 ** +supplyRewardData.priceFeedDecimals).toString();
      _market.incentiveSupplyApy = new Dec(supplyEmissionPerSecond).div((10 ** +supplyRewardData.rewardTokenDecimals) / 100)
        .mul(365 * 24 * 3600)
        .mul(supplyRewardPrice)
        .div(_market.price)
        .div(_market.totalSupply)
        .toString();
    }
    const borrowRewardData = rewardForMarket.vIncentiveData.rewardsTokenInformation[0];
    if (borrowRewardData) {
      if (+borrowRewardData.emissionEndTimestamp * 1000 < Date.now()) return;
      _market.incentiveBorrowToken = borrowRewardData.rewardTokenSymbol;
      const supplyEmissionPerSecond = borrowRewardData.emissionPerSecond;
      const supplyRewardPrice = new Dec(borrowRewardData.rewardPriceFeed).div(10 ** +borrowRewardData.priceFeedDecimals).toString();
      _market.incentiveBorrowApy = new Dec(supplyEmissionPerSecond).div((10 ** +borrowRewardData.rewardTokenDecimals) / 100)
        .mul(365 * 24 * 3600)
        .mul(supplyRewardPrice)
        .div(_market.price)
        .div(_market.totalBorrowVar)
        .toString();
    }
    /* eslint-enable no-param-reassign */
  }));

  return { assetsData };
}
