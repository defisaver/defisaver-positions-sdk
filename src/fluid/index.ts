import Web3 from 'web3';
import Dec from 'decimal.js';
import {
  assetAmountInEth,
  AssetData, getAssetInfo, getAssetInfoByAddress,
} from '@defisaver/tokens';
import { EthAddress, NetworkNumber } from '../types/common';
import {
  FluidAggregatedVaultData,
  FluidAssetData, FluidAssetsData,
  FluidMarketData,
  FluidMarketInfo,
  FluidUsedAsset,
  FluidUsedAssets,
  FluidVaultData,
  FluidVaultType, InnerFluidMarketData,
} from '../types';
import { DFSFeedRegistryContract, FeedRegistryContract, FluidViewContract } from '../contracts';
import { getEthAmountForDecimals, isMainnetNetwork } from '../services/utils';
import {
  getFluidAggregatedData,
  mergeAssetData,
  mergeUsedAssets,
  parseDexBorrowData,
  parseDexSupplyData,
} from '../helpers/fluidHelpers';
import { FluidView } from '../types/contracts/generated';
import { chunkAndMulticall } from '../multicall';
import { getFluidMarketInfoById, getFluidVersionsDataForNetwork, getFTokenAddress } from '../markets';
import { USD_QUOTE } from '../constants';
import {
  getChainlinkAssetAddress,
  getWeETHChainLinkPriceCalls,
  getWstETHChainLinkPriceCalls,
  getWstETHPriceFluid,
  parseWeETHPriceCalls,
  parseWstETHPriceCalls,
  getEthPriceForFluid,
  getBTCPriceForFluid,
} from '../services/priceService';
import { getStakingApy, STAKING_ASSETS } from '../staking';

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

const parseVaultType = (vaultType: number) => {
  switch (vaultType) {
    case 10000: return FluidVaultType.T1;
    case 20000: return FluidVaultType.T2;
    case 30000: return FluidVaultType.T3;
    case 40000: return FluidVaultType.T4;
    default: return FluidVaultType.Unknown;
  }
};

const getChainLinkPricesForTokens = async (
  tokens: string[],
  network: NetworkNumber,
  web3: Web3,
): Promise<{ [key: string]: string }> => {
  const isMainnet = isMainnetNetwork(network);

  const noDuplicateTokens = new Array(...new Set(tokens));

  // TODO: this needs to be refactored
  const ethPriceChainlink = await getEthPriceForFluid(web3, network);
  const btcPriceChainlink = await getBTCPriceForFluid(web3, network);

  const calls = noDuplicateTokens.flatMap((address) => {
    const assetInfo = getAssetInfoByAddress(address, network);
    const isTokenUSDA = assetInfo.symbol === 'USDA';
    if (isTokenUSDA) return;
    const chainLinkFeedAddress = getChainlinkAssetAddress(assetInfo.symbol, network);

    if (assetInfo.symbol === 'wstETH') return getWstETHChainLinkPriceCalls(web3, network);
    if (assetInfo.symbol === 'weETH') return getWeETHChainLinkPriceCalls(web3, network);

    if (isMainnet) {
      const feedRegistryContract = FeedRegistryContract(web3, NetworkNumber.Eth);
      return ({
        target: feedRegistryContract.options.address,
        abiItem: feedRegistryContract.options.jsonInterface.find(({ name }) => name === 'latestAnswer'),
        params: [chainLinkFeedAddress, USD_QUOTE],
      });
    }

    const feedRegistryContract = DFSFeedRegistryContract(web3, network);
    return ({
      target: feedRegistryContract.options.address,
      abiItem: feedRegistryContract.options.jsonInterface.find(({ name }) => name === 'latestRoundData'),
      params: [chainLinkFeedAddress, USD_QUOTE],
    });
  });

  const prices = await chunkAndMulticall(calls, 10, 'latest', web3, network);

  let offset = 0; // wstETH has 3 calls, while others have only 1, so we need to keep track
  return noDuplicateTokens.reduce((acc, token, i) => {
    const assetInfo = getAssetInfoByAddress(token, network);
    switch (assetInfo.symbol) {
      case 'USDA':
        acc[token] = '100000000';
        break;

      case 'wstETH': {
        const {
          ethPrice,
          wstETHRate,
        } = parseWstETHPriceCalls(prices[i + offset][0], prices[i + offset + 1], prices[i + offset + 2][0]);
        offset += 2;
        acc[token] = new Dec(ethPrice).mul(wstETHRate).toString();
        break;
      }

      // TODO: These addresses do not have chainlink feeds, so we need to handle them separately, this is hotfix
      case 'ezETH': {
        acc[token] = new Dec(ethPriceChainlink).mul(1.049).toString();
        break;
      }
      case 'rsETH': {
        acc[token] = new Dec(ethPriceChainlink).mul(1.0454).toString();
        break;
      }
      case 'weETHs': {
        acc[token] = new Dec(ethPriceChainlink).mul(1.026).toString();
        break;
      }
      case 'LBTC': {
        acc[token] = new Dec(btcPriceChainlink).toString();
        break;
      }
      case 'sUSDS': {
        acc[token] = new Dec('105276929').toString();
        break;
      }

      case 'weETH': {
        const {
          ethPrice,
          weETHRate,
        } = parseWeETHPriceCalls(prices[i + offset][0], prices[i + offset + 1], prices[i + offset + 2][0]);
        offset += 2;
        acc[token] = new Dec(ethPrice).mul(weETHRate).toString();
        break;
      }

      default:
        acc[token] = new Dec(prices[i + offset].answer).div(1e8).toString();
        break;
    }
    return acc;
  }, {} as { [key: string]: string });
};


const getTokenPriceFromChainlink = async (asset: AssetData, network: NetworkNumber, web3: Web3) => {
  if (asset.symbol === 'sUSDS') {
    return new Dec('105276929').div(1e8).toString();
  }
  const isTokenUSDA = asset.symbol === 'USDA';
  const isMainnet = isMainnetNetwork(network);
  const loanTokenFeedAddress = getChainlinkAssetAddress(asset.symbol, network);

  let loanTokenPrice;
  if (asset.symbol === 'wstETH') {
    // need to handle wstETH for l2s inside getWstETHPrice
    loanTokenPrice = await getWstETHPriceFluid(web3, network);
  } else if (isMainnet) {
    const feedRegistryContract = FeedRegistryContract(web3, NetworkNumber.Eth);
    loanTokenPrice = isTokenUSDA ? '100000000' : await feedRegistryContract.methods.latestAnswer(loanTokenFeedAddress, USD_QUOTE).call();
  } else {
    // Currently only base network is supported
    const feedRegistryContract = DFSFeedRegistryContract(web3, network);
    const roundPriceData = isTokenUSDA ? { answer: '100000000' } : await feedRegistryContract.methods.latestRoundData(loanTokenFeedAddress, USD_QUOTE).call();
    loanTokenPrice = roundPriceData.answer;
  }

  return new Dec(loanTokenPrice).div(1e8).toString();
};

