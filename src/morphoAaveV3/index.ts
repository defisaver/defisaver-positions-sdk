import {
  assetAmountInEth, assetAmountInWei, getAssetInfo, getAssetInfoByAddress,
} from '@defisaver/tokens';
import { MorphoAaveMath } from '@morpho-org/morpho-aave-v3-sdk/lib/maths/AaveV3.maths';
import PoolInterestRates from '@morpho-org/morpho-aave-v3-sdk/lib/maths/PoolInterestRates';
import P2PInterestRates from '@morpho-org/morpho-aave-v3-sdk/lib/maths/P2PInterestRates';
import { BigNumber } from '@ethersproject/bignumber';
import Web3 from 'web3';
import Dec from 'decimal.js';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  ethToWeth, ethToWethByAddress, getAbiItem, isEnabledOnBitmap, isLayer2Network, wethToEthByAddress,
} from '../services/utils';
import {
  createContractWrapper,
  getConfigContractAbi,
  getConfigContractAddress,
} from '../contracts';
import { multicall } from '../multicall';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import {
  EModeCategoriesData,
  EModeCategoryData,
  MorphoAaveV3AssetData, MorphoAaveV3AssetsData, MorphoAaveV3MarketData, MorphoAaveV3MarketInfo, MorphoAaveV3PositionData,
} from '../types';
import { aprToApy, calculateBorrowingAssetLimit } from '../moneymarket';
import { EMPTY_AAVE_DATA } from '../aaveV3';
import { aaveAnyGetAggregatedPositionData } from '../helpers/aaveHelpers';
import { MORPHO_AAVE_V3_ETH } from '../markets/aave';

const morphoAaveMath = new MorphoAaveMath();
const poolInterestRates = new PoolInterestRates();
const p2pInterestRates = new P2PInterestRates();

