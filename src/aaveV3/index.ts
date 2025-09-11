import { assetAmountInEth, assetAmountInWei, getAssetInfo } from '@defisaver/tokens';
import { Client } from 'viem';
import Dec from 'decimal.js';
import {
  AaveIncentiveDataProviderV3ContractViem,
  AaveV3ViewContractViem,
  createViemContractFromConfigFunc,
} from '../contracts';
import { aaveAnyGetAggregatedPositionData, aaveV3IsInIsolationMode, aaveV3IsInSiloedMode } from '../helpers/aaveHelpers';
import { AAVE_V3 } from '../markets/aave';
import { aprToApy, calculateBorrowingAssetLimit } from '../moneymarket';
import {
  ethToWeth, isEnabledOnBitmap, isLayer2Network, wethToEth, wethToEthByAddress,
} from '../services/utils';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import {
  AaveMarketInfo,
  AaveV3AssetData,
  AaveV3AssetsData,
  AaveV3MarketData,
  AaveV3PositionData,
  AaveV3UsedAsset,
  AaveV3UsedAssets,
  EModeCategoriesData,
  EModeCategoryData,
  EModeCategoryDataMapping,
} from '../types/aave';
import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber, PositionBalances,
} from '../types/common';
import { getViemProvider, setViemBlockNumber } from '../services/viem';
import { getMeritCampaigns } from './merit';
import { getAaveUnderlyingSymbol, getMerkleCampaigns } from './merkl';