const getMarketRateForDex = (token1PerShare: string, token0PerShare: string, rate0: string, rate1: string, price0: string, price1: string) => {
  const token0PerShareUsd = new Dec(token0PerShare).mul(price0).toString();
  const token1PerShareUsd = new Dec(token1PerShare).mul(price1).toString();
  const sharesCombinedUsd = new Dec(token0PerShareUsd).plus(token1PerShareUsd);

  const rate0PerShare = new Dec(rate0).mul(token0PerShareUsd).div(sharesCombinedUsd).toString();

  const rate1PerShare = new Dec(rate1).mul(token1PerShareUsd).div(sharesCombinedUsd).toString();

  return new Dec(rate0PerShare).plus(rate1PerShare).toString();
};

const getAdditionalMarketRateForDex = (token1PerShare: string, token0PerShare: string, incentiveSupplyRate0: string, incentiveSupplyRate1: string, price0: string, price1: string) => {
  const token0PerShareUsd = new Dec(token0PerShare).mul(price0).toString();
  const token1PerShareUsd = new Dec(token1PerShare).mul(price1).toString();
  const sharesCombinedUsd = new Dec(token0PerShareUsd).plus(token1PerShareUsd);

  const rate0PerShare = incentiveSupplyRate0 ? new Dec(incentiveSupplyRate0).mul(token0PerShareUsd).div(sharesCombinedUsd).toString() : 0;

  const rate1PerShare = incentiveSupplyRate1 ? new Dec(incentiveSupplyRate1).mul(token1PerShareUsd).div(sharesCombinedUsd).toString() : 0;

  return new Dec(rate0PerShare).plus(rate1PerShare).toString();
};

const getTradingApy = async (poolAddress: EthAddress) => {
  let res;
  try {
    res = await fetch(`https://api.fluid.instadapp.io/v2/1/dexes/${poolAddress}/apy`, { signal: AbortSignal.timeout(2000) });
  } catch (e) {
    return '0';
  }
  if (!res.ok) {
    return '0';
  }
  const data = await res.json();
  return new Dec(data.tradingApy).div(100).toString();
};

const parseT1MarketData = async (web3: Web3, data: FluidView.VaultDataStructOutputStruct, network: NetworkNumber, mainnetWeb3: Web3) => {
  const collAsset = getAssetInfoByAddress(data.supplyToken0, network);
  const debtAsset = getAssetInfoByAddress(data.borrowToken0, network);

  const supplyRate = new Dec(data.supplyRateVault).div(100).toString();
  const borrowRate = new Dec(data.borrowRateVault).div(100).toString();

  const oracleScaleFactor = new Dec(27).add(debtAsset.decimals).sub(collAsset.decimals).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();
  const oraclePrice = new Dec(data.oraclePriceOperate).div(oracleScale).toString();
  const debtPriceParsed = await getTokenPriceFromChainlink(debtAsset, network, web3);

  const collAssetData: FluidAssetData = {
    symbol: collAsset.symbol,
    address: collAsset.address,
    price: new Dec(debtPriceParsed).mul(oraclePrice).toString(),
    totalSupply: data.totalSupplyVault,
    totalBorrow: data.totalBorrowVault,
    canBeSupplied: true,
    canBeBorrowed: false,
    supplyRate,
    borrowRate: '0',
  };

  if (STAKING_ASSETS.includes(collAsset.symbol)) {
    collAssetData.incentiveSupplyApy = await getStakingApy(collAsset.symbol, mainnetWeb3);
    collAssetData.incentiveSupplyToken = collAsset.symbol;
  }

  const incentiveSupplyRate = collAssetData.incentiveSupplyApy;

  const debtAssetData: FluidAssetData = {
    symbol: debtAsset.symbol,
    address: debtAsset.address,
    price: debtPriceParsed,
    totalSupply: data.totalSupplyVault,
    totalBorrow: data.totalBorrowVault,
    canBeSupplied: false,
    canBeBorrowed: true,
    supplyRate: '0',
    borrowRate,
  };
  if (STAKING_ASSETS.includes(debtAssetData.symbol)) {
    debtAssetData.incentiveBorrowApy = await getStakingApy(debtAsset.symbol, mainnetWeb3);
    debtAssetData.incentiveBorrowToken = debtAsset.symbol;
  }

  const incentiveBorrowRate = debtAssetData.incentiveBorrowApy;

  const assetsData = {
    [collAsset.symbol]: collAssetData,
    [debtAsset.symbol]: debtAssetData,
  };
  const marketInfo = getFluidMarketInfoById(+data.vaultId, network);
  const totalSupplyVault = getEthAmountForDecimals(data.totalSupplyVault, collAsset.decimals);
  const totalBorrowVault = getEthAmountForDecimals(data.totalBorrowVault, debtAsset.decimals);

  const liqRatio = new Dec(data.liquidationThreshold).div(100).toString();
  const liquidationMaxLimit = new Dec(data.liquidationMaxLimit).div(100).toString();
  const liqFactor = new Dec(data.liquidationThreshold).div(10_000).toString();

  const marketData = {
    vaultId: +data.vaultId,
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+data.vaultType),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: liqRatio,
    liqFactor,
    minRatio: new Dec(1).div(liqFactor).mul(100).toString(),
    collAsset0: collAsset.symbol,
    debtAsset0: debtAsset.symbol,
    totalPositions: data.totalPositions,
    totalSupplyVault,
    totalBorrowVault,
    totalSupplyVaultUsd: new Dec(totalSupplyVault).mul(collAssetData.price).toString(),
    totalBorrowVaultUsd: new Dec(totalBorrowVault).mul(debtAssetData.price).toString(),
    withdrawalLimit: getEthAmountForDecimals(data.withdrawalLimit, collAsset.decimals),
    withdrawableUntilLimit: getEthAmountForDecimals(data.withdrawableUntilLimit, collAsset.decimals),
    withdrawable: getEthAmountForDecimals(data.withdrawable, collAsset.decimals),
    borrowLimit: getEthAmountForDecimals(data.borrowLimit, debtAsset.decimals),
    borrowableUntilLimit: getEthAmountForDecimals(data.borrowableUntilLimit, debtAsset.decimals),
    borrowable: getEthAmountForDecimals(data.borrowable, debtAsset.decimals),
    borrowLimitUtilization: getEthAmountForDecimals(data.borrowLimitUtilization, debtAsset.decimals),
    maxBorrowLimit: getEthAmountForDecimals(data.maxBorrowLimit, debtAsset.decimals),
    baseBorrowLimit: getEthAmountForDecimals(data.baseBorrowLimit, debtAsset.decimals),
    minimumBorrowing: getEthAmountForDecimals(data.minimumBorrowing, debtAsset.decimals),
    liquidationMaxLimit,
    borrowRate,
    supplyRate,
    incentiveSupplyRate,
    incentiveBorrowRate,
    oraclePrice,
  };

  return {
    assetsData,
    marketData,
  } as FluidMarketData;
};