const computeMorphoMarketData = (
  loanInfo: any, morphoMarketData: any, aaveIndexes: any, // TODO: morpho v3 type
) => {
  const { newPoolSupplyIndex, newPoolBorrowIndex } = poolInterestRates.computePoolIndexes({
    lastPoolSupplyIndex: BigNumber.from(aaveIndexes.liquidityIndex),
    lastPoolBorrowIndex: BigNumber.from(aaveIndexes.variableBorrowIndex),
    lastUpdateTimestamp: BigNumber.from(aaveIndexes.lastUpdateTimestamp),
    poolBorrowRatePerYear: BigNumber.from(loanInfo.borrowRateVariable),
    poolSupplyRatePerYear: BigNumber.from(loanInfo.supplyRate),
    currentTimestamp: BigNumber.from(new Dec(Date.now()).div(1000).toDP(0).toString()),
  });

  const proportionIdle = new Dec(morphoMarketData.idleSupply).eq(0)
    ? '0'
    : Dec.min(
        morphoAaveMath.INDEX_ONE.toString(),
        morphoAaveMath.indexDiv(
          morphoMarketData.idleSupply,
          morphoAaveMath.indexMul(morphoMarketData.deltas.supply.scaledP2PTotal, morphoMarketData.indexes.supply.p2pIndex).toString(),
        ).toString(),
      ).toString();

  const supplyProportionDelta = new Dec(morphoMarketData.idleSupply).eq(0)
    ? '0'
    : Dec.min(
        new Dec(morphoAaveMath.INDEX_ONE.toString()).sub(proportionIdle).toString(),
        morphoAaveMath.indexDiv(
          morphoAaveMath.indexMul(morphoMarketData.deltas.supply.scaledDelta, newPoolSupplyIndex),
          morphoAaveMath.indexMul(morphoMarketData.deltas.supply.scaledP2PTotal, morphoMarketData.indexes.supply.p2pIndex),
        ).toString(),
      ).toString();

  const borrowProportionDelta = new Dec(morphoMarketData.idleSupply).eq(0)
    ? '0'
    : Dec.min(
        morphoAaveMath.INDEX_ONE.toString(),
        morphoAaveMath.indexDiv(
          morphoAaveMath.indexMul(morphoMarketData.deltas.borrow.scaledDelta, newPoolBorrowIndex),
          morphoAaveMath.indexMul(morphoMarketData.deltas.borrow.scaledP2PTotal, morphoMarketData.indexes.borrow.p2pIndex),
        ).toString(),
      ).toString();

  const apys = morphoAaveMath.computeApysFromRates(
    BigNumber.from(loanInfo.supplyRate),
    BigNumber.from(loanInfo.borrowRateVariable),
    BigNumber.from(morphoMarketData.p2pIndexCursor),
    BigNumber.from(supplyProportionDelta),
    BigNumber.from(borrowProportionDelta),
    BigNumber.from(proportionIdle),
    BigNumber.from(morphoMarketData.reserveFactor),
  );

  const { newP2PSupplyIndex, newP2PBorrowIndex } = p2pInterestRates.computeP2PIndexes({
    p2pIndexCursor: BigNumber.from(morphoMarketData.p2pIndexCursor),
    lastBorrowIndexes: {
      p2pIndex: BigNumber.from(morphoMarketData.indexes.borrow.p2pIndex),
      poolIndex: BigNumber.from(aaveIndexes.variableBorrowIndex),
    },
    lastSupplyIndexes: {
      p2pIndex: BigNumber.from(morphoMarketData.indexes.supply.p2pIndex),
      poolIndex: BigNumber.from(aaveIndexes.liquidityIndex),
    },
    poolSupplyIndex: BigNumber.from(newPoolSupplyIndex),
    poolBorrowIndex: BigNumber.from(newPoolBorrowIndex),
    deltas: {
      borrow: {
        scaledDelta: BigNumber.from(morphoMarketData.deltas.borrow.scaledDelta),
        scaledP2PTotal: BigNumber.from(morphoMarketData.deltas.borrow.scaledP2PTotal),
      },
      supply: {
        scaledDelta: BigNumber.from(morphoMarketData.deltas.supply.scaledDelta),
        scaledP2PTotal: BigNumber.from(morphoMarketData.deltas.supply.scaledP2PTotal),
      },
    },
    reserveFactor: BigNumber.from(morphoMarketData.reserveFactor),
    proportionIdle: BigNumber.from(proportionIdle),
  });

  return {
    ...loanInfo,
    ...morphoMarketData,
    ...aaveIndexes,
    p2pBorrowAPY: new Dec(apys.p2pBorrowAPY.toString()).div(100).toString(),
    p2pSupplyAPY: new Dec(apys.p2pSupplyAPY.toString()).div(100).toString(),
    morphoBorrowInP2P: assetAmountInEth(morphoAaveMath.indexMul(
      morphoMarketData.deltas.borrow.scaledP2PTotal,
      newP2PBorrowIndex,
    ).toString(), getAssetInfoByAddress(loanInfo.underlyingTokenAddress).symbol),
    morphoBorrowOnPool: assetAmountInEth(morphoAaveMath.indexMul(
      morphoMarketData.scaledMorphoBorrowOnPool,
      newPoolBorrowIndex,
    ).toString(), getAssetInfoByAddress(loanInfo.underlyingTokenAddress).symbol),
    morphoSupplyInP2P: assetAmountInEth(morphoAaveMath.indexMul(
      morphoMarketData.deltas.supply.scaledP2PTotal,
      newP2PSupplyIndex,
    ).toString(), getAssetInfoByAddress(loanInfo.underlyingTokenAddress).symbol),
    morphoSupplyOnPool: assetAmountInEth(morphoAaveMath.indexMul(
      morphoMarketData.isCollateral ? '0' : morphoMarketData.scaledMorphoSupplyOnPool,
      newPoolSupplyIndex,
    ).toString(), getAssetInfoByAddress(loanInfo.underlyingTokenAddress).symbol),
  };
};