export const aaveV3EmodeCategoriesMapping = (extractedState: any, usedAssets: AaveV3UsedAssets) => {
  const { eModeCategoriesData }: { assetsData: AaveV3AssetsData, eModeCategoriesData: EModeCategoriesData } = extractedState;
  const usedAssetsValues = Object.values(usedAssets);

  const categoriesMapping: { [key: number]: EModeCategoryDataMapping } = {};

  Object.values(eModeCategoriesData).forEach((e: EModeCategoryData) => {
    const borrowingOnlyFromCategory = e.id === 0
      ? true
      : !usedAssetsValues.filter(u => u.isBorrowed && !e.borrowAssets.includes(u.symbol)).length;
    const afterEnteringCategory = aaveAnyGetAggregatedPositionData({
      ...extractedState, usedAssets, eModeCategory: e.id,
    });
    const willStayOverCollateralized = new Dec(afterEnteringCategory.ratio).eq(0) || new Dec(afterEnteringCategory.ratio).gt(afterEnteringCategory.liqPercent);
    const enteringTerms = [borrowingOnlyFromCategory, willStayOverCollateralized];
    categoriesMapping[e.id] = {
      enteringTerms,
      canEnterCategory: !enteringTerms.includes(false),
      id: e.id,
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

export async function _getAaveV3MarketData(provider: Client, network: NetworkNumber, market: AaveMarketInfo, blockNumber: 'latest' | number = 'latest'): Promise<AaveV3MarketData> {
  const _addresses = market.assets.map(a => getAssetInfo(ethToWeth(a), network).address);

  const isL2 = isLayer2Network(network);
  const loanInfoContract = AaveV3ViewContractViem(provider, network);
  const aaveIncentivesContract = AaveIncentiveDataProviderV3ContractViem(provider, network);
  const marketAddress = market.providerAddress;
  const networksWithIncentives = [NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Opt, NetworkNumber.Linea];

  // eslint-disable-next-line prefer-const
  let [loanInfo, eModesInfo, isBorrowAllowed, rewardInfo, merkleRewardsMap, meritRewardsMap] = await Promise.all([
    loanInfoContract.read.getFullTokensInfo([marketAddress, _addresses as EthAddress[]], setViemBlockNumber(blockNumber)),
    loanInfoContract.read.getAllEmodes([marketAddress], setViemBlockNumber(blockNumber)),
    loanInfoContract.read.isBorrowAllowed([marketAddress], setViemBlockNumber(blockNumber)), // Used on L2s check for PriceOracleSentinel (mainnet will always return true)
    networksWithIncentives.includes(network) ? aaveIncentivesContract.read.getReservesIncentivesData([marketAddress], setViemBlockNumber(blockNumber)) : null,
    getMerkleCampaigns(network),
    getMeritCampaigns(network, market.value),
  ]);
  isBorrowAllowed = isLayer2Network(network) ? isBorrowAllowed : true;

  const eModeCategoriesData: EModeCategoriesData = {};
  for (let i = 0; i < eModesInfo.length; i++) {
    if (!eModesInfo[i].label) break;
    eModeCategoriesData[i + 1] = {
      label: eModesInfo[i].label,
      id: i + 1,
      liquidationBonus: new Dec(eModesInfo[i].liquidationBonus).div(10000).toString(),
      liquidationRatio: new Dec(eModesInfo[i].liquidationThreshold).div(10000).toString(),
      collateralFactor: new Dec(eModesInfo[i].ltv).div(10000).toString(),
      borrowableBitmap: eModesInfo[i].borrowableBitmap.toString(),
      collateralBitmap: eModesInfo[i].collateralBitmap.toString(),
      borrowAssets: [],
      collateralAssets: [],
    };
  }

  if (networksWithIncentives.includes(network) && rewardInfo) {
    rewardInfo = rewardInfo.reduce((all: any, _market: any) => {
      // eslint-disable-next-line no-param-reassign
      all[_market.underlyingAsset] = _market;
      return all;
    }, {});
  }

  const assetsData: AaveV3AssetData[] = await Promise.all(loanInfo
    .map(async (tokenMarket, i) => {
      const symbol = market.assets[i];

      // eslint-disable-next-line guard-for-in
      for (const eModeIndex in eModeCategoriesData) {
        if (isEnabledOnBitmap(Number(eModeCategoriesData[eModeIndex].collateralBitmap), Number(tokenMarket.assetId))) eModeCategoriesData[eModeIndex].collateralAssets.push(symbol);
        if (isEnabledOnBitmap(Number(eModeCategoriesData[eModeIndex].borrowableBitmap), Number(tokenMarket.assetId))) eModeCategoriesData[eModeIndex].borrowAssets.push(symbol);
      }

      const borrowCap = tokenMarket.borrowCap.toString();

      const borrowCapInWei = new Dec(assetAmountInWei(borrowCap, symbol));
      let marketLiquidity = borrowCapInWei.lt(new Dec(tokenMarket.totalSupply.toString()))
        ? assetAmountInEth(borrowCapInWei
          .sub(tokenMarket.totalBorrow.toString())
          .toString(), symbol)
        : assetAmountInEth(new Dec(tokenMarket.totalSupply.toString())
          .sub(tokenMarket.totalBorrow.toString())
          .toString(), symbol);

      if (new Dec(marketLiquidity).lt(0)) {
        marketLiquidity = '0';
      }
      return ({
        symbol,
        isIsolated: new Dec(tokenMarket.debtCeilingForIsolationMode.toString()).gt(0),
        debtCeilingForIsolationMode: new Dec(tokenMarket.debtCeilingForIsolationMode.toString()).div(100).toString(),
        isSiloed: tokenMarket.isSiloedForBorrowing,
        isolationModeTotalDebt: new Dec(tokenMarket.isolationModeTotalDebt.toString()).div(100).toString(),
        assetId: Number(tokenMarket.assetId),
        underlyingTokenAddress: tokenMarket.underlyingTokenAddress,
        supplyRate: aprToApy(new Dec(tokenMarket.supplyRate.toString()).div(1e25).toString()),
        borrowRate: aprToApy(new Dec(tokenMarket.borrowRateVariable.toString()).div(1e25).toString()),
        borrowRateStable: aprToApy(new Dec(tokenMarket.borrowRateStable.toString()).div(1e25).toString()),
        collateralFactor: new Dec(tokenMarket.collateralFactor.toString()).div(10000).toString(),
        liquidationBonus: new Dec(tokenMarket.liquidationBonus.toString()).div(10000).toString(),
        liquidationRatio: new Dec(tokenMarket.liquidationRatio.toString()).div(10000).toString(),
        marketLiquidity,
        utilization: new Dec(tokenMarket.totalBorrow.toString()).times(100).div(new Dec(tokenMarket.totalSupply.toString())).toString(),
        usageAsCollateralEnabled: tokenMarket.usageAsCollateralEnabled,
        supplyCap: tokenMarket.supplyCap.toString(),
        borrowCap,
        totalSupply: assetAmountInEth(tokenMarket.totalSupply.toString(), symbol),
        isInactive: !tokenMarket.isActive,
        isFrozen: tokenMarket.isFrozen,
        isPaused: tokenMarket.isPaused,
        canBeBorrowed: tokenMarket.isActive && !tokenMarket.isPaused && !tokenMarket.isFrozen && tokenMarket.borrowingEnabled && isBorrowAllowed,
        canBeSupplied: tokenMarket.isActive && !tokenMarket.isPaused && !tokenMarket.isFrozen,
        canBeWithdrawn: tokenMarket.isActive && !tokenMarket.isPaused,
        canBePayBacked: tokenMarket.isActive && !tokenMarket.isPaused,
        disabledStableBorrowing: !tokenMarket.stableBorrowRateEnabled,
        totalBorrow: assetAmountInEth(tokenMarket.totalBorrow.toString(), symbol),
        totalBorrowVar: assetAmountInEth(tokenMarket.totalBorrowVar.toString(), symbol),
        price: new Dec(tokenMarket.price.toString()).div(1e8).toString(), // is actually price in USD
        isolationModeBorrowingEnabled: tokenMarket.isolationModeBorrowingEnabled,
        isFlashLoanEnabled: tokenMarket.isFlashLoanEnabled,
        aTokenAddress: tokenMarket.aTokenAddress,
        vTokenAddress: tokenMarket.debtTokenAddress,
        supplyIncentives: [],
        borrowIncentives: [],
      });
    }),
  );

  // Get incentives data
  await Promise.all(assetsData.map(async (_market: AaveV3AssetData, index) => {
    /* eslint-disable no-param-reassign */
    // @ts-ignore
    const rewardForMarket = rewardInfo?.[_market.underlyingTokenAddress];
    const isStakingAsset = STAKING_ASSETS.includes(_market.symbol);

    if (isStakingAsset) {
      _market.incentiveSupplyApy = await getStakingApy(_market.symbol);
      _market.incentiveSupplyToken = _market.symbol;
      _market.supplyIncentives.push({
        apy: _market.incentiveSupplyApy || '0',
        token: _market.symbol,
        incentiveKind: 'staking',
        description: `Native ${_market.symbol} yield.`,
      });
      if (_market.canBeBorrowed) {
        // when borrowing assets whose value increases over time
        _market.incentiveBorrowApy = new Dec(_market.incentiveSupplyApy).mul(-1).toString();
        _market.incentiveBorrowToken = _market.symbol;
        _market.borrowIncentives.push({
          apy: _market.incentiveBorrowApy,
          token: _market.incentiveBorrowToken,
          incentiveKind: 'reward',
          description: `Due to the native yield of ${_market.symbol}, the value of the debt would increase over time.`,
        });
      }
    }

    const aTokenAddress = (_market as any).aTokenAddress.toLowerCase(); // DEV: Should aTokenAddress be in AaveV3AssetData type?
    if (merkleRewardsMap[aTokenAddress]?.supply) {
      const { apy, rewardTokenSymbol, description } = merkleRewardsMap[aTokenAddress].supply;
      _market.supplyIncentives.push({
        apy,
        token: rewardTokenSymbol,
        incentiveKind: 'reward',
        description,
      });
    }

    const vTokenAddress = (_market as any).vTokenAddress.toLowerCase(); // DEV: Should vTokenAddress be in AaveV3AssetData type?
    if (merkleRewardsMap[vTokenAddress]?.borrow) {
      const { apy, rewardTokenSymbol, description } = merkleRewardsMap[vTokenAddress].borrow;
      _market.borrowIncentives.push({
        apy,
        token: rewardTokenSymbol,
        incentiveKind: 'reward',
        description,
      });
    }

    if (meritRewardsMap.supply[_market.symbol]) {
      const { apy, rewardTokenSymbol, description } = meritRewardsMap.supply[_market.symbol];
      _market.supplyIncentives.push({
        apy,
        token: rewardTokenSymbol,
        incentiveKind: 'reward',
        description,
      });
    }

    if (meritRewardsMap.borrow[_market.symbol]) {
      const { apy, rewardTokenSymbol, description } = meritRewardsMap.borrow[_market.symbol];
      _market.borrowIncentives.push({
        apy,
        token: rewardTokenSymbol,
        incentiveKind: 'reward',
        description,
      });
    }

    if (!rewardForMarket) return;
    // @ts-ignore
    rewardForMarket.aIncentiveData.rewardsTokenInformation.forEach(supplyRewardData => {
      if (supplyRewardData) {
        if (+(supplyRewardData.emissionEndTimestamp.toString()) * 1000 < Date.now()) return;
        _market.incentiveSupplyToken = supplyRewardData.rewardTokenSymbol;
        // reward token is aave asset
        if (supplyRewardData.rewardTokenSymbol.startsWith('a') && supplyRewardData.rewardTokenSymbol.includes(_market.symbol)) _market.incentiveSupplyToken = _market.symbol;
        const supplyEmissionPerSecond = supplyRewardData.emissionPerSecond;
        const supplyRewardPrice = new Dec(supplyRewardData.rewardPriceFeed).div(10 ** +supplyRewardData.priceFeedDecimals)
          .toString();
        const rewardApy = new Dec(supplyEmissionPerSecond).div((10 ** +supplyRewardData.rewardTokenDecimals) / 100)
          .mul(365 * 24 * 3600)
          .mul(supplyRewardPrice)
          .div(_market.price)
          .div(_market.totalSupply)
          .toString();
        _market.incentiveSupplyApy = new Dec(_market.incentiveSupplyApy || '0').add(rewardApy)
          .toString();
        _market.supplyIncentives.push({
          token: getAaveUnderlyingSymbol(supplyRewardData.rewardTokenSymbol),
          apy: rewardApy,
          incentiveKind: 'reward',
          description: 'Eligible for protocol-level incentives.',
        });
      }
    });
    // @ts-ignore
    rewardForMarket.vIncentiveData.rewardsTokenInformation.forEach(borrowRewardData => {
      if (borrowRewardData) {
        if (+(borrowRewardData.emissionEndTimestamp.toString()) * 1000 < Date.now()) return;
        _market.incentiveBorrowToken = borrowRewardData.rewardTokenSymbol;
        if (borrowRewardData.rewardTokenSymbol.startsWith('a') && borrowRewardData.rewardTokenSymbol.includes(_market.symbol)) _market.incentiveBorrowToken = _market.symbol;
        const supplyEmissionPerSecond = borrowRewardData.emissionPerSecond;
        const supplyRewardPrice = new Dec(borrowRewardData.rewardPriceFeed).div(10 ** +borrowRewardData.priceFeedDecimals)
          .toString();
        const rewardApy = new Dec(supplyEmissionPerSecond).div((10 ** +borrowRewardData.rewardTokenDecimals) / 100)
          .mul(365 * 24 * 3600)
          .mul(supplyRewardPrice)
          .div(_market.price)
          .div(_market.totalBorrowVar)
          .toString();
        _market.incentiveBorrowApy = new Dec(_market.incentiveBorrowApy || '0').add(rewardApy)
          .toString();
        _market.borrowIncentives.push({
          token: getAaveUnderlyingSymbol(borrowRewardData.rewardTokenSymbol),
          apy: rewardApy,
          incentiveKind: 'reward',
          description: 'Eligible for protocol-level incentives.',
        });
      }
    });
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

  eModeCategoriesData[0] = {
    id: 0,
    label: '',
    liquidationBonus: '0',
    liquidationRatio: '0',
    collateralFactor: '0',
    collateralAssets: assetsData.map((a) => a.symbol),
    borrowAssets: assetsData.map((a) => a.symbol),
  };

  return { assetsData: payload, eModeCategoriesData };
}

export async function getAaveV3MarketData(provider: EthereumProvider, network: NetworkNumber, market: AaveMarketInfo, blockNumber: 'latest' | number = 'latest'): Promise<AaveV3MarketData> {
  return _getAaveV3MarketData(getViemProvider(provider, network), network, market, blockNumber);
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

export const _getAaveV3AccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const loanInfoContract = AaveV3ViewContractViem(provider, network, block);

  const market = AAVE_V3(network);
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

export const getAaveV3AccountBalances = async (provider: EthereumProvider, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => _getAaveV3AccountBalances(getViemProvider(provider, network), network, block, addressMapping, address);

export const _getAaveV3AccountData = async (provider: Client, network: NetworkNumber, address: EthAddress, extractedState: any, blockNumber: 'latest' | number = 'latest'): Promise<AaveV3PositionData> => {
  const {
    selectedMarket: market, assetsData,
  } = extractedState;
  let payload: AaveV3PositionData = {
    ...EMPTY_AAVE_DATA,
    lastUpdated: Date.now(),
  };
  if (!address) {
    return payload;
  }

  const loanInfoContract = AaveV3ViewContractViem(provider, network);
  const lendingPoolContract = createViemContractFromConfigFunc(market.lendingPool, market.lendingPoolAddress)(provider, network);
  const marketAddress = market.providerAddress;
  const _addresses = market.assets.map((a: string[]) => getAssetInfo(ethToWeth(a), network).address);

  const middleAddressIndex = Math.floor(_addresses.length / 2); // split addresses in half to avoid gas limit by multicall

  const [eModeCategory, tokenBalances1, tokenBalances2] = await Promise.all([
    lendingPoolContract.read.getUserEMode([address], setViemBlockNumber(blockNumber)),
    loanInfoContract.read.getTokenBalances([marketAddress, address, _addresses.slice(0, middleAddressIndex) as EthAddress[]], setViemBlockNumber(blockNumber)),
    loanInfoContract.read.getTokenBalances([marketAddress, address, _addresses.slice(middleAddressIndex, _addresses.length) as EthAddress[]], setViemBlockNumber(blockNumber)),
  ]);

  const loanInfo = [...tokenBalances1, ...tokenBalances2];

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
    const borrowed = new Dec(borrowedStable).add(borrowedVariable).toString();

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
      borrowed,
      borrowedUsd: new Dec(new Dec(borrowedVariable).add(borrowedStable)).mul(assetsData[asset].price).toString(),
      isBorrowed,
      interestMode,
    };
  });

  payload.eModeCategory = +(eModeCategory as BigInt).toString();
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

export const getAaveV3AccountData = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress, extractedState: any, blockNumber: 'latest' | number = 'latest'): Promise<AaveV3PositionData> => _getAaveV3AccountData(getViemProvider(provider, network), network, address, extractedState, blockNumber);

export const getAaveV3FullPositionData = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress, market: AaveMarketInfo): Promise<AaveV3PositionData> => {
  const marketData = await getAaveV3MarketData(provider, network, market);
  const positionData = await getAaveV3AccountData(provider, network, address, { assetsData: marketData.assetsData, selectedMarket: market, eModeCategoriesData: marketData.eModeCategoriesData });
  return positionData;
};