const parseT2MarketData = async (web3: Web3, data: FluidView.VaultDataStructOutputStruct, network: NetworkNumber, mainnetWeb3: Web3) => {
  const collAsset0 = getAssetInfoByAddress(data.supplyToken0, network);
  const collAsset1 = getAssetInfoByAddress(data.supplyToken1, network);
  const debtAsset = getAssetInfoByAddress(data.borrowToken0, network);

  // 18 because collateral is represented in shares for which they use 18 decimals
  const oracleScaleFactor = new Dec(27).add(debtAsset.decimals).sub(18).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();
  const oraclePrice = new Dec(data.oraclePriceOperate).div(oracleScale).toString();

  const prices = await getChainLinkPricesForTokens([collAsset0.address, collAsset1.address, debtAsset.address], network, web3);

  const {
    supplyDexFee,
    totalSupplyShares,
    supplyRate1,
    totalSupplyToken1,
    token0PerSupplyShare,
    token1PerSupplyShare,
    totalSupplyToken0,
    maxSupplyShares,
    withdrawableToken0,
    withdrawable0,
    withdrawableToken1,
    withdrawable1,
    supplyRate0,
    utilizationSupply0,
    utilizationSupply1,
    withdrawableShares,
    reservesSupplyToken0,
    reservesSupplyToken1,
  } = parseDexSupplyData(data.dexSupplyData, collAsset0.symbol, collAsset1.symbol);

  const collFirstAssetData: Partial<FluidAssetData> = {
    symbol: collAsset0.symbol,
    address: collAsset0.address,
    price: prices[collAsset0.address],
    totalSupply: new Dec(totalSupplyShares).mul(token0PerSupplyShare).toString(),
    canBeSupplied: true,
    supplyRate: supplyRate0,
    utilization: utilizationSupply0,
    withdrawable: withdrawable0,
    tokenPerSupplyShare: token0PerSupplyShare,
    supplyReserves: reservesSupplyToken0,
  };
  if (STAKING_ASSETS.includes(collFirstAssetData.symbol!)) {
    collFirstAssetData.incentiveSupplyApy = await getStakingApy(collAsset0.symbol, mainnetWeb3);
    collFirstAssetData.incentiveSupplyToken = collAsset0.symbol;
  }

  const collSecondAssetData: Partial<FluidAssetData> = {
    symbol: collAsset1.symbol,
    address: collAsset1.address,
    price: prices[collAsset1.address],
    totalSupply: new Dec(totalSupplyShares).mul(token1PerSupplyShare).toString(),
    canBeSupplied: true,
    supplyRate: supplyRate1,
    withdrawable: withdrawable1,
    utilization: utilizationSupply1,
    tokenPerSupplyShare: token1PerSupplyShare,
    supplyReserves: reservesSupplyToken1,
  };
  if (STAKING_ASSETS.includes(collSecondAssetData.symbol!)) {
    collSecondAssetData.incentiveSupplyApy = await getStakingApy(collAsset1.symbol, mainnetWeb3);
    collSecondAssetData.incentiveSupplyToken = collAsset1.symbol;
  }

  const marketSupplyRate = getMarketRateForDex(token1PerSupplyShare, token0PerSupplyShare, supplyRate0, supplyRate1, collFirstAssetData.price!, collSecondAssetData.price!);
  const incentiveSupplyRate = getAdditionalMarketRateForDex(token1PerSupplyShare, token0PerSupplyShare, collFirstAssetData.incentiveSupplyApy!, collSecondAssetData.incentiveSupplyApy!, collFirstAssetData.price!, collSecondAssetData.price!);
  const tradingSupplyRate = await getTradingApy(data.dexSupplyData.dexPool);

  const borrowRate = new Dec(data.borrowRateVault).div(100).toString();
  const debtAssetData: Partial<FluidAssetData> = {
    symbol: debtAsset.symbol,
    price: prices[debtAsset.address],
    address: debtAsset.address,
    totalBorrow: data.totalBorrowVault,
    canBeBorrowed: true,
    borrowRate,
  };
  if (STAKING_ASSETS.includes(debtAssetData.symbol!)) {
    debtAssetData.incentiveBorrowApy = await getStakingApy(debtAsset.symbol, mainnetWeb3);
    debtAssetData.incentiveBorrowToken = debtAsset.symbol;
  }

  const incentiveBorrowRate = debtAssetData.incentiveBorrowApy;

  const assetsData: FluidAssetsData = ([
    [collAsset0.symbol, collFirstAssetData],
    [collAsset1.symbol, collSecondAssetData],
    [debtAsset.symbol, debtAssetData],
  ] as [string, FluidAssetData][])
    .reduce((acc, [symbol, partialData]) => ({
      ...acc,
      [symbol]: mergeAssetData(acc[symbol], partialData),
    }), {} as Record<string, FluidAssetData>) as FluidAssetsData;

  const marketInfo = getFluidMarketInfoById(+data.vaultId, network);

  const totalBorrowVault = getEthAmountForDecimals(data.totalBorrowVault, debtAsset.decimals);

  const liqRatio = new Dec(data.liquidationThreshold).div(100).toString();
  const liquidationMaxLimit = new Dec(data.liquidationMaxLimit).div(100).toString();
  const liqFactor = new Dec(data.liquidationThreshold).div(10_000).toString();

  const totalSupplySharesInVault = assetAmountInEth(data.totalSupplyVault);
  const collSharePrice = new Dec(oraclePrice).mul(prices[debtAsset.address]).toString();
  const totalSupplyVaultUsd = new Dec(totalSupplySharesInVault).mul(collSharePrice).toString();
  const maxSupplySharesUsd = new Dec(maxSupplyShares).mul(collSharePrice).toString();

  const withdrawableUSD = new Dec(withdrawableShares).mul(collSharePrice).toString();

  const marketData = {
    vaultId: +data.vaultId,
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+data.vaultType),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: liqRatio,
    liqFactor,
    minRatio: new Dec(1).div(liqFactor).mul(100).toString(),
    collAsset0: collAsset0.symbol,
    collAsset1: collAsset1.symbol,
    debtAsset0: debtAsset.symbol,
    totalPositions: data.totalPositions,
    totalSupplyVault: totalSupplyShares,
    totalBorrowVault,
    totalSupplyVaultUsd,
    collSharePrice,
    totalBorrowVaultUsd: new Dec(totalBorrowVault).mul(assetsData[debtAsset.symbol].price).toString(),
    borrowLimit: getEthAmountForDecimals(data.borrowLimit, debtAsset.decimals),
    borrowableUntilLimit: getEthAmountForDecimals(data.borrowableUntilLimit, debtAsset.decimals),
    borrowable: getEthAmountForDecimals(data.borrowable, debtAsset.decimals),
    borrowLimitUtilization: getEthAmountForDecimals(data.borrowLimitUtilization, debtAsset.decimals),
    maxBorrowLimit: getEthAmountForDecimals(data.maxBorrowLimit, debtAsset.decimals),
    baseBorrowLimit: getEthAmountForDecimals(data.baseBorrowLimit, debtAsset.decimals),
    minimumBorrowing: getEthAmountForDecimals(data.minimumBorrowing, debtAsset.decimals),
    liquidationMaxLimit,
    borrowRate,
    supplyRate: marketSupplyRate,
    incentiveSupplyRate,
    incentiveBorrowRate,
    totalSupplyToken0,
    totalSupplyToken1,
    withdrawableToken0,
    withdrawableToken1,
    withdrawableUSD,
    withdrawable: withdrawableShares,
    withdrawableDex: new Dec(maxSupplyShares).minus(totalSupplyShares).toString(),
    maxSupplyShares,
    maxSupplySharesUsd,
    collDexFee: supplyDexFee,
    oraclePrice,
    tradingSupplyRate,
    tradingBorrowRate: '0',
  };

  return {
    assetsData,
    marketData,
  } as FluidMarketData;
};