export const getMorphoAaveV3MarketsData = async (web3: Web3, network: NetworkNumber, selectedMarket: MorphoAaveV3MarketInfo, mainnetWeb3: Web3): Promise<MorphoAaveV3MarketData> => {
  // @ts-ignore
  const lendingPoolContract = createContractWrapper(web3, network, selectedMarket.lendingPool, selectedMarket.lendingPoolAddress);
  const aaveLendingPoolContract = createContractWrapper(web3, network, selectedMarket.aaveLendingPool, selectedMarket.aaveLendingPoolAddress);

  const _addresses = selectedMarket.assets.map((a: string) => getAssetInfo(ethToWeth(a)).address);

  const splitStart = Math.floor(_addresses.length / 2);
  const loanInfoCallsToSkip = 3; // skipping getFullTokensInfo calls at the start of multicallArray

  const AaveV3ViewAddress = getConfigContractAddress('AaveV3View', network);
  const AaveV3ViewAbi = getConfigContractAbi('AaveV3View');

  const multicallArray = [
    {
      target: AaveV3ViewAddress,
      abiItem: getAbiItem(AaveV3ViewAbi, 'getFullTokensInfo'),
      params: [selectedMarket.providerAddress, _addresses.slice(0, splitStart)],
    },
    {
      target: AaveV3ViewAddress,
      abiItem: getAbiItem(AaveV3ViewAbi, 'getFullTokensInfo'),
      params: [selectedMarket.providerAddress, _addresses.slice(splitStart, _addresses.length)],
    },
    {
      target: AaveV3ViewAddress,
      abiItem: getAbiItem(AaveV3ViewAbi, 'getAllEmodes'),
      params: [selectedMarket.providerAddress],
    },
    ...(_addresses.map((underlyingAddress: string) => (
      [{
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'market'),
        params: [underlyingAddress],
      },
      {
        target: aaveLendingPoolContract.options.address, // TODO: aave refactor add to Aave view
        // @ts-ignore
        abiItem: getAbiItem(getConfigContractAbi(selectedMarket.aaveLendingPool), 'getReserveData'),
        params: [underlyingAddress],
      }]
    ))).flat(),
  ];

  const multicallResponse = await multicall(multicallArray, web3, network);
  const loanInfo = [...multicallResponse[0][0], ...multicallResponse[1][0]];
  // Morpho Aave V3 ETH optimizer is hardcoded to use e mode category 1
  const eModeCategoryData: EModeCategoryData = {
    label: multicallResponse[2][0][0].label,
    id: 1,
    liquidationBonus: new Dec(multicallResponse[2][0][0].liquidationBonus).div(10000).toString(),
    liquidationRatio: new Dec(multicallResponse[2][0][0].liquidationThreshold).div(10000).toString(),
    collateralFactor: new Dec(multicallResponse[2][0][0].ltv).div(10000).toString(),
    borrowableBitmap: multicallResponse[2][0][0].borrowableBitmap,
    collateralBitmap: multicallResponse[2][0][0].collateralBitmap,
    borrowAssets: [],
    collateralAssets: [],
  };

  const IVariableDebtTokenAbi = getConfigContractAbi('IVariableDebtToken');
  const IATokenAbi = getConfigContractAbi('IAToken');

  const scaledBalanceMulticall = [
    ...loanInfo.map((_, i: number) => [
      {
        target: multicallResponse[(2 * i) + loanInfoCallsToSkip][0].variableDebtToken, // TODO: aave refactor add to Aave view
        abiItem: getAbiItem(IVariableDebtTokenAbi, 'scaledBalanceOf'),
        params: [lendingPoolContract.options.address],
      },
      {
        target: loanInfo[i].aTokenAddress, // TODO: aave refactor add to Aave view
        abiItem: getAbiItem(IATokenAbi, 'scaledBalanceOf'),
        params: [lendingPoolContract.options.address],
      },
    ]).flat(),
  ];

  const [scaledBalanceResponse, morphoRewards] = await Promise.allSettled([
    multicall(scaledBalanceMulticall, web3, network),
    fetch('https://api.morpho.xyz/rewards/emissions'),
  ]);

  if (scaledBalanceResponse.status !== 'fulfilled') {
    throw new Error('Failed to fetch market data.');
  }

  let morphoRewardsData: any = null;
  if (morphoRewards.status === 'fulfilled') {
    morphoRewardsData = morphoRewards.value.ok ? await morphoRewards.value.json() : null;
  }

  const assetsData: MorphoAaveV3AssetData[] = await Promise.all(loanInfo.map(async (info, i: number) => {
    const morphoMarketData = {
      ...multicallResponse[(2 * i) + loanInfoCallsToSkip][0],
      scaledMorphoBorrowOnPool: scaledBalanceResponse.value[2 * i][0],
      scaledMorphoSupplyOnPool: scaledBalanceResponse.value[(2 * i) + 1][0],
    };
    const marketData = computeMorphoMarketData(
      info,
      morphoMarketData,
      multicallResponse[(2 * i) + (loanInfoCallsToSkip + 1)][0],
    );

    const { symbol, address } = getAssetInfoByAddress(wethToEthByAddress(marketData.underlyingTokenAddress));


    if (isEnabledOnBitmap(Number(eModeCategoryData.collateralBitmap), Number(info.assetId)) && marketData.isCollateral) eModeCategoryData.collateralAssets.push(symbol);
    if (isEnabledOnBitmap(Number(eModeCategoryData.borrowableBitmap), Number(info.assetId))) eModeCategoryData.borrowAssets.push(symbol);

    const data = {
      symbol,
      morphoMarketData,
      hasDelta: new Dec(marketData.p2pSupplyAPY).minus(marketData.p2pBorrowAPY).gte(0.3),
      aTokenAddress: marketData.aTokenAddress,
      underlyingTokenAddress: address,
      price: new Dec(marketData.price.toString()).div(1e8).toString(), // is actually price in USD

      supplyRate: aprToApy(new Dec(marketData.supplyRate.toString()).div(1e25).toString()),
      supplyRateP2P: marketData.p2pSupplyAPY,
      borrowRate: aprToApy(new Dec(marketData.borrowRateVariable.toString()).div(1e25).toString()),
      borrowRateP2P: marketData.p2pBorrowAPY,
      totalSupply: assetAmountInEth(marketData.totalSupply.toString(), symbol),
      totalBorrow: assetAmountInEth(marketData.totalBorrow.toString(), symbol),

      totalSupplyP2P: marketData.morphoSupplyInP2P,
      totalSupplyPool: marketData.morphoSupplyOnPool,
      totalBorrowP2P: marketData.morphoBorrowInP2P,
      totalBorrowPool: marketData.morphoBorrowOnPool,

      supplyCap: marketData.supplyCap,
      borrowCap: marketData.borrowCap,
      usageAsCollateralEnabled: marketData.isCollateral,
      collateralFactor: marketData.isCollateral ? new Dec(marketData.collateralFactor).div(10000).toString() : '0',
      liquidationRatio: new Dec(marketData.liquidationRatio).div(10000).toString(),
      liquidationBonus: new Dec(marketData.liquidationBonus).div(10000).toString(),
      isInactive: !marketData.isActive,
      isFrozen: marketData.isFrozen,
      isPaused: marketData.isPaused,
      canBeBorrowed: !marketData.isFrozen
        && marketData.borrowingEnabled
        && !marketData.pauseStatuses.isBorrowPaused
        && !marketData.pauseStatuses.isDeprecated,
      canBeSupplied: !marketData.isFrozen
        && (marketData.isCollateral ? !marketData.pauseStatuses.isSupplyCollateralPaused : !marketData.pauseStatuses.isSupplyPaused)
        && !marketData.pauseStatuses.isDeprecated,
      canBeWithdrawn: marketData.isActive
        && !marketData.isPaused
        && marketData.isCollateral ? !marketData.pauseStatuses.isWithdrawCollateralPaused : !marketData.pauseStatuses.isWithdrawPaused,
      canBePayBacked: marketData.isActive && !marketData.isPaused && !marketData.pauseStatuses.isRepayPaused,
      reserveFactor: new Dec(marketData.reserveFactor).toString(),
      pauseStatus: {
        isSupplyPaused: marketData.pauseStatuses.isSupplyPaused,
        isSupplyCollateralPaused: marketData.pauseStatuses.isSupplyCollateralPaused,
        isWithdrawPaused: marketData.pauseStatuses.isWithdrawPaused,
        isWithdrawCollateralPaused: marketData.pauseStatuses.isWithdrawCollateralPaused,
        isRepayPaused: marketData.pauseStatuses.isRepayPaused,
        isBorrowPaused: marketData.pauseStatuses.isBorrowPaused,
        isDeprecated: marketData.pauseStatuses.isDeprecated,
        isP2PDisabled: marketData.pauseStatuses.isP2PDisabled,
      },
      marketLiquidity: assetAmountInEth(new Dec(marketData.totalSupply.toString())
        .sub(marketData.totalBorrow.toString())
        .toString(), symbol),
      utilization: new Dec(marketData.totalBorrow.toString())
        .div(new Dec(marketData.totalSupply.toString()))
        .times(100)
        .toString(),
      incentiveSupplyToken: 'MORPHO',
      incentiveBorrowToken: 'MORPHO',
      incentiveSupplyApy: morphoRewardsData?.markets?.[marketData.underlyingTokenAddress?.toLowerCase()]?.morphoRatePerSecondSupplySide || '0',
      incentiveBorrowApy: morphoRewardsData?.markets?.[marketData.underlyingTokenAddress?.toLowerCase()]?.morphoRatePerSecondBorrowSide || '0',

      totalBorrowVar: '0', // Morpho doesn't have all these, keeping it for compatability
      borrowRateStable: '0',
      disabledStableBorrowing: false,
      isIsolated: false,
      debtCeilingForIsolationMode: '0',
      isSiloed: false,
      isolationModeTotalDebt: '0',
      assetId: null,
      isolationModeBorrowingEnabled: false,
      isFlashLoanEnabled: false,
    };

    if (STAKING_ASSETS.includes(data.symbol)) {
      data.incentiveSupplyApy = await getStakingApy(data.symbol, mainnetWeb3);
      data.incentiveSupplyToken = data.symbol;
    }
    if (data.symbol === 'sDAI') {
      data.incentiveSupplyApy = await getStakingApy('sDAI', mainnetWeb3);
      data.incentiveSupplyToken = 'sDAI';
    }

    return data;
  }));

  const payload: MorphoAaveV3AssetsData = {};
  // Sort by market size
  assetsData
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalSupply).toString();
      const bMarket = new Dec(b.price).times(b.totalSupply).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((assetData: MorphoAaveV3AssetData, i: number) => {
      payload[assetData.symbol] = { ...assetData, sortIndex: i };
    });

  return { assetsData: payload, eModeCategoriesData: { 1: eModeCategoryData } };
};

