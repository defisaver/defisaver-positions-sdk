import Dec from 'decimal.js';
import { assetAmountInEth, assetAmountInWei, getAssetInfo } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  ethToWeth, wethToEth, wethToEthByAddress,
} from '../services/utils';
import {
  calculateNetApy, getStakingApy, STAKING_ASSETS,
} from '../staking';
import {
  SparkViewContractViem,
  SparkIncentiveDataProviderContractViem,
  createViemContractFromConfigFunc,
} from '../contracts';
import {
  SparkEModeCategoryDataMapping,
  SparkAssetData,
  SparkAssetsData,
  SparkMarketData,
  SparkMarketsData,
  SparkPositionData,
  SparkUsedAsset,
  SparkUsedAssets,
} from '../types';
import { sparkGetAggregatedPositionData, sparkIsInIsolationMode } from '../helpers/sparkHelpers';
import { aprToApy, calculateBorrowingAssetLimit } from '../moneymarket';
import { SPARK_V1 } from '../markets/spark';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

export const sparkEmodeCategoriesMapping = (extractedState: { assetsData: SparkAssetsData }, usedAssets: SparkUsedAssets) => {
  const { assetsData } = extractedState;
  const usedAssetsValues = Object.values(usedAssets);

  const categoriesMapping: { [key: number]: SparkEModeCategoryDataMapping } = {};
  Object.values(assetsData).forEach((a) => {
    const borrowingOnlyFromCategory = a.eModeCategory === 0
      ? true
      : !usedAssetsValues.filter(u => u.isBorrowed && u.eModeCategory !== a.eModeCategory).length;
    const afterEnteringCategory = sparkGetAggregatedPositionData({
      ...extractedState, usedAssets, eModeCategory: a.eModeCategory,
    });
    const willStayOverCollateralized = new Dec(afterEnteringCategory.ratio).eq(0) || new Dec(afterEnteringCategory.ratio).gt(afterEnteringCategory.liqPercent);
    const enteringTerms = [borrowingOnlyFromCategory, willStayOverCollateralized];

    categoriesMapping[a.eModeCategory] = {
      enteringTerms,
      canEnterCategory: !enteringTerms.includes(false),
      id: a.eModeCategory,
      data: a.eModeCategoryData,
      assets: a.eModeCategory === 0 ? [] : [...(categoriesMapping[a.eModeCategory]?.assets || []), a.symbol],
      enabledData: {
        ratio: afterEnteringCategory.ratio,
        liqRatio: afterEnteringCategory.liqRatio,
        liqPercent: afterEnteringCategory.liqPercent,
        collRatio: afterEnteringCategory.collRatio,
      },
    };
  });
  return categoriesMapping;
};

