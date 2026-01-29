import { assetAmountInEth, assetAmountInWei, getAssetInfo } from '@defisaver/tokens';
import { Client } from 'viem';
import Dec from 'decimal.js';
import {
  AaveIncentiveDataProviderV3ContractViem,
  AaveIncentivesControllerViem,
  AaveV3ViewContractViem,
  createViemContractFromConfigFunc,
  StkAAVEViem,
} from '../contracts';
import { aaveAnyGetAggregatedPositionData, aaveV3IsInIsolationMode, aaveV3IsInSiloedMode } from '../helpers/aaveHelpers';
import { AAVE_V3 } from '../markets/aave';
import { aprToApy, calculateBorrowingAssetLimit } from '../moneymarket';
import {
  getWrappedNativeAssetFromUnwrapped,
  isEnabledOnBitmap,
  isLayer2Network,
  wethToEth,
  wethToEthByAddress,
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
} from '../types';
import {
  Blockish,
  EthAddress,
  EthereumProvider,
  IncentiveEligibilityId,
  IncentiveKind,
  NetworkNumber,
  PositionBalances,
  HexString,
} from '../types/common';
import { getViemProvider, setViemBlockNumber } from '../services/viem';
import { getMeritCampaigns } from './merit';
import { getAaveUnderlyingSymbol, getMerkleCampaigns } from './merkl';
import { SECONDS_PER_YEAR } from '../constants';

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
  const _addresses = market.assets.map(a => getAssetInfo(getWrappedNativeAssetFromUnwrapped(a), network).address);

  const isL2 = isLayer2Network(network);
  const loanInfoContract = AaveV3ViewContractViem(provider, network);
  const aaveIncentivesContract = AaveIncentiveDataProviderV3ContractViem(provider, network);
  const marketAddress = market.providerAddress;
  const networksWithIncentives = [NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Opt, NetworkNumber.Linea, NetworkNumber.Plasma];
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

  // same break logic as view contract
  let missCounter = 0;
  const eModeCategoriesData: EModeCategoriesData = {};
  for (let i = 0; i < eModesInfo.length; i++) {
    if (eModesInfo[i].liquidationThreshold !== 0) {
      eModeCategoriesData[i + 1] = {
        label: eModesInfo[i].label,
        id: i + 1,
        liquidationBonus: new Dec(eModesInfo[i].liquidationBonus).div(10000).toString(),
        liquidationRatio: new Dec(eModesInfo[i].liquidationThreshold).div(10000).toString(),
        collateralFactor: new Dec(eModesInfo[i].ltv).div(10000).toString(),
        borrowableBitmap: eModesInfo[i].borrowableBitmap.toString(),
        collateralBitmap: eModesInfo[i].collateralBitmap.toString(),
        ltvzeroBitmap: eModesInfo[i].ltvzeroBitmap.toString(),
        borrowAssets: [],
        collateralAssets: [],
        ltvZeroAssets: [],
      };
      missCounter = 0;
    } else {
      ++missCounter;
      if (missCounter > 2) break;
    }
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
        if (isEnabledOnBitmap(Number(eModeCategoriesData[eModeIndex].ltvzeroBitmap), Number(tokenMarket.assetId))) eModeCategoriesData[eModeIndex].ltvZeroAssets.push(symbol);
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
      const yieldApy = await getStakingApy(_market.symbol, network as NetworkNumber);
      _market.supplyIncentives.push({
        apy: yieldApy,
        token: _market.symbol,
        incentiveKind: IncentiveKind.Staking,
        description: `Native ${_market.symbol} yield.`,
      });
      if (_market.canBeBorrowed) {
        // when borrowing assets whose value increases over time
        _market.borrowIncentives.push({
          apy: new Dec(yieldApy).mul(-1).toString(),
          token: _market.symbol,
          incentiveKind: IncentiveKind.Reward,
          description: `Due to the native yield of ${_market.symbol}, the value of the debt would increase over time.`,
        });
      }
    }

    const aTokenAddress = (_market as any).aTokenAddress.toLowerCase(); // DEV: Should aTokenAddress be in AaveV3AssetData type?
    if (merkleRewardsMap[aTokenAddress]?.supply) {
      const {
        apy, rewardTokenSymbol, description, identifier,
      } = merkleRewardsMap[aTokenAddress].supply;
      _market.supplyIncentives.push({
        apy,
        token: rewardTokenSymbol,
        incentiveKind: IncentiveKind.Reward,
        description,
        eligibilityId: identifier as IncentiveEligibilityId,
      });
    }

    const vTokenAddress = (_market as any).vTokenAddress.toLowerCase(); // DEV: Should vTokenAddress be in AaveV3AssetData type?
    if (merkleRewardsMap[vTokenAddress]?.borrow) {
      const {
        apy, rewardTokenSymbol, description, identifier,
      } = merkleRewardsMap[vTokenAddress].borrow;
      _market.borrowIncentives.push({
        apy,
        token: rewardTokenSymbol,
        incentiveKind: IncentiveKind.Reward,
        description,
        eligibilityId: identifier as IncentiveEligibilityId,
      });
    }

    if (meritRewardsMap.supply[_market.symbol]) {
      const { apy, rewardTokenSymbol, description } = meritRewardsMap.supply[_market.symbol];
      _market.supplyIncentives.push({
        apy,
        token: rewardTokenSymbol,
        incentiveKind: IncentiveKind.Reward,
        description,
      });
    }

    if (meritRewardsMap.borrow[_market.symbol]) {
      const { apy, rewardTokenSymbol, description } = meritRewardsMap.borrow[_market.symbol];
      _market.borrowIncentives.push({
        apy,
        token: rewardTokenSymbol,
        incentiveKind: IncentiveKind.Reward,
        description,
      });
    }

    if (!rewardForMarket) return;
    // @ts-ignore
    rewardForMarket.aIncentiveData.rewardsTokenInformation.forEach(supplyRewardData => {
      if (supplyRewardData) {
        if (+(supplyRewardData.emissionEndTimestamp.toString()) * 1000 < Date.now()) return;
        // reward token is aave asset
        const supplyEmissionPerSecond = supplyRewardData.emissionPerSecond;
        const supplyRewardPrice = new Dec(supplyRewardData.rewardPriceFeed).div(10 ** +supplyRewardData.priceFeedDecimals)
          .toString();
        const rewardApy = new Dec(supplyEmissionPerSecond).div((10 ** +supplyRewardData.rewardTokenDecimals) / 100)
          .mul(365 * 24 * 3600)
          .mul(supplyRewardPrice)
          .div(_market.price)
          .div(_market.totalSupply)
          .toString();
        _market.supplyIncentives.push({
          token: getAaveUnderlyingSymbol(supplyRewardData.rewardTokenSymbol),
          apy: rewardApy,
          incentiveKind: IncentiveKind.Reward,
          description: 'Eligible for protocol-level incentives.',
        });
      }
    });
    // @ts-ignore
    rewardForMarket.vIncentiveData.rewardsTokenInformation.forEach(borrowRewardData => {
      if (borrowRewardData) {
        if (+(borrowRewardData.emissionEndTimestamp.toString()) * 1000 < Date.now()) return;
        const supplyEmissionPerSecond = borrowRewardData.emissionPerSecond;
        const supplyRewardPrice = new Dec(borrowRewardData.rewardPriceFeed).div(10 ** +borrowRewardData.priceFeedDecimals)
          .toString();
        const rewardApy = new Dec(supplyEmissionPerSecond).div((10 ** +borrowRewardData.rewardTokenDecimals) / 100)
          .mul(365 * 24 * 3600)
          .mul(supplyRewardPrice)
          .div(_market.price)
          .div(_market.totalBorrowVar)
          .toString();
        _market.borrowIncentives.push({
          token: getAaveUnderlyingSymbol(borrowRewardData.rewardTokenSymbol),
          apy: rewardApy,
          incentiveKind: IncentiveKind.Reward,
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
    ltvZeroAssets: [],
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
  exposure: 'N/A',
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

  // @ts-ignore
  const reserveTokens = await protocolDataProviderContract.read.getAllReservesTokens(setViemBlockNumber(block)) as { symbol: string, tokenAddress: EthAddress }[];
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
    selectedMarket: market, assetsData, eModeCategoriesData,
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
  const _addresses = market.assets.map((a: string) => getAssetInfo(getWrappedNativeAssetFromUnwrapped(a), network).address);

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
    const eModeCategoryData = eModeCategoriesData[+(eModeCategory as BigInt).toString()];
    const usageAsCollateralIsEnabledInEmode = eModeCategoryData?.collateralAssets.includes(asset);
    const enabledAsCollateral = (assetsData[asset].usageAsCollateralEnabled || usageAsCollateralIsEnabledInEmode) ? tokenInfo.enabledAsCollateral : false;

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

// aTokens eligible for AAVE rewards
export const REWARDABLE_ASSETS = [
  '0x028171bCA77440897B824Ca71D1c56caC55b68A3', // DAI
  '0x6C3c78838c761c6Ac7bE9F59fe808ea2A6E4379d',
  '0xD37EE7e4f452C6638c96536e68090De8cBcdb583', // GUSD
  '0x279AF5b99540c1A3A7E3CDd326e19659401eF99e',
  '0xBcca60bB61934080951369a648Fb03DF4F96263C', // USDC
  '0x619beb58998eD2278e08620f97007e1116D5D25b',
  '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811', // USDT
  '0x531842cEbbdD378f8ee36D171d6cC9C4fcf475Ec',
  '0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656', // WBTC
  '0x9c39809Dec7F95F5e0713634a4D0701329B3b4d2',
  '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e', // WETH
  '0xF63B34710400CAd3e044cFfDcAb00a0f32E33eCf',
  '0xa06bC25B5805d5F8d82847D191Cb4Af5A3e873E0', // LINK
  '0x0b8f12b1788BFdE65Aa1ca52E3e9F3Ba401be16D',
  '0x6C5024Cd4F8A59110119C56f8933403A539555EB', // SUSD
  '0xdC6a3Ab17299D9C2A412B0e0a4C1f55446AE0817',
  '0x5165d24277cD063F5ac44Efd447B27025e888f37', // YFI
  '0x7EbD09022Be45AD993BAA1CEc61166Fcc8644d97',
  '0xF256CC7847E919FAc9B808cC216cAc87CCF2f47a', // xSUSHI
  '0xfAFEDF95E21184E3d880bd56D4806c4b8d31c69A',
  '0xB9D7CB55f463405CDfBe4E90a6D2Df01C2B92BF1', // UNI
  '0x5BdB050A92CADcCfCDcCCBFC17204a1C9cC0Ab73',
  '0xc713e5E149D5D0715DcD1c156a020976e7E56B88', // MKR
  '0xba728eAd5e496BE00DCF66F650b6d7758eCB50f8',
  '0x101cc05f4A51C0319f570d5E146a8C625198e636', // TUSD
  '0x01C0eb1f8c6F1C1bF74ae028697ce7AA2a8b0E92',
  '0xc9BC48c72154ef3e5425641a3c747242112a46AF', // RAI
  '0xB5385132EE8321977FfF44b60cDE9fE9AB0B4e6b',
  '0x272F97b7a56a387aE942350bBC7Df5700f8a4576', // BAL
  '0x13210D4Fe0d5402bd7Ecbc4B5bC5cFcA3b71adB0',
  '0x2e8f4bdbe3d47d7d7de490437aea9915d930f1a3', // USDP
  '0xfdb93b3b10936cf81fa59a02a7523b6e2149b2b7',
  '0xA361718326c15715591c299427c62086F69923D9', // BUSD
  '0xbA429f7011c9fa04cDd46a2Da24dc0FF0aC6099c',
  '0xd4937682df3C8aEF4FE912A96A74121C0829E664', // FRAX
  '0xfE8F19B17fFeF0fDbfe2671F248903055AFAA8Ca',
  '0x683923dB55Fead99A79Fa01A27EeC3cB19679cC3', // FEI
  '0xC2e10006AccAb7B45D9184FcF5b7EC7763f5BaAe',
  '0x8dAE6Cb04688C62d939ed9B68d32Bc62e49970b1', // CRV
  '0x00ad8eBF64F141f1C81e9f8f792d3d1631c6c684',
  '0x6F634c6135D2EBD550000ac92F494F9CB8183dAe', // DPI
  '0x4dDff5885a67E4EffeC55875a3977D7E60F82ae0',
] as const;

export const fetchYearlyMeritApyForStakingGho = async () => {
  try {
    const response = await fetch('https://apps.aavechan.com/api/merit/aprs', { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    const apr = data?.currentAPR?.actionsAPR?.['ethereum-stkgho'] || '0' as string;
    const apy = aprToApy(apr);
    const apyWithDFSBonus = new Dec(apy).mul(1.05).toString(); // 5% bonus for DFS users
    return apyWithDFSBonus;
  } catch (e) {
    const message = 'External API Failure: Failed to fetch yearly merit APY for staking GHO';
    console.error(message, e);
    return '0';
  }
};

export const getStakeAaveData = async (provider: Client, network: NetworkNumber, address: EthAddress) => {
  const stkGhoAddress = getAssetInfo('stkGHO').address as HexString;
  const stkAaveAddress = getAssetInfo('stkAAVE').address as HexString;

  const AaveIncentivesController = AaveIncentivesControllerViem(provider, network);
  const stkAAVE = StkAAVEViem(provider, network);
  const stkGHO = createViemContractFromConfigFunc('Erc20', stkGhoAddress as HexString)(provider, network);


  const [aaveRewardsBalance, emissionsPerSecond, stkAAVEBalance, stkAAVETotalSupply, stkGHOBalance, ghoMeritApy] = await Promise.all([
    AaveIncentivesController.read.getRewardsBalance([REWARDABLE_ASSETS, address]),
    stkAAVE.read.assets([stkAaveAddress]),
    stkAAVE.read.balanceOf([address]),
    stkAAVE.read.totalSupply(),
    stkGHO.read.balanceOf([address]),
    fetchYearlyMeritApyForStakingGho(),
  ]);


  const stkAaveApy = new Dec(assetAmountInEth(emissionsPerSecond[0].toString(), 'GHO') || 0).mul(SECONDS_PER_YEAR).mul(100).div(assetAmountInEth(stkAAVETotalSupply.toString(), 'stkAAVE'))
    .toString();
  return {
    activatedCooldown: '0',
    activatedCooldownAmount: '0',
    stkAaveRewardsBalance: '0',
    aaveRewardsBalance: assetAmountInEth(aaveRewardsBalance.toString(), 'AAVE'),
    stkAaveBalance: assetAmountInEth(stkAAVEBalance.toString(), 'stkAAVE'),
    stkGhoBalance: assetAmountInEth(stkGHOBalance.toString(), 'GHO'),
    ghoMeritApy,
    stkAaveApy,
  };
};

export {
  getMeritCampaigns,
  getMerkleCampaigns,
};