export const getMorphoAaveV3AccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const selectedMarket = MORPHO_AAVE_V3_ETH(network);
  // @ts-ignore
  const lendingPoolContract = createContractWrapper(web3, network, selectedMarket.lendingPool, selectedMarket.lendingPoolAddress);
  // @ts-ignore
  const protocolDataProviderContract = createContractWrapper(web3, network, selectedMarket.protocolData, selectedMarket.protocolDataAddress);

  const reserveTokens = await protocolDataProviderContract.methods.getAllReservesTokens().call({}, block);
  const symbols = reserveTokens.map(({ symbol }: { symbol: string }) => symbol);
  const _addresses = reserveTokens.map(({ tokenAddress }: { tokenAddress: EthAddress }) => tokenAddress);

  const multicallArray = [
    ...(_addresses.map((underlyingAddress: string) => ([
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'market'),
        params: [underlyingAddress],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledP2PSupplyBalance'),
        params: [underlyingAddress, address],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledPoolSupplyBalance'),
        params: [underlyingAddress, address],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledCollateralBalance'),
        params: [underlyingAddress, address],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledP2PBorrowBalance'),
        params: [underlyingAddress, address],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledPoolBorrowBalance'),
        params: [underlyingAddress, address],
      },
    ]))).flat(),
  ];

  const multicallResponse = await multicall(multicallArray, web3, network, block);

  const numberOfMultiCalls = 6;

  _addresses.forEach((underlyingAddr: string, i: number) => {
    const currentMulticallIndex = numberOfMultiCalls * i;
    const morphoMarketData = multicallResponse[currentMulticallIndex][0];
    const assetAddr = wethToEthByAddress(underlyingAddr, network).toLowerCase();
    const { symbol } = getAssetInfoByAddress(assetAddr, network);

    const suppliedP2P = morphoAaveMath.indexMul(
      multicallResponse[currentMulticallIndex + 1][0],
      morphoMarketData.indexes.supply.p2pIndex,
    ).toString();
    const suppliedPool = morphoAaveMath.indexMul(
      multicallResponse[currentMulticallIndex + 2][0],
      morphoMarketData.indexes.supply.poolIndex,
    ).toString();
    const suppliedTotal = new Dec(suppliedP2P).add(suppliedPool).toString();
    const suppliedCollateral = morphoAaveMath.indexMul(
      multicallResponse[currentMulticallIndex + 3][0],
      morphoMarketData.indexes.supply.poolIndex,
    ).toString();
    const supplied = new Dec(suppliedTotal).add(suppliedCollateral).toString();

    const borrowedP2P = morphoAaveMath.indexMul(
      multicallResponse[currentMulticallIndex + 4][0],
      morphoMarketData.indexes.borrow.p2pIndex,
    ).toString();
    const borrowedPool = morphoAaveMath.indexMul(
      multicallResponse[currentMulticallIndex + 5][0],
      morphoMarketData.indexes.borrow.poolIndex,
    ).toString();
    const borrowed = new Dec(borrowedP2P).add(borrowedPool).toString();

    balances = {
      collateral: {
        ...balances.collateral,
        [addressMapping ? assetAddr : symbol]: supplied,
      },
      debt: {
        ...balances.debt,
        [addressMapping ? assetAddr : symbol]: borrowed,
      },
    };
  });

  return balances;
};

