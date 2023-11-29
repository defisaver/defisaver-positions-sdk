import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, assetAmountInWei, getAssetInfo } from '@defisaver/tokens';
import {
  AaveIncentiveDataProviderV3Contract,
  AaveV3ViewContract,
  createContractWrapper,
  getConfigContractAbi,
  getConfigContractAddress,
  GhoTokenContract,
} from '../contracts';
import {
  addToObjectIf, ethToWeth, getAbiItem, isLayer2Network, wethToEth, wethToEthByAddress,
} from '../services/utils';
import {
  AaveMarketInfo,
  AaveV3AssetData,
  AaveV3AssetsData,
  AaveV3IncentiveData,
  AaveV3MarketData,
  AaveV3PositionData,
  AaveV3UsedAsset,
  AaveV3UsedAssets,
  EModeCategoryDataMapping,
} from '../types/aave';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import { calculateNetApy, getStakingApy } from '../staking';
import { multicall } from '../multicall';
import { IUiIncentiveDataProviderV3 } from '../types/contracts/generated/AaveUiIncentiveDataProviderV3';
import { getAssetsBalances } from '../assets';
import { calculateBorrowingAssetLimit } from '../moneymarket';
import {
  aaveAnyGetAggregatedPositionData,
  aaveV3IsInIsolationMode,
  aaveV3IsInSiloedMode,
} from '../helpers/aaveHelpers';
import { AAVE_V3 } from '../markets/aave';

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