export const _getSparkMarketsData = async (provider: Client, network: NetworkNumber, selectedMarket: SparkMarketData): Promise<SparkMarketsData> => {
  const marketAddress = selectedMarket.providerAddress;

  const loanInfoContract = SparkViewContractViem(provider, network);
  const sparkIncentivesContract = SparkIncentiveDataProviderContractViem(provider, network);

  const [loanInfo, _rewardInfo] = await Promise.all([
    loanInfoContract.read.getFullTokensInfo([marketAddress, selectedMarket.assets.map(a => getAssetInfo(ethToWeth(a)).address) as EthAddress[]]),
    network === NetworkNumber.Opt ? sparkIncentivesContract.read.getReservesIncentivesData([marketAddress]) : [],
  ]);

  let rewardInfo: any[] = [];
  if (network === NetworkNumber.Opt) {
    rewardInfo = rewardInfo.reduce((all, market) => {
      // eslint-disable-next-line no-param-reassign
      all[market.underlyingAsset] = market;
      return all;
    }, {});
  }

  const assetsData: SparkAssetData[] = await Promise.all(loanInfo
    .map(async (market, i) => {
      const symbol = selectedMarket.assets[i];

      const borrowCapInWei = new Dec(assetAmountInWei(market.borrowCap.toString(), symbol));
      let marketLiquidity = borrowCapInWei.lt(new Dec(market.totalSupply.toString()))
        ? assetAmountInEth(borrowCapInWei
          .sub(market.totalBorrow.toString())
          .toString(), symbol)
        : assetAmountInEth(new Dec(market.totalSupply.toString())
          .sub(market.totalBorrow.toString())
          .toString(), symbol);

      if (new Dec(marketLiquidity).lt(0)) {
        marketLiquidity = '0';
      }
      return ({
        symbol: selectedMarket.assets[i],
        isIsolated: new Dec(market.debtCeilingForIsolationMode.toString()).gt(0),
        debtCeilingForIsolationMode: new Dec(market.debtCeilingForIsolationMode.toString()).div(100).toString(),
        isSiloed: market.isSiloedForBorrowing,
        eModeCategory: +market.emodeCategory.toString(),
        isolationModeTotalDebt: new Dec(market.isolationModeTotalDebt.toString()).div(100).toString(),
        assetId: Number(market.assetId),
        underlyingTokenAddress: market.underlyingTokenAddress,
        supplyRate: aprToApy(new Dec(market.supplyRate.toString()).div(1e25).toString()),
        borrowRate: aprToApy(new Dec(market.borrowRateVariable.toString()).div(1e25).toString()),
        borrowRateStable: aprToApy(new Dec(market.borrowRateStable.toString()).div(1e25).toString()),
        collateralFactor: new Dec(market.collateralFactor.toString()).div(10000).toString(),
        liquidationRatio: new Dec(market.liquidationRatio.toString()).div(10000).toString(),
        marketLiquidity,
        utilization: new Dec(market.totalBorrow.toString()).times(100).div(new Dec(market.totalSupply.toString())).toString(),
        usageAsCollateralEnabled: market.usageAsCollateralEnabled,
        supplyCap: market.supplyCap.toString(),
        borrowCap: market.borrowCap.toString(),
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
        aTokenAddress: market.aTokenAddress,
        eModeCategoryData: {
          label: market.label,
          liquidationBonus: new Dec(market.liquidationBonus).div(10000).toString(),
          liquidationRatio: new Dec(market.liquidationThreshold).div(10000).toString(),
          collateralFactor: new Dec(market.ltv).div(10000).toString(),
          priceSource: market.priceSource,
        },
      });
    }));

  await Promise.all(assetsData.map(async (market) => {
    /* eslint-disable no-param-reassign */
    const rewardForMarket = (rewardInfo as any)[market.underlyingTokenAddress];
    if (STAKING_ASSETS.includes(market.symbol)) {
      market.incentiveSupplyApy = await getStakingApy(market.symbol);
      market.incentiveSupplyToken = market.symbol;
      if (!market.supplyIncentives) {
        market.supplyIncentives = [];
      }

      market.supplyIncentives.push({
        apy: market.incentiveSupplyApy || '0',
        token: market.symbol,
      });
    }

    if (market.symbol === 'sDAI') {
      market.incentiveSupplyApy = await getStakingApy('sDAI');
      market.incentiveSupplyToken = 'sDAI';
    }

    if (market.canBeBorrowed && market.incentiveSupplyApy) {
      market.incentiveBorrowApy = market.incentiveSupplyApy;
      market.incentiveBorrowToken = market.incentiveSupplyToken;
      if (!market.borrowIncentives) {
        market.borrowIncentives = [];
      }
      market.borrowIncentives.push({
        apy: market.incentiveBorrowApy,
        token: market.incentiveBorrowToken!!,
      });
    }

    if (!rewardForMarket) return;
    (rewardForMarket.aIncentiveData.rewardsTokenInformation as any[]).forEach(supplyRewardData => {
      if (supplyRewardData) {
        if (supplyRewardData.emissionEndTimestamp * 1000 < Date.now()) return;
        market.incentiveSupplyToken = supplyRewardData.rewardTokenSymbol;
        const supplyEmissionPerSecond = supplyRewardData.emissionPerSecond;
        const supplyRewardPrice = new Dec(supplyRewardData.rewardPriceFeed).div(10 ** supplyRewardData.priceFeedDecimals)
          .toString();
        const rewardApy = new Dec(supplyEmissionPerSecond).div((10 ** supplyRewardData.rewardTokenDecimals) / 100)
          .mul(365 * 24 * 3600)
          .mul(supplyRewardPrice)
          .div(market.price)
          .div(market.totalSupply)
          .toString();
        market.incentiveSupplyApy = new Dec(market.incentiveSupplyApy || '0').add(rewardApy).toString();

        if (!market.supplyIncentives) {
          market.supplyIncentives = [];
        }
        market.supplyIncentives.push({
          token: supplyRewardData.rewardTokenSymbol,
          apy: rewardApy,
        });
      }
    });
    (rewardForMarket.vIncentiveData.rewardsTokenInformation as any[]).forEach(borrowRewardData => {
      if (borrowRewardData) {
        if (borrowRewardData.emissionEndTimestamp * 1000 < Date.now()) return;
        market.incentiveBorrowToken = borrowRewardData.rewardTokenSymbol;
        const supplyEmissionPerSecond = borrowRewardData.emissionPerSecond;
        const supplyRewardPrice = new Dec(borrowRewardData.rewardPriceFeed).div(10 ** borrowRewardData.priceFeedDecimals)
          .toString();
        const rewardApy = new Dec(supplyEmissionPerSecond).div((10 ** borrowRewardData.rewardTokenDecimals) / 100)
          .mul(365 * 24 * 3600)
          .mul(supplyRewardPrice)
          .div(market.price)
          .div(market.totalBorrowVar)
          .toString();
        market.incentiveBorrowApy = new Dec(market.incentiveBorrowApy || '0').add(rewardApy).toString();

        if (!market.borrowIncentives) {
          market.borrowIncentives = [];
        }
        market.borrowIncentives.push({
          token: borrowRewardData.rewardTokenSymbol,
          apy: rewardApy,
        });
      }
    });
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

export const getSparkMarketsData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  selectedMarket: SparkMarketData,
): Promise<SparkMarketsData> => _getSparkMarketsData(getViemProvider(provider, network), network, selectedMarket);

export const EMPTY_SPARK_DATA = {
  usedAssets: {},
  suppliedUsd: '0',
  borrowedUsd: '0',
  borrowLimitUsd: '0',
  leftToBorrowUsd: '0',
  ratio: '0',
  minRatio: '0',
  netApy: '0',
  incentiveUsd: '0',
  totalInterestUsd: '0',
  eModeCategory: 0,
  isInIsolationMode: false,
  isInSiloedMode: false,
  collRatio: '0',
  suppliedCollateralUsd: '0',
  totalSupplied: '0',
  eModeCategories: [],
};

export const _getSparkAccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const loanInfoContract = SparkViewContractViem(provider, network, block);

  const market = SPARK_V1(network);
  const marketAddress = market.providerAddress;
  // @ts-ignore
  const protocolDataProviderContract = createViemContractFromConfigFunc(market.protocolData, market.protocolDataAddress)(provider, network);

  const reserveTokens = await protocolDataProviderContract.read.getAllReservesTokens(setViemBlockNumber(block));
  const symbols = reserveTokens.map(({ symbol }: { symbol: string }) => symbol);
  const _addresses = reserveTokens.map(({ tokenAddress }: { tokenAddress: EthAddress }) => tokenAddress);


  // split addresses in half to avoid gas limit by multicall
  const middleAddressIndex = Math.floor(_addresses.length / 2);

  const [tokenBalances1, tokenBalances2] = await Promise.all([
    loanInfoContract.read.getTokenBalances([marketAddress, address, _addresses.slice(0, middleAddressIndex)], setViemBlockNumber(block)),
    loanInfoContract.read.getTokenBalances([marketAddress, address, _addresses.slice(middleAddressIndex, _addresses.length)], setViemBlockNumber(block)),
  ]);

  const loanInfo = [...tokenBalances1, ...tokenBalances2];

  loanInfo.forEach((tokenInfo: any, i: number) => {
    const asset = wethToEth(symbols[i]);
    const assetAddr = wethToEthByAddress(_addresses[i], network).toLowerCase();

    balances = {
      collateral: {
        ...balances.collateral,
        [addressMapping ? assetAddr : asset]: tokenInfo.balance.toString(),
      },
      debt: {
        ...balances.debt,
        [addressMapping ? assetAddr : asset]: new Dec(tokenInfo.borrowsStable.toString()).add(tokenInfo.borrowsVariable.toString()).toString(),
      },
    };
  });

  return balances;
};

export const getSparkAccountBalances = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  address: EthAddress,
): Promise<PositionBalances> => _getSparkAccountBalances(getViemProvider(provider, network, { batch: { multicall: true } }), network, block, addressMapping, address);

export const _getSparkAccountData = async (provider: Client, network: NetworkNumber, address: EthAddress, extractedState: { selectedMarket: SparkMarketData, assetsData: SparkAssetsData }) => {
  const {
    selectedMarket: market, assetsData,
  } = extractedState;
  let payload: SparkPositionData = {
    ...EMPTY_SPARK_DATA,
    lastUpdated: Date.now(),
  };
  if (!address) {
    // structure that this function returns is complex and dynamic so i didnt want to hardcode it in EMPTY_SPARK_DATA
    // This case only triggers if user doesnt have proxy and data is refetched once proxy is created
    // TODO when refactoring spark figure out if this is the best solution.
    payload.eModeCategories = sparkEmodeCategoriesMapping(extractedState, {});

    return payload;
  }

  const loanInfoContract = SparkViewContractViem(provider, network);
  const lendingPoolContract = createViemContractFromConfigFunc(market.lendingPool, market.lendingPoolAddress)(provider, network);

  const marketAddress = market.providerAddress;
  const _addresses = market.assets.map((a) => getAssetInfo(ethToWeth(a)).address);

  const middleAddressIndex = Math.floor(_addresses.length / 2); // split addresses in half to avoid gas limit by multicall

  const [userEMode, tokenBalances1, tokenBalances2] = await Promise.all([
    lendingPoolContract.read.getUserEMode([address]),
    loanInfoContract.read.getTokenBalances([marketAddress, address, _addresses.slice(0, middleAddressIndex) as EthAddress[]]),
    loanInfoContract.read.getTokenBalances([marketAddress, address, _addresses.slice(middleAddressIndex, _addresses.length) as EthAddress[]]),
  ]);


  const loanInfo = [...tokenBalances1, ...tokenBalances2];

  const usedAssets = {} as SparkUsedAssets;
  loanInfo.forEach((tokenInfo, i) => {
    const asset = market.assets[i];
    const isSupplied = tokenInfo.balance.toString() !== '0';
    const isBorrowed = tokenInfo.borrowsStable.toString() !== '0' || tokenInfo.borrowsVariable.toString() !== '0';
    if (!isSupplied && !isBorrowed) return;

    const supplied = assetAmountInEth(tokenInfo.balance.toString(), asset);
    const borrowedStable = assetAmountInEth(tokenInfo.borrowsStable.toString(), asset);
    const borrowedVariable = assetAmountInEth(tokenInfo.borrowsVariable.toString(), asset);
    const enabledAsCollateral = assetsData[asset].usageAsCollateralEnabled ? tokenInfo.enabledAsCollateral : false;
    let interestMode;
    if (borrowedVariable === '0' && borrowedStable !== '0') {
      interestMode = '1';
    } else if (borrowedVariable !== '0' && borrowedStable === '0') {
      interestMode = '2';
    } else {
      interestMode = 'both';
    }
    if (!usedAssets[asset]) usedAssets[asset] = {} as SparkUsedAsset;
    usedAssets[asset] = {
      ...usedAssets[asset],
      symbol: asset,
      supplied,
      suppliedUsd: new Dec(supplied).mul(assetsData[asset].price).toString(),
      isSupplied,
      collateral: enabledAsCollateral,
      stableBorrowRate: aprToApy(new Dec(tokenInfo.stableBorrowRate.toString()).div(1e25).toString()),
      borrowedStable,
      borrowedVariable,
      borrowedUsdStable: new Dec(borrowedStable).mul(assetsData[asset].price).toString(),
      borrowedUsdVariable: new Dec(borrowedVariable).mul(assetsData[asset].price).toString(),
      borrowed: new Dec(borrowedStable).add(borrowedVariable).toString(),
      borrowedUsd: new Dec(new Dec(borrowedVariable).add(borrowedStable)).mul(assetsData[asset].price).toString(),
      isBorrowed,
      eModeCategory: assetsData[asset].eModeCategory,
      interestMode,
    };
  });

  payload.eModeCategory = +userEMode.toString();
  payload = {
    ...payload,
    usedAssets,
    ...sparkGetAggregatedPositionData({
      ...extractedState, usedAssets, eModeCategory: payload.eModeCategory,
    }),
  };
  payload.eModeCategories = sparkEmodeCategoriesMapping(extractedState, usedAssets);
  payload.isInIsolationMode = sparkIsInIsolationMode({ usedAssets, assetsData });
  payload.isInSiloedMode = sparkIsInIsolationMode({ usedAssets, assetsData });

  payload.ratio = payload.borrowedUsd && payload.borrowedUsd !== '0'
    ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString()
    : '0';
  payload.minRatio = '100';
  payload.collRatio = payload.borrowedUsd && payload.borrowedUsd !== '0'
    ? new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString()
    : '0';

  // Calculate borrow limits per asset
  Object.values(payload.usedAssets).forEach((item) => {
    if (item.isBorrowed) {
      // eslint-disable-next-line no-param-reassign
      item.stableLimit = calculateBorrowingAssetLimit(item.borrowedUsdStable, payload.borrowLimitUsd);
      // eslint-disable-next-line no-param-reassign
      item.variableLimit = calculateBorrowingAssetLimit(item.borrowedUsdVariable, payload.borrowLimitUsd);
      // eslint-disable-next-line no-param-reassign
      item.limit = calculateBorrowingAssetLimit(item.borrowedUsd, payload.borrowLimitUsd);
    }
  });

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  return payload;
};

export const getSparkAccountData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  address: EthAddress,
  extractedState: { selectedMarket: SparkMarketData, assetsData: SparkAssetsData },
) => _getSparkAccountData(getViemProvider(provider, network), network, address, extractedState);

export const getSparkFullPositionData = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress, market: SparkMarketData): Promise<SparkPositionData> => {
  const marketData = await getSparkMarketsData(provider, network, market);
  const positionData = await getSparkAccountData(provider, network, address, { assetsData: marketData.assetsData, selectedMarket: market });
  return positionData;
};