const parseT3MarketData = async (web3: Web3, data: FluidView.VaultDataStructOutputStruct, network: NetworkNumber, mainnetWeb3: Web3) => {
  const collAsset = getAssetInfoByAddress(data.supplyToken0, network);
  const debtAsset0 = getAssetInfoByAddress(data.borrowToken0, network);
  const debtAsset1 = getAssetInfoByAddress(data.borrowToken1, network);

  const {
    borrowableShares,
    maxBorrowShares,
    borrowDexFee,
    utilizationBorrow0,
    utilizationBorrow1,
    borrowable0,
    borrowable1,
    borrowRate0,
    borrowRate1,
    totalBorrowShares,
    token0PerBorrowShare,
    token1PerBorrowShare,
    borrowableToken0,
    borrowableToken1,
    totalBorrowToken0,
    totalBorrowToken1,
    reservesBorrowToken0,
    reservesBorrowToken1,
  } = parseDexBorrowData(data.dexBorrowData, debtAsset0.symbol, debtAsset1.symbol);

  // 18 because debt is represented in shares for which they use 18 decimals
  const oracleScaleFactor = new Dec(27).add(18).sub(collAsset.decimals).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();
  const oraclePrice = new Dec(1).div(new Dec(data.oraclePriceOperate).div(oracleScale)).toString();

  const prices = await getChainLinkPricesForTokens([collAsset.address, debtAsset0.address, debtAsset1.address], network, web3);

  const supplyRate = new Dec(data.supplyRateVault).div(100).toString();
  const collAssetData: Partial<FluidAssetData> = {
    symbol: collAsset.symbol,
    address: collAsset.address,
    price: prices[collAsset.address],
    totalSupply: data.totalSupplyVault,
    canBeSupplied: true,
    supplyRate,
  };
  if (STAKING_ASSETS.includes(collAssetData.symbol!)) {
    collAssetData.incentiveSupplyApy = await getStakingApy(collAsset.symbol, mainnetWeb3);
    collAssetData.incentiveSupplyToken = collAsset.symbol;
  }

  const incentiveSupplyRate = collAssetData.incentiveSupplyApy;

  const debtAsset0Data: Partial<FluidAssetData> = {
    symbol: debtAsset0.symbol,
    address: debtAsset0.address,
    price: prices[debtAsset0.address],
    totalBorrow: new Dec(totalBorrowShares).mul(token0PerBorrowShare).toString(),
    canBeBorrowed: true,
    borrowRate: borrowRate0,
    borrowable: borrowable0,
    utilization: utilizationBorrow0,
    tokenPerBorrowShare: token0PerBorrowShare,
    borrowReserves: reservesBorrowToken0,
  };
  if (STAKING_ASSETS.includes(debtAsset0Data.symbol!)) {
    debtAsset0Data.incentiveSupplyApy = await getStakingApy(debtAsset0.symbol, mainnetWeb3);
    debtAsset0Data.incentiveSupplyToken = debtAsset0.symbol;
  }

  const debtAsset1Data: Partial<FluidAssetData> = {
    symbol: debtAsset1.symbol,
    address: debtAsset1.address,
    price: prices[debtAsset1.address],
    totalBorrow: new Dec(totalBorrowShares).mul(token1PerBorrowShare).toString(),
    canBeBorrowed: true,
    borrowRate: borrowRate1,
    borrowable: borrowable1,
    utilization: utilizationBorrow1,
    tokenPerBorrowShare: token1PerBorrowShare,
    borrowReserves: reservesBorrowToken1,
  };
  if (STAKING_ASSETS.includes(debtAsset1Data.symbol!)) {
    debtAsset1Data.incentiveSupplyApy = await getStakingApy(debtAsset1.symbol, mainnetWeb3);
    debtAsset1Data.incentiveSupplyToken = debtAsset1.symbol;
  }
  const marketBorrowRate = getMarketRateForDex(token1PerBorrowShare, token0PerBorrowShare, borrowRate0, borrowRate1, debtAsset0Data.price!, debtAsset1Data.price!);
  const incentiveBorrowRate = getAdditionalMarketRateForDex(token1PerBorrowShare, token0PerBorrowShare, debtAsset0Data.incentiveSupplyApy!, debtAsset1Data.incentiveSupplyApy!, debtAsset0Data.price!, debtAsset1Data.price!);
  const tradingBorrowRate = await getTradingApy(data.dexBorrowData.dexPool);

  const assetsData: FluidAssetsData = ([
    [collAsset.symbol, collAssetData],
    [debtAsset0.symbol, debtAsset0Data],
    [debtAsset1.symbol, debtAsset1Data],
  ] as [string, FluidAssetData][])
    .reduce((acc, [symbol, partialData]) => ({
      ...acc,
      [symbol]: mergeAssetData(acc[symbol], partialData),
    }), {} as Record<string, FluidAssetData>) as FluidAssetsData;

  const marketInfo = getFluidMarketInfoById(+data.vaultId, network);

  const totalSupplyVault = getEthAmountForDecimals(data.totalSupplyVault, collAsset.decimals);

  const liqRatio = new Dec(data.liquidationThreshold).div(100).toString();
  const liquidationMaxLimit = new Dec(data.liquidationMaxLimit).div(100).toString();
  const liqFactor = new Dec(data.liquidationThreshold).div(10_000).toString();

  const debtSharePrice = new Dec(oraclePrice).mul(prices[collAsset.address]).toString();

  const totalBorrowSharesInVault = assetAmountInEth(data.totalBorrowVault);

  const totalBorrowVaultUsd = new Dec(totalBorrowSharesInVault).mul(debtSharePrice).toString();

  const borrowableUSD = new Dec(borrowableShares).mul(debtSharePrice).toString();
  const maxBorrowSharesUsd = new Dec(maxBorrowShares).mul(debtSharePrice).toString();

  const marketData = {
    vaultId: +data.vaultId,
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+data.vaultType),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: liqRatio,
    liqFactor,
    minRatio: new Dec(1).div(liqFactor).mul(100).toString(),
    collAsset0: collAsset.symbol,
    debtAsset0: debtAsset0.symbol,
    debtAsset1: debtAsset1.symbol,
    totalPositions: data.totalPositions,
    totalSupplyVault,
    totalBorrowVault: totalBorrowShares,
    totalSupplyVaultUsd: new Dec(totalSupplyVault).mul(assetsData[collAsset.symbol].price).toString(),
    totalBorrowVaultUsd,
    withdrawalLimit: getEthAmountForDecimals(data.withdrawalLimit, collAsset.decimals),
    withdrawableUntilLimit: getEthAmountForDecimals(data.withdrawableUntilLimit, collAsset.decimals),
    withdrawable: getEthAmountForDecimals(data.withdrawable, collAsset.decimals),
    liquidationMaxLimit,
    borrowRate: marketBorrowRate,
    supplyRate,
    incentiveBorrowRate,
    incentiveSupplyRate,
    tradingBorrowRate,
    tradingSupplyRate: '0',
    borrowableToken0,
    borrowableToken1,
    totalBorrowToken0,
    totalBorrowToken1,
    borrowableUSD,
    borrowable: borrowableShares,
    borrowableDex: new Dec(maxBorrowShares).minus(totalBorrowShares).toString(),
    maxBorrowShares,
    maxBorrowSharesUsd,
    borrowDexFee,
    debtSharePrice,
    oraclePrice,
  };

  return {
    assetsData,
    marketData,
  } as FluidMarketData;
};