export const getMorphoAaveV3AccountData = async (
  web3: Web3,
  network: NetworkNumber,
  address: string,
  assetsData: MorphoAaveV3AssetsData,
  eModeCategoriesData: EModeCategoriesData,
  delegator: string,
  selectedMarket: MorphoAaveV3MarketInfo,
): Promise<MorphoAaveV3PositionData> => {
  if (!address) {
    throw new Error('No address provided.');
  }
  const eModeCategory = 1; // TODO: morpho v3 pass as arg

  let payload: MorphoAaveV3PositionData = {
    ...EMPTY_AAVE_DATA,
    usedAssets: {}, // Typescript is bugging out due to JSDocs version of AavePositionData.UsedAssets
    eModeCategory,
    minRatio: '100',
    lastUpdated: Date.now(),
  };

  // @ts-ignore
  const lendingPoolContract = createContractWrapper(web3, network, selectedMarket.lendingPool, selectedMarket.lendingPoolAddress);

  const isManagedBy = delegator && lendingPoolContract?.methods?.isManagedBy
    ? await lendingPoolContract.methods.isManagedBy(address, delegator).call()
    : null;
  payload.approvedManager = isManagedBy ? delegator : '';

  const markets = Object.values(assetsData);
  // @ts-ignore
  const marketAddresses = markets.map(m => ethToWethByAddress(m.underlyingTokenAddress));

  const multicallArray = [
    ...(marketAddresses.map((marketAddr) => [
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledP2PSupplyBalance'),
        params: [marketAddr, address],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledPoolSupplyBalance'),
        params: [marketAddr, address],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledCollateralBalance'),
        params: [marketAddr, address],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledP2PBorrowBalance'),
        params: [marketAddr, address],
      },
      {
        target: lendingPoolContract.options.address,
        abiItem: getAbiItem(lendingPoolContract.options.jsonInterface, 'scaledPoolBorrowBalance'),
        params: [marketAddr, address],
      },
    ]).flat()),
  ];

  const multicallResponse = await multicall(multicallArray, web3, network);

  markets.forEach((market: any, i: number) => {
    const { symbol } = getAssetInfoByAddress(wethToEthByAddress(market.underlyingTokenAddress));
    const assetAavePrice = assetsData[symbol].price;

    const suppliedP2P = assetAmountInEth(morphoAaveMath.indexMul(
      multicallResponse[i * 5][0],
      market.morphoMarketData.indexes.supply.p2pIndex,
    ), symbol);
    const suppliedPool = assetAmountInEth(morphoAaveMath.indexMul(
      multicallResponse[(i * 5) + 1][0],
      market.morphoMarketData.indexes.supply.poolIndex,
    ), symbol);
    const suppliedTotal = new Dec(suppliedP2P).add(suppliedPool).toString();
    const suppliedCollateral = assetAmountInEth(morphoAaveMath.indexMul(
      multicallResponse[(i * 5) + 2][0],
      market.morphoMarketData.indexes.supply.poolIndex,
    ), symbol);
    const supplied = new Dec(suppliedTotal).add(suppliedCollateral).toString();
    const suppliedMatched = new Dec(suppliedTotal).eq(0)
      ? '0'
      : morphoAaveMath.percentDiv(
          assetAmountInWei(suppliedP2P, symbol),
          assetAmountInWei(suppliedTotal, symbol),
        ).div(100).toString();

    const borrowedP2P = assetAmountInEth(morphoAaveMath.indexMul(
      multicallResponse[(i * 5) + 3][0],
      market.morphoMarketData.indexes.borrow.p2pIndex,
    ), symbol);
    const borrowedPool = assetAmountInEth(morphoAaveMath.indexMul(
      multicallResponse[(i * 5) + 4][0],
      market.morphoMarketData.indexes.borrow.poolIndex,
    ), symbol);
    const borrowed = new Dec(borrowedP2P).add(borrowedPool).toString();
    const borrowedMatched = new Dec(borrowed).eq(0)
      ? '0'
      : morphoAaveMath.percentDiv(
          assetAmountInWei(borrowedP2P, symbol),
          assetAmountInWei(borrowed, symbol),
        ).div(100).toString();

    const supplyRate = new Dec(new Dec(market.supplyRateP2P).mul(suppliedMatched))
      .add(new Dec(market.supplyRate).mul(100 - +suppliedMatched)).div(100).toString();
    const borrowRate = new Dec(new Dec(market.borrowRateP2P).mul(borrowedMatched))
      .add(new Dec(market.borrowRate).mul(100 - +borrowedMatched)).div(100).toString();

    if (new Dec(supplied).gt(0) || new Dec(borrowed).gt(0)) {
      payload.usedAssets[symbol] = {
        symbol,
        supplied,
        suppliedP2P,
        suppliedPool,
        suppliedMatched,
        borrowed,
        borrowedP2P,
        borrowedPool,
        borrowedMatched,
        supplyRate,
        borrowRate,
        suppliedUsd: new Dec(supplied).mul(assetAavePrice).toString(),
        suppliedP2PUsd: new Dec(suppliedP2P).mul(assetAavePrice).toString(),
        suppliedPoolUsd: new Dec(suppliedPool).mul(assetAavePrice).toString(),
        borrowedUsd: new Dec(borrowed).mul(assetAavePrice).toString(),
        borrowedP2PUsd: new Dec(borrowedP2P).mul(assetAavePrice).toString(),
        borrowedPoolUsd: new Dec(borrowedPool).mul(assetAavePrice).toString(),
        borrowedVariable: borrowed,
        borrowedUsdVariable: new Dec(borrowed).mul(assetAavePrice).toString(),
        collateral: new Dec(suppliedCollateral).gt(0),
        isSupplied: new Dec(supplied).gt(0),
        isBorrowed: new Dec(borrowed).gt(0),
        // supplyRate: new Dec(market.experiencedSupplyAPY._hex).div(100).toString(),
        // borrowRate: new Dec(market.experiencedBorrowAPY._hex).div(100).toString(),
        limit: '0',

        interestMode: '', // Morpho doesn't have all these, keeping it for compatability
        stableBorrowRate: '0',
        borrowedStable: '0',
        borrowedUsdStable: '0',
        stableLimit: '0',
        variableLimit: '0',
      };
    }
  });

  payload.eModeCategory = eModeCategory;
  payload = {
    ...payload,
    ...aaveAnyGetAggregatedPositionData({
      usedAssets: payload.usedAssets, assetsData, eModeCategory, selectedMarket, eModeCategoriesData,
    }),
  };

  // Calculate borrow limits per asset
  Object.values(payload.usedAssets).forEach((item) => {
    if (item.isBorrowed) {
      item.limit = calculateBorrowingAssetLimit(item.borrowedUsd, payload.borrowLimitUsd);
    }
  });

  return payload;
};

export const getMorphoAaveV3FullPositionData = async (web3: Web3, network: NetworkNumber, address: string, delegator: string, market: MorphoAaveV3MarketInfo, mainnetWeb3: Web3): Promise<MorphoAaveV3PositionData> => {
  const marketData = await getMorphoAaveV3MarketsData(web3, network, market, mainnetWeb3);
  const positionData = await getMorphoAaveV3AccountData(web3, network, address, marketData.assetsData, marketData.eModeCategoriesData, delegator, market);
  return positionData;
};