export const aaveV3EmodeCategoriesMapping = (extractedState: any, usedAssets: AaveV3UsedAssets) => {
  const { assetsData }: { assetsData: AaveV3AssetsData } = extractedState;
  const usedAssetsValues = Object.values(usedAssets);

  const categoriesMapping: { [key: number]: EModeCategoryDataMapping } = {};
  Object.values(assetsData).forEach((a: AaveV3AssetData) => {
    const borrowingOnlyFromCategory = a.eModeCategory === 0
      ? true
      : !usedAssetsValues.filter(u => u.isBorrowed && u.eModeCategory !== a.eModeCategory).length;
    const afterEnteringCategory = aaveAnyGetAggregatedPositionData({
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

export async function getAaveV3MarketData(web3: Web3, network: NetworkNumber, market: AaveMarketInfo, defaultWeb3: Web3): Promise<AaveV3MarketData> {
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
    isL2 ? [{ 0: null }, { 0: null }, { 0: null }, { 0: null }, { 0: null }] : multicall(multicallCallsObject, web3, network),
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

  const assetsData: AaveV3AssetData[] = await Promise.all(loanInfo
    .map(async (tokenMarket, i) => {
      const symbol = market.assets[i];
      const nativeAsset = symbol === 'GHO';

      let borrowCap = tokenMarket.borrowCap;
      let discountRateOnBorrow = '0';

      if (nativeAsset && facilitatorsList && discountRate && minDiscountTokenBalance && minGhoBalanceForDiscount && ghoDiscountedPerDiscountToken) {
        const facilitatorBucket = await ghoContract.methods.getFacilitatorBucket(facilitatorsList[0]).call();
        const availableFacilitatorCap = assetAmountInEth(new Dec(facilitatorBucket[0]).sub(facilitatorBucket[1]).toString(), 'GHO');

        borrowCap = Dec.min(borrowCap, availableFacilitatorCap).toString();

        discountRateOnBorrow = aaveV3CalculateDiscountRate(
          tokenMarket.totalBorrow.toString(),
          '3160881469228662060510133', // stkAAVE total supply
          discountRate,
          minDiscountTokenBalance,
          minGhoBalanceForDiscount,
          ghoDiscountedPerDiscountToken,
        );
      }

      let marketLiquidity = nativeAsset
        ? assetAmountInEth(new Dec(assetAmountInWei(borrowCap.toString(), 'GHO'))
          .sub(tokenMarket.totalBorrow.toString())
          .toString(), symbol)
        : assetAmountInEth(new Dec(tokenMarket.totalSupply.toString())
          .sub(tokenMarket.totalBorrow.toString())
          .toString(), symbol);

      if (new Dec(marketLiquidity).lt(0)) {
        marketLiquidity = '0';
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
        marketLiquidity,
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
        aTokenAddress: tokenMarket.aTokenAddress,
      });
    }));


  await Promise.all(assetsData.map(async (_market: AaveV3AssetData) => {
    /* eslint-disable no-param-reassign */
    const rewardForMarket: IUiIncentiveDataProviderV3.AggregatedReserveIncentiveDataStructOutput | undefined = rewardInfo?.[_market.underlyingTokenAddress as any];
    if (['wstETH', 'cbETH', 'rETH', 'sDAI'].includes(_market.symbol)) {
      _market.incentiveSupplyApy = await getStakingApy(_market.symbol, defaultWeb3);
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

  const payload: AaveV3AssetsData = {};
  // Sort by market size
  assetsData
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalSupply).toString();
      const bMarket = new Dec(b.price).times(b.totalSupply).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((assetData: AaveV3AssetData, i) => {
      payload[assetData.symbol] = { ...assetData, sortIndex: i };
    });

  return { assetsData: payload };
}

export const EMPTY_AAVE_DATA = {
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
  isSubscribedToAutomation: false,
  automationResubscribeRequired: false,
  eModeCategory: 0,
  isInIsolationMode: false,
  isInSiloedMode: false,
  totalSupplied: '0',
  eModeCategories: [],
  collRatio: '0',
  suppliedCollateralUsd: '0',
};

export const getAaveV3AccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const loanInfoContract = AaveV3ViewContract(web3, network, block);

  const market = AAVE_V3(network);
  const marketAddress = market.providerAddress;
  // @ts-ignore
  const protocolDataProviderContract = createContractWrapper(web3, network, market.protocolData, market.protocolDataAddress);

  const reserveTokens = await protocolDataProviderContract.methods.getAllReservesTokens().call({}, block);
  const symbols = reserveTokens.map(({ symbol }: { symbol: string }) => symbol);
  const _addresses = reserveTokens.map(({ tokenAddress }: { tokenAddress: EthAddress }) => tokenAddress);

  // split addresses in half to avoid gas limit by multicall
  const middleAddressIndex = Math.floor(_addresses.length / 2);

  const multicallData = [
    {
      target: loanInfoContract.options.address,
      abiItem: loanInfoContract.options.jsonInterface.find(({ name }) => name === 'getTokenBalances'),
      params: [marketAddress, address, _addresses.slice(0, middleAddressIndex)],
    },
    {
      target: loanInfoContract.options.address,
      abiItem: loanInfoContract.options.jsonInterface.find(({ name }) => name === 'getTokenBalances'),
      params: [marketAddress, address, _addresses.slice(middleAddressIndex, _addresses.length)],
    },
  ];

  const multicallRes = await multicall(multicallData, web3, network, block);

  const loanInfo = [...multicallRes[0][0], ...multicallRes[1][0]];

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

export const getAaveV3AccountData = async (web3: Web3, network: NetworkNumber, address: EthAddress, extractedState: any): Promise<AaveV3PositionData> => {
  const {
    selectedMarket: market, assetsData,
  } = extractedState;
  let payload: AaveV3PositionData = {
    ...EMPTY_AAVE_DATA,
    lastUpdated: Date.now(),
  };
  if (!address) {
    // structure that this function returns is complex and dynamic so i didnt want to hardcode it in EMPTY_AAVE_DATA
    // This case only triggers if user doesnt have proxy and data is refetched once proxy is created
    // TODO when refactoring aave figure out if this is the best solution.
    payload.eModeCategories = aaveV3EmodeCategoriesMapping(extractedState, {});

    return payload;
  }

  const isL2 = isLayer2Network(network);

  const loanInfoContract = AaveV3ViewContract(web3, network);
  const marketAddress = market.providerAddress;
  const _addresses = market.assets.map((a: string[]) => getAssetInfo(ethToWeth(a), network).address);

  const middleAddressIndex = Math.floor(_addresses.length / 2); // split addresses in half to avoid gas limit by multicall

  const LendingPoolAbi = getConfigContractAbi(market.lendingPool);

  const multicallData = [
    {
      target: market.lendingPoolAddress,
      abiItem: LendingPoolAbi.find(({ name }) => name === 'getUserEMode'),
      params: [address],
    },
    {
      target: loanInfoContract.options.address,
      abiItem: loanInfoContract.options.jsonInterface.find(({ name }) => name === 'getTokenBalances'),
      params: [marketAddress, address, _addresses.slice(0, middleAddressIndex)],
    },
    {
      target: loanInfoContract.options.address,
      abiItem: loanInfoContract.options.jsonInterface.find(({ name }) => name === 'getTokenBalances'),
      params: [marketAddress, address, _addresses.slice(middleAddressIndex, _addresses.length)],
    },
  ];

  const [multicallRes, { 0: stkAaveBalance }] = await Promise.all([
    multicall(multicallData, web3, network),
    isL2 ? { 0: '0' } : getAssetsBalances(['stkAAVE'], address, network, web3),
    { 0: '0' },
  ]);

  const loanInfo = [...multicallRes[1][0], ...multicallRes[2][0]];

  const usedAssets = {} as AaveV3UsedAssets;
  loanInfo.map(async (tokenInfo, i) => {
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
    if (!usedAssets[asset]) usedAssets[asset] = {} as AaveV3UsedAsset;
    const nativeAsset = asset === 'GHO';

    let discountRateOnBorrow = '0';
    const borrowed = new Dec(borrowedStable).add(borrowedVariable).toString();

    if (nativeAsset && new Dec(borrowed).gt(0) && new Dec(stkAaveBalance).gt(0)) {
      discountRateOnBorrow = aaveV3CalculateDiscountRate(
        assetAmountInWei(borrowed, 'GHO'),
        assetAmountInWei(stkAaveBalance, 'stkAAVE'),
        assetsData[asset].discountData.discountRate,
        assetsData[asset].discountData.minDiscountTokenBalance,
        assetsData[asset].discountData.minGhoBalanceForDiscount,
        assetsData[asset].discountData.ghoDiscountedPerDiscountToken,
      );
    }

    usedAssets[asset] = {
      ...usedAssets[asset],
      symbol: asset,
      supplied,
      suppliedUsd: new Dec(supplied).mul(assetsData[asset].price).toString(),
      isSupplied,
      collateral: enabledAsCollateral,
      stableBorrowRate: new Dec(tokenInfo.stableBorrowRate).div(1e25).toString(),
      discountedBorrowRate: new Dec(assetsData[asset].borrowRate).mul(1 - parseFloat(discountRateOnBorrow)).toString(),
      borrowedStable,
      borrowedVariable,
      borrowedUsdStable: new Dec(borrowedStable).mul(assetsData[asset].price).toString(),
      borrowedUsdVariable: new Dec(borrowedVariable).mul(assetsData[asset].price).toString(),
      borrowed,
      borrowedUsd: new Dec(new Dec(borrowedVariable).add(borrowedStable)).mul(assetsData[asset].price).toString(),
      isBorrowed,
      eModeCategory: assetsData[asset].eModeCategory,
      interestMode,
    };
  });

  payload.eModeCategory = +multicallRes[0][0];
  payload = {
    ...payload,
    usedAssets,
    ...aaveAnyGetAggregatedPositionData({
      ...extractedState, usedAssets, eModeCategory: payload.eModeCategory,
    }),
  };
  payload.eModeCategories = aaveV3EmodeCategoriesMapping(extractedState, usedAssets);
  payload.isInIsolationMode = aaveV3IsInIsolationMode({ usedAssets, assetsData });
  payload.isInSiloedMode = aaveV3IsInSiloedMode({ usedAssets, assetsData });

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

  payload.isSubscribedToAutomation = false;
  payload.automationResubscribeRequired = false;

  return payload;
};

export const getAaveV3FullPositionData = async (web3: Web3, network: NetworkNumber, address: string, market: AaveMarketInfo, mainnetWeb3: Web3): Promise<AaveV3PositionData> => {
  const marketData = await getAaveV3MarketData(web3, network, market, mainnetWeb3);
  const positionData = await getAaveV3AccountData(web3, network, address, { assetsData: marketData.assetsData, selectedMarket: market });
  return positionData;
};