const parseT4MarketData = async (web3: Web3, data: FluidView.VaultDataStructOutputStruct, network: NetworkNumber, mainnetWeb3: Web3) => {
  const collAsset0 = getAssetInfoByAddress(data.supplyToken0, network);
  const collAsset1 = getAssetInfoByAddress(data.supplyToken1, network);
  const debtAsset0 = getAssetInfoByAddress(data.borrowToken0, network);
  const debtAsset1 = getAssetInfoByAddress(data.borrowToken1, network);
  const quoteToken = getAssetInfoByAddress(data.dexBorrowData.quoteToken, network);

  // 27 - 18 + 18
  const oracleScaleFactor = new Dec(27).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();
  const oraclePrice = new Dec(data.oraclePriceOperate).div(oracleScale).toString();

  const prices = await getChainLinkPricesForTokens(
    [collAsset0.address, collAsset1.address, debtAsset0.address, debtAsset1.address],
    network, web3);

  const {
    supplyDexFee,
    totalSupplyShares,
    supplyRate1,
    token0PerSupplyShare,
    token1PerSupplyShare,
    totalSupplyToken0,
    totalSupplyToken1,
    maxSupplyShares,
    withdrawableToken0,
    withdrawable0,
    withdrawableToken1,
    withdrawable1,
    supplyRate0,
    utilizationSupply0,
    utilizationSupply1,
    withdrawableShares,
    reservesSupplyToken0,
    reservesSupplyToken1,
  } = parseDexSupplyData(data.dexSupplyData, collAsset0.symbol, collAsset1.symbol);

  const {
    borrowableShares,
    maxBorrowShares,
    borrowDexFee,
    utilizationBorrow0,
    utilizationBorrow1,
    borrowable0,
    borrowable1,
    borrowRate0,
    borrowRate1,
    totalBorrowShares,
    token0PerBorrowShare,
    token1PerBorrowShare,
    borrowableToken0,
    borrowableToken1,
    totalBorrowToken0,
    totalBorrowToken1,
    quoteTokensPerShare,
    reservesBorrowToken0,
    reservesBorrowToken1,
  } = parseDexBorrowData(data.dexBorrowData, debtAsset0.symbol, debtAsset1.symbol);

  const collAsset0Data: Partial<FluidAssetData> = {
    symbol: collAsset0.symbol,
    address: collAsset0.address,
    price: prices[collAsset0.address],
    totalSupply: new Dec(totalSupplyShares).mul(token0PerSupplyShare).toString(),
    canBeSupplied: true,
    supplyRate: supplyRate0,
    utilization: utilizationSupply0,
    withdrawable: withdrawable0,
    tokenPerSupplyShare: token0PerSupplyShare,
    supplyReserves: reservesSupplyToken0,
  };
  if (STAKING_ASSETS.includes(collAsset0Data.symbol!)) {
    collAsset0Data.incentiveSupplyApy = await getStakingApy(collAsset0.symbol, mainnetWeb3);
    collAsset0Data.incentiveSupplyToken = collAsset0.symbol;
  }

  const collAsset1Data: Partial<FluidAssetData> = {
    symbol: collAsset1.symbol,
    address: collAsset1.address,
    price: prices[collAsset1.address],
    totalSupply: new Dec(totalSupplyShares).mul(token1PerSupplyShare).toString(),
    canBeSupplied: true,
    supplyRate: supplyRate1,
    withdrawable: withdrawable1,
    utilization: utilizationSupply1,
    tokenPerSupplyShare: token1PerSupplyShare,
    supplyReserves: reservesSupplyToken1,
  };
  if (STAKING_ASSETS.includes(collAsset1Data.symbol!)) {
    collAsset1Data.incentiveSupplyApy = await getStakingApy(collAsset1.symbol, mainnetWeb3);
    collAsset1Data.incentiveSupplyToken = collAsset1.symbol;
  }

  const debtAsset0Data: Partial<FluidAssetData> = {
    symbol: debtAsset0.symbol,
    address: debtAsset0.address,
    price: prices[debtAsset0.address],
    totalBorrow: new Dec(totalBorrowShares).mul(token0PerBorrowShare).toString(),
    canBeBorrowed: true,
    borrowRate: borrowRate0,
    borrowable: borrowable0,
    utilization: utilizationBorrow0,
    tokenPerBorrowShare: token0PerBorrowShare,
    borrowReserves: reservesBorrowToken0,
  };
  if (STAKING_ASSETS.includes(debtAsset0Data.symbol!)) {
    debtAsset0Data.incentiveSupplyApy = await getStakingApy(debtAsset0.symbol, mainnetWeb3);
    debtAsset0Data.incentiveSupplyToken = debtAsset0.symbol;
  }

  const debtAsset1Data: Partial<FluidAssetData> = {
    symbol: debtAsset1.symbol,
    address: debtAsset1.address,
    price: prices[debtAsset1.address],
    totalBorrow: new Dec(totalBorrowShares).mul(token1PerBorrowShare).toString(),
    canBeBorrowed: true,
    borrowRate: borrowRate1,
    borrowable: borrowable1,
    utilization: utilizationBorrow1,
    tokenPerBorrowShare: token1PerBorrowShare,
    borrowReserves: reservesBorrowToken1,
  };
  if (STAKING_ASSETS.includes(debtAsset1Data.symbol!)) {
    debtAsset1Data.incentiveSupplyApy = await getStakingApy(debtAsset1.symbol, mainnetWeb3);
    debtAsset1Data.incentiveSupplyToken = debtAsset1.symbol;
  }
  const marketInfo = getFluidMarketInfoById(+data.vaultId, network);

  const marketBorrowRate = getMarketRateForDex(token1PerBorrowShare, token0PerBorrowShare, borrowRate0, borrowRate1, debtAsset0Data.price!, debtAsset1Data.price!);
  const incentiveBorrowRate = getAdditionalMarketRateForDex(token1PerBorrowShare, token0PerBorrowShare, debtAsset0Data.incentiveSupplyApy!, debtAsset1Data.incentiveSupplyApy!, debtAsset0Data.price!, debtAsset1Data.price!);
  const tradingBorrowRate = await getTradingApy(data.dexBorrowData.dexPool);

  const marketSupplyRate = getMarketRateForDex(token1PerSupplyShare, token0PerSupplyShare, supplyRate0, supplyRate1, collAsset0Data.price!, collAsset1Data.price!);
  const incentiveSupplyRate = getAdditionalMarketRateForDex(token1PerSupplyShare, token0PerSupplyShare, collAsset0Data.incentiveSupplyApy!, collAsset1Data.incentiveSupplyApy!, collAsset0Data.price!, collAsset1Data.price!);
  const tradingSupplyRate = await getTradingApy(data.dexSupplyData.dexPool);

  const assetsData: FluidAssetsData = ([
    [collAsset0.symbol, collAsset0Data],
    [collAsset1.symbol, collAsset1Data],
    [debtAsset0.symbol, debtAsset0Data],
    [debtAsset1.symbol, debtAsset1Data],
  ] as [string, FluidAssetData][])
    .reduce((acc, [symbol, partialData]) => ({
      ...acc,
      [symbol]: mergeAssetData(acc[symbol], partialData),
    }), {} as Record<string, FluidAssetData>) as FluidAssetsData;


  const liqRatio = new Dec(data.liquidationThreshold).div(100).toString();
  const liquidationMaxLimit = new Dec(data.liquidationMaxLimit).div(100).toString();
  const liqFactor = new Dec(data.liquidationThreshold).div(10_000).toString();

  const totalBorrowSharesInVault = assetAmountInEth(data.totalBorrowVault);
  const debtSharePrice = new Dec(quoteTokensPerShare).mul(prices[quoteToken.address]).toString();
  const totalBorrowVaultUsd = new Dec(totalBorrowSharesInVault).mul(debtSharePrice).toString();
  const maxBorrowSharesUsd = new Dec(maxBorrowShares).mul(debtSharePrice).toString();
  const borrowableUSD = new Dec(borrowableShares).mul(debtSharePrice).toString();

  const totalSupplySharesInVault = assetAmountInEth(data.totalSupplyVault);
  const collSharePrice = new Dec(oraclePrice).mul(debtSharePrice).toString();
  const totalSupplyVaultUsd = new Dec(totalSupplySharesInVault).mul(collSharePrice).toString();
  const maxSupplySharesUsd = new Dec(maxSupplyShares).mul(collSharePrice).toString();
  const withdrawableUSD = new Dec(withdrawableShares).mul(collSharePrice).toString();

  const marketData = {
    vaultId: +data.vaultId,
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+data.vaultType),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: liqRatio,
    liqFactor,
    minRatio: new Dec(1).div(liqFactor).mul(100).toString(),
    collAsset0: collAsset0.symbol,
    collAsset1: collAsset1.symbol,
    debtAsset0: debtAsset0.symbol,
    debtAsset1: debtAsset1.symbol,
    totalPositions: data.totalPositions,
    totalSupplyVault: totalSupplyShares,
    totalBorrowVault: totalBorrowShares,
    totalSupplyVaultUsd,
    totalBorrowVaultUsd,
    liquidationMaxLimit,
    borrowRate: marketBorrowRate,
    incentiveBorrowRate,
    supplyRate: marketSupplyRate,
    incentiveSupplyRate,
    borrowableToken0,
    borrowableToken1,
    totalBorrowToken0,
    totalBorrowToken1,
    borrowableUSD,
    borrowable: borrowableShares,
    borrowableDex: new Dec(maxBorrowShares).minus(totalBorrowShares).toString(),
    maxBorrowShares,
    maxBorrowSharesUsd,
    borrowDexFee,
    totalSupplyToken0,
    totalSupplyToken1,
    withdrawableToken0,
    withdrawableToken1,
    withdrawableUSD,
    withdrawable: withdrawableShares,
    withdrawableDex: new Dec(maxSupplyShares).minus(totalSupplyShares).toString(),
    maxSupplyShares,
    maxSupplySharesUsd,
    collDexFee: supplyDexFee,
    collSharePrice,
    debtSharePrice,
    oraclePrice,
    tradingBorrowRate,
    tradingSupplyRate,
  };

  return {
    assetsData,
    marketData,
  } as FluidMarketData;
};

const parseMarketData = async (web3: Web3, data: FluidView.VaultDataStructOutputStruct, network: NetworkNumber, mainnetWeb3: Web3) => {
  const vaultType = parseVaultType(+data.vaultType);
  switch (vaultType) {
    case FluidVaultType.T1:
      return parseT1MarketData(web3, data, network, mainnetWeb3);
    case FluidVaultType.T2:
      return parseT2MarketData(web3, data, network, mainnetWeb3);
    case FluidVaultType.T3:
      return parseT3MarketData(web3, data, network, mainnetWeb3);
    case FluidVaultType.T4:
      return parseT4MarketData(web3, data, network, mainnetWeb3);
    default:
      throw new Error(`Unknown vault type: ${vaultType}`);
  }
};

export const EMPTY_FLUID_DATA = {
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
  lastUpdated: Date.now(),
};

const parseT1UserData = (userPositionData: FluidView.UserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
  const {
    assetsData,
    marketData,
  } = vaultData;

  const payload = {
    owner: userPositionData.owner,
    vaultId: marketData.vaultId,
    ...EMPTY_FLUID_DATA,
    lastUpdated: Date.now(),
  };
  const collAsset = getAssetInfo(marketData.collAsset0);
  const debtAsset = getAssetInfo(marketData.debtAsset0);

  // for T2 and T4 - this is the number of shares
  const supplied = getEthAmountForDecimals(userPositionData.supply, collAsset.decimals);
  const borrowed = getEthAmountForDecimals(userPositionData.borrow, debtAsset.decimals);

  const collUsedAsset: FluidUsedAsset = {
    ...EMPTY_USED_ASSET,
    symbol: collAsset.symbol,
    collateral: true,
    supplied,
    suppliedUsd: new Dec(supplied).mul(assetsData[collAsset.symbol].price).toString(),
    isSupplied: new Dec(supplied).gt(0),
  };

  const debtUsedAsset: FluidUsedAsset = {
    ...EMPTY_USED_ASSET,
    symbol: debtAsset.symbol,
    collateral: false,
    borrowed,
    borrowedUsd: new Dec(borrowed).mul(assetsData[debtAsset.symbol].price).toString(),
    isBorrowed: new Dec(borrowed).gt(0),
  };

  const usedAssets: FluidUsedAssets = {
    [collAsset.symbol]: collUsedAsset,
    [debtAsset.symbol]: debtUsedAsset,
  };

  return {
    ...payload,
    usedAssets,
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }) as FluidAggregatedVaultData),
  };
};

const parseT2UserData = (userPositionData: FluidView.UserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
  const {
    assetsData,
    marketData,
  } = vaultData;

  const payload = {
    owner: userPositionData.owner,
    vaultId: marketData.vaultId,
    ...EMPTY_FLUID_DATA,
    lastUpdated: Date.now(),
  };

  const collAsset0 = getAssetInfo(marketData.collAsset0);
  const collAsset1 = getAssetInfo(marketData.collAsset1);
  const debtAsset = getAssetInfo(marketData.debtAsset0);

  const supplyShares = getEthAmountForDecimals(userPositionData.supply, 18); // this is supplied in coll shares
  const borrowed = getEthAmountForDecimals(userPositionData.borrow, debtAsset.decimals); // this is actual token borrow

  const supplied0 = new Dec(supplyShares).mul(assetsData[collAsset0.symbol].tokenPerSupplyShare!).toString();
  const supplied1 = new Dec(supplyShares).mul(assetsData[collAsset1.symbol].tokenPerSupplyShare!).toString();

  const collUsedAsset0: Partial<FluidUsedAsset> = {
    symbol: collAsset0.symbol,
    collateral: true,
    supplied: supplied0,
    suppliedUsd: new Dec(supplied0).mul(assetsData[collAsset0.symbol].price).toString(),
    isSupplied: new Dec(supplied0).gt(0),
  };

  const collUsedAsset1: Partial<FluidUsedAsset> = {
    symbol: collAsset1.symbol,
    collateral: true,
    supplied: supplied1,
    suppliedUsd: new Dec(supplied1).mul(assetsData[collAsset1.symbol].price).toString(),
    isSupplied: new Dec(supplied1).gt(0),
  };

  const debtUsedAsset: Partial<FluidUsedAsset> = {
    symbol: debtAsset.symbol,
    borrowed,
    borrowedUsd: new Dec(borrowed).mul(assetsData[debtAsset.symbol].price).toString(),
    isBorrowed: new Dec(borrowed).gt(0),
  };

  const usedAssets: FluidUsedAssets = ([
    [collAsset0.symbol, collUsedAsset0],
    [collAsset1.symbol, collUsedAsset1],
    [debtAsset.symbol, debtUsedAsset],
  ] as [string, FluidUsedAsset][])
    .reduce((acc, [symbol, partialData]) => {
      acc[symbol] = mergeUsedAssets(acc[symbol], partialData);
      return acc;
    }, {} as Record<string, FluidUsedAsset>) as FluidUsedAssets;

  return {
    ...payload,
    usedAssets,
    supplyShares,
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }, supplyShares) as FluidAggregatedVaultData),
  };
};

const parseT3UserData = (userPositionData: FluidView.UserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
  const {
    assetsData,
    marketData,
  } = vaultData;

  const payload = {
    owner: userPositionData.owner,
    vaultId: marketData.vaultId,
    ...EMPTY_FLUID_DATA,
    lastUpdated: Date.now(),
  };

  const collAsset = getAssetInfo(marketData.collAsset0);
  const debtAsset0 = getAssetInfo(marketData.debtAsset0);
  const debtAsset1 = getAssetInfo(marketData.debtAsset1);

  const supplied = getEthAmountForDecimals(userPositionData.supply, collAsset.decimals); // this is actual token supply
  const borrowShares = getEthAmountForDecimals(userPositionData.borrow, 18); // this is actual token borrow

  const borrowed0 = new Dec(borrowShares).mul(assetsData[debtAsset0.symbol].tokenPerBorrowShare!).toString();
  const borrowed1 = new Dec(borrowShares).mul(assetsData[debtAsset1.symbol].tokenPerBorrowShare!).toString();

  const collUsedAsset: Partial<FluidUsedAsset> = {
    symbol: collAsset.symbol,
    collateral: true,
    supplied,
    suppliedUsd: new Dec(supplied).mul(assetsData[collAsset.symbol].price).toString(),
    isSupplied: new Dec(supplied).gt(0),
  };

  const debtUsedAsset0: Partial<FluidUsedAsset> = {
    symbol: debtAsset0.symbol,
    borrowed: borrowed0,
    borrowedUsd: new Dec(borrowed0).mul(assetsData[debtAsset0.symbol].price).toString(),
    isBorrowed: new Dec(borrowed0).gt(0),
  };

  const debtUsedAsset1: Partial<FluidUsedAsset> = {
    symbol: debtAsset1.symbol,
    borrowed: borrowed1,
    borrowedUsd: new Dec(borrowed1).mul(assetsData[debtAsset1.symbol].price).toString(),
    isBorrowed: new Dec(borrowed1).gt(0),
  };

  const usedAssets: FluidUsedAssets = ([
    [collAsset.symbol, collUsedAsset],
    [debtAsset0.symbol, debtUsedAsset0],
    [debtAsset1.symbol, debtUsedAsset1],
  ] as [string, FluidUsedAsset][])
    .reduce((acc, [symbol, partialData]) => {
      acc[symbol] = mergeUsedAssets(acc[symbol], partialData);
      return acc;
    }, {} as Record<string, FluidUsedAsset>) as FluidUsedAssets;


  return {
    ...payload,
    usedAssets,
    borrowShares,
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }, '', borrowShares) as FluidAggregatedVaultData),
  };
};

const parseT4UserData = (userPositionData: FluidView.UserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
  const {
    assetsData,
    marketData,
  } = vaultData;

  const payload = {
    owner: userPositionData.owner,
    vaultId: marketData.vaultId,
    ...EMPTY_FLUID_DATA,
    lastUpdated: Date.now(),
  };

  const collAsset0 = getAssetInfo(marketData.collAsset0);
  const collAsset1 = getAssetInfo(marketData.collAsset1);
  const debtAsset0 = getAssetInfo(marketData.debtAsset0);
  const debtAsset1 = getAssetInfo(marketData.debtAsset1);

  const supplyShares = getEthAmountForDecimals(userPositionData.supply, 18); // this is actual token supply
  const borrowShares = getEthAmountForDecimals(userPositionData.borrow, 18); // this is actual token borrow

  const supplied0 = new Dec(supplyShares).mul(assetsData[collAsset0.symbol].tokenPerSupplyShare!).toString();
  const supplied1 = new Dec(supplyShares).mul(assetsData[collAsset1.symbol].tokenPerSupplyShare!).toString();

  const borrowed0 = new Dec(borrowShares).mul(assetsData[debtAsset0.symbol].tokenPerBorrowShare!).toString();
  const borrowed1 = new Dec(borrowShares).mul(assetsData[debtAsset1.symbol].tokenPerBorrowShare!).toString();

  const collUsedAsset0: Partial<FluidUsedAsset> = {
    symbol: collAsset0.symbol,
    collateral: true,
    supplied: supplied0,
    suppliedUsd: new Dec(supplied0).mul(assetsData[collAsset0.symbol].price).toString(),
    isSupplied: new Dec(supplied0).gt(0),
  };
  const collUsedAsset1: Partial<FluidUsedAsset> = {
    symbol: collAsset1.symbol,
    collateral: true,
    supplied: supplied1,
    suppliedUsd: new Dec(supplied1).mul(assetsData[collAsset1.symbol].price).toString(),
    isSupplied: new Dec(supplied1).gt(0),
  };

  const debtUsedAsset0: Partial<FluidUsedAsset> = {
    symbol: debtAsset0.symbol,
    borrowed: borrowed0,
    borrowedUsd: new Dec(borrowed0).mul(assetsData[debtAsset0.symbol].price).toString(),
    isBorrowed: new Dec(borrowed0).gt(0),
  };
  const debtUsedAsset1: Partial<FluidUsedAsset> = {
    symbol: debtAsset1.symbol,
    borrowed: borrowed1,
    borrowedUsd: new Dec(borrowed1).mul(assetsData[debtAsset1.symbol].price).toString(),
    isBorrowed: new Dec(borrowed1).gt(0),
  };

  const usedAssets: FluidUsedAssets = ([
    [collAsset0.symbol, collUsedAsset0],
    [collAsset1.symbol, collUsedAsset1],
    [debtAsset0.symbol, debtUsedAsset0],
    [debtAsset1.symbol, debtUsedAsset1],
  ] as [string, FluidUsedAsset][])
    .reduce((acc, [symbol, partialData]) => {
      acc[symbol] = mergeUsedAssets(acc[symbol], partialData);
      return acc;
    }, {} as Record<string, FluidUsedAsset>) as FluidUsedAssets;

  return {
    ...payload,
    usedAssets,
    supplyShares,
    borrowShares,
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }, supplyShares, borrowShares) as FluidAggregatedVaultData),
  };
};

const parseUserData = (userPositionData: FluidView.UserPositionStructOutputStruct, vaultData: FluidMarketData) => {
  const vaultType = vaultData.marketData.vaultType;
  switch (vaultType) {
    case FluidVaultType.T1:
      return parseT1UserData(userPositionData, vaultData);
    case FluidVaultType.T2:
      return parseT2UserData(userPositionData, vaultData);
    case FluidVaultType.T3:
      return parseT3UserData(userPositionData, vaultData);
    case FluidVaultType.T4:
      return parseT4UserData(userPositionData, vaultData);
    default:
      throw new Error(`Unknown vault type: ${vaultType}`);
  }
};

export const getFluidMarketData = async (web3: Web3, network: NetworkNumber, market: FluidMarketInfo, mainnetWeb3: Web3) => {
  const view = FluidViewContract(web3, network);

  const data = await view.methods.getVaultData(market.marketAddress).call();

  return parseMarketData(web3, data, network, mainnetWeb3);
};

export const getFluidVaultIdsForUser = async (web3: Web3,
  network:NetworkNumber,
  user: EthAddress): Promise<string[]> => {
  const view = FluidViewContract(web3, network);

  return view.methods.getUserNftIds(user).call();
};


export const getFluidPosition = async (
  web3: Web3,
  network: NetworkNumber,
  vaultId: string,
  extractedState: {
    assetsData: FluidAssetsData
    marketData: InnerFluidMarketData,
  },
): Promise<FluidVaultData> => {
  const view = FluidViewContract(web3, network);

  const data = await view.methods.getPositionByNftId(vaultId).call();

  const userPositionData = data[0];

  return parseUserData(userPositionData, extractedState);
};

export const getFluidPositionWithMarket = async (web3: Web3, network: NetworkNumber, vaultId: string, mainnetWeb3: Web3) => {
  const view = FluidViewContract(web3, network);
  const data = await view.methods.getPositionByNftId(vaultId).call();
  const marketData = await parseMarketData(web3, data.vault, network, mainnetWeb3);
  const userData = parseUserData(data.position, marketData);

  return {
    userData,
    marketData,
  };
};

export const getAllFluidMarketDataChunked = async (network: NetworkNumber, web3: Web3, mainnetWeb3: Web3) => {
  const versions = getFluidVersionsDataForNetwork(network);
  const view = FluidViewContract(web3, network);
  const calls = versions.map((version) => ({
    target: view.options.address,
    abiItem: view.options.jsonInterface.find((item) => item.name === 'getVaultData'),
    params: [version.marketAddress],
  }));

  const data = await chunkAndMulticall(calls, 10, 'latest', web3, network);
  // @ts-ignore
  return Promise.all(data.map(async (item, i) => parseMarketData(web3, item.vaultData, network, mainnetWeb3)));
};

export const getFluidTokenData = async (web3: Web3, network: NetworkNumber, token: string) => {
  const view = FluidViewContract(web3, network);
  const fTokenAddress = getFTokenAddress(token, network);
  const data = await view.methods.getFTokenData(fTokenAddress).call();
  const supplyRate = new Dec(data.supplyRate).div(100).toString();
  const rewardsRate = new Dec(data.rewardsRate).div(1e12).toString();
  const decimals = data.decimals;

  const depositRate = new Dec(getEthAmountForDecimals(data.convertToShares, decimals)).toString();
  const withdrawRate = new Dec(getEthAmountForDecimals(data.convertToAssets, decimals)).toString();

  return {
    fTokenAddress,
    fTokenSymbol: data.symbol,
    decimals,
    totalDeposited: getEthAmountForDecimals(data.totalAssets, decimals),
    withdrawable: getEthAmountForDecimals(data.withdrawable, decimals),
    apy: new Dec(supplyRate).add(rewardsRate).toString(),
    depositRate,
    withdrawRate,
  };
};

const parseFDepositTokenData = (fTokenData: FluidView.FTokenDataStructOutput, userPosition: FluidView.UserEarnPositionStructOutput, fTokenAddress?: string) => {
  const supplyRate = new Dec(fTokenData.supplyRate).div(100).toString();
  const rewardsRate = new Dec(fTokenData.rewardsRate).div(1e12).toString();
  const decimals = fTokenData.decimals;

  const depositRate = new Dec(getEthAmountForDecimals(fTokenData.convertToShares, decimals)).toString();
  const withdrawRate = new Dec(getEthAmountForDecimals(fTokenData.convertToAssets, decimals)).toString();

  return {
    fTokenAddress,
    fTokenSymbol: fTokenData.symbol,
    decimals,
    totalDeposited: getEthAmountForDecimals(fTokenData.totalAssets, decimals),
    withdrawable: getEthAmountForDecimals(fTokenData.withdrawable, decimals),
    apy: new Dec(supplyRate).add(rewardsRate).toString(),
    depositRate,
    withdrawRate,
    deposited: getEthAmountForDecimals(userPosition.underlyingAssets, decimals),
    depositedShares: getEthAmountForDecimals(userPosition.fTokenShares, decimals),
  };
};

export const getFluidDepositData = async (web3: Web3, network: NetworkNumber, token: string, address: EthAddress) => {
  const view = FluidViewContract(web3, network);
  const fTokenAddress = getFTokenAddress(token, network);
  const { fTokenData, userPosition } = await view.methods.getUserEarnPositionWithFToken(fTokenAddress, address).call();

  return parseFDepositTokenData(fTokenData, userPosition, fTokenAddress);
};

export const getAllUserEarnPositionsWithFTokens = async (web3: Web3, network: NetworkNumber, user: EthAddress, mainnetWeb3: Web3) => {
  const view = FluidViewContract(web3, network);
  const { fTokensData, userPositions } = await view.methods.getAllUserEarnPositionsWithFTokens(user).call();

  const parsedRes = fTokensData.reduce<ReturnType<typeof parseFDepositTokenData>[]>((acc, fTokenData, i) => {
    const userPosition = userPositions[i];
    const deposited = userPosition?.underlyingAssets;

    if (Number(deposited) > 0) {
      const fTokenAddress = getFTokenAddress(fTokenData.symbol, network);
      acc.push(parseFDepositTokenData(fTokenData, userPosition, fTokenAddress));
    }

    return acc;
  }, []);

  return parsedRes;
};

export const getUserPositions = async (web3: Web3, network: NetworkNumber, user: EthAddress, mainnetWeb3: Web3) => {
  const view = FluidViewContract(web3, network);

  const data = await view.methods.getUserPositions(user).call();

  const parsedMarketData = await Promise.all(data.vaults.map(async (vaultData) => parseMarketData(web3, vaultData, network, mainnetWeb3)));

  const userData = data.positions.map((position, i) => ({ ...parseUserData(position, parsedMarketData[i]), nftId: position.nftId }));

  return parsedMarketData.map((market, i) => ({
    marketData: market,
    userData: userData[i],
  }));
};