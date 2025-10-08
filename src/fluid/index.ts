import Dec from 'decimal.js';
import {
  assetAmountInEth,
  AssetData, getAssetInfo, getAssetInfoByAddress,
} from '@defisaver/tokens';
import { Client, PublicClient } from 'viem';
import {
  EthAddress, EthereumProvider, IncentiveKind, NetworkNumber,
} from '../types/common';
import {
  FluidAggregatedVaultData,
  FluidAssetData, FluidAssetsData,
  FluidFTokenDataStructOutput,
  FluidMarketData,
  FluidMarketInfo,
  FluidUsedAsset,
  FluidUsedAssets,
  FluidUserEarnPositionStructOutput,
  FluidUserPositionStructOutputStruct,
  FluidVaultData,
  FluidVaultDataStructOutputStruct,
  FluidVaultType, InnerFluidMarketData,
} from '../types';
import {
  BTCPriceFeedContractViem, DFSFeedRegistryContractViem, ETHPriceFeedContractViem, FeedRegistryContractViem, FluidViewContractViem,
} from '../contracts';
import {
  compareAddresses, DEFAULT_TIMEOUT, getEthAmountForDecimals, isMainnetNetwork,
} from '../services/utils';
import {
  getFluidAggregatedData,
  mergeAssetData,
  mergeUsedAssets,
  parseDexBorrowData,
  parseDexSupplyData,
} from '../helpers/fluidHelpers';
import { getFluidMarketInfoById, getFluidVersionsDataForNetwork, getFTokenAddress } from '../markets';
import { USD_QUOTE, ZERO_ADDRESS } from '../constants';
import {
  getChainlinkAssetAddress,
  getWeETHChainLinkPriceCalls,
  getWeETHPrice,
  getWstETHChainLinkPriceCalls,
  getWstETHPrice,
  getWstETHPriceFluid,
  parseWeETHPriceCalls,
  parseWstETHPriceCalls,
} from '../services/priceService';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { getViemProvider } from '../services/viem';

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
  client: PublicClient,
): Promise<{ [key: string]: string }> => {
  const isMainnet = isMainnetNetwork(network);

  const noDuplicateTokens = new Array(...new Set(tokens));

  const btcFeedContract = BTCPriceFeedContractViem(client, network);
  const ethFeedContract = ETHPriceFeedContractViem(client, network);

  const staticCalls = [
    {
      address: ethFeedContract.address,
      abi: ethFeedContract.abi,
      functionName: 'latestAnswer',
      args: [],
    },
    {
      address: btcFeedContract.address,
      abi: btcFeedContract.abi,
      functionName: 'latestAnswer',
      args: [],
    },
  ];

  // @ts-ignore
  const _calls = noDuplicateTokens.flatMap((address) => {
    const assetInfo = getAssetInfoByAddress(address, network);
    const isTokenUSDA = assetInfo.symbol === 'USDA';
    if (isTokenUSDA) return;
    const chainLinkFeedAddress = getChainlinkAssetAddress(assetInfo.symbol, network);

    if (assetInfo.symbol === 'wstETH') return getWstETHChainLinkPriceCalls(client, network);
    if (assetInfo.symbol === 'weETH') return getWeETHChainLinkPriceCalls(client, network);

    if (isMainnet) {
      const feedRegistryContract = FeedRegistryContractViem(client, NetworkNumber.Eth);
      return ({
        address: feedRegistryContract.address,
        abi: feedRegistryContract.abi,
        functionName: 'latestAnswer',
        args: [chainLinkFeedAddress, USD_QUOTE],
      });
    }

    const feedRegistryContract = DFSFeedRegistryContractViem(client, network);
    return ({
      address: feedRegistryContract.address,
      abi: feedRegistryContract.abi,
      functionName: 'latestRoundData',
      args: [chainLinkFeedAddress, USD_QUOTE],
    });
  });

  const calls = [...staticCalls, ..._calls].filter((call) => call);
  // @ts-ignore
  const results = await client.multicall({ contracts: calls });

  const ethPriceChainlink = new Dec(results[0].result as string).div(1e8).toString();
  const btcPriceChainlink = new Dec(results[1].result as string).div(1e8).toString();

  let offset = 2; // wstETH and weETH has 3 calls, while others have only 1, so we need to keep track. First 2 are static calls for eth and btc prices
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
        } = parseWstETHPriceCalls(
          results[i + offset].result!.toString(),
          // @ts-ignore
          results[i + offset + 1].result[1]!.toString(),
          results[i + offset + 2].result!.toString(),
        );
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
        } = parseWeETHPriceCalls(
          results[i + offset].result!.toString(),
          // @ts-ignore
          results[i + offset + 1].result[1]!.toString(),
          results[i + offset + 2].result!.toString(),
        );
        offset += 2;
        acc[token] = new Dec(ethPrice).mul(weETHRate).toString();
        break;
      }

      default:
        // @ts-ignore
        if (results[i + offset].result?.[1]) {
          // @ts-ignore
          acc[token] = new Dec(results[i + offset].result[1]!.toString() as string).div(1e8).toString();
        } else if (results[i + offset].result) {
          acc[token] = new Dec(results[i + offset].result!.toString() as string).div(1e8).toString();
        } else acc[token] = '0';
        break;
    }
    return acc;
  }, {} as { [key: string]: string });
};


const getTokenPriceFromChainlink = async (asset: AssetData, network: NetworkNumber, provider: PublicClient) => {
  if (asset.symbol === 'sUSDS') {
    return new Dec('105276929').div(1e8).toString();
  }
  const isTokenUSDA = asset.symbol === 'USDA';
  const isMainnet = isMainnetNetwork(network);
  const loanTokenFeedAddress = getChainlinkAssetAddress(asset.symbol, network);

  let loanTokenPrice;
  if (asset.symbol === 'wstETH') {
    // need to handle wstETH for l2s inside getWstETHPrice
    loanTokenPrice = await getWstETHPriceFluid(provider, network);
  } else if (isMainnet) {
    const feedRegistryContract = FeedRegistryContractViem(provider, NetworkNumber.Eth);
    loanTokenPrice = isTokenUSDA ? '100000000' : await feedRegistryContract.read.latestAnswer([loanTokenFeedAddress, USD_QUOTE]);
  } else {
    // Currently only base network is supported
    const feedRegistryContract = DFSFeedRegistryContractViem(provider, network);
    const roundPriceData = isTokenUSDA ? [0, '100000000'] : await feedRegistryContract.read.latestRoundData([loanTokenFeedAddress, USD_QUOTE]);
    loanTokenPrice = roundPriceData[1].toString();
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
    res = await fetch(`https://api.fluid.instadapp.io/v2/1/dexes/${poolAddress}/apy`,
      { signal: AbortSignal.timeout(DEFAULT_TIMEOUT) });
  } catch (e) {
    console.error('External API Failure: Fluid Trading Apy');
    return '0';
  }
  if (!res.ok) {
    return '0';
  }
  const data = await res.json();
  return new Dec(data.tradingApy).div(100).toString();
};

const parseT1MarketData = async (provider: PublicClient, data: FluidVaultDataStructOutputStruct, network: NetworkNumber, tokenPrices: Record<string, string> | null = null) => {
  const collAsset = getAssetInfoByAddress(data.supplyToken0, network);
  const debtAsset = getAssetInfoByAddress(data.borrowToken0, network);

  const supplyRate = new Dec(data.supplyRateVault).div(100).toString();
  const borrowRate = new Dec(data.borrowRateVault).div(100).toString();

  const oracleScaleFactor = new Dec(27).add(debtAsset.decimals).sub(collAsset.decimals).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();
  const oraclePrice = new Dec(data.oraclePriceOperate).div(oracleScale).toString();
  let debtPriceParsed = '0';
  if (tokenPrices) {
    debtPriceParsed = tokenPrices[debtAsset.symbol] || '0';
  } else {
    debtPriceParsed = await getTokenPriceFromChainlink(debtAsset, network, provider);
  }

  const collAssetData: FluidAssetData = {
    symbol: collAsset.symbol,
    address: collAsset.address,
    price: new Dec(debtPriceParsed).mul(oraclePrice).toString(),
    totalSupply: data.totalSupplyVault.toString(),
    totalBorrow: data.totalBorrowVault.toString(),
    canBeSupplied: true,
    canBeBorrowed: false,
    supplyRate,
    borrowRate: '0',
    supplyIncentives: [],
    borrowIncentives: [],
  };

  if (STAKING_ASSETS.includes(collAsset.symbol)) {
    collAssetData.supplyIncentives.push({
      apy: await getStakingApy(collAsset.symbol),
      token: collAssetData.symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${collAssetData.symbol} yield.`,
    });
  }

  const debtAssetData: FluidAssetData = {
    symbol: debtAsset.symbol,
    address: debtAsset.address,
    price: debtPriceParsed,
    totalSupply: data.totalSupplyVault.toString(),
    totalBorrow: data.totalBorrowVault.toString(),
    canBeSupplied: false,
    canBeBorrowed: true,
    supplyRate: '0',
    borrowRate,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(debtAssetData.symbol)) {
    debtAssetData.borrowIncentives.push({
      apy: new Dec(await getStakingApy(debtAsset.symbol)).mul(-1).toString(),
      token: debtAssetData.symbol,
      incentiveKind: IncentiveKind.Reward,
      description: `Due to the native yield of ${debtAssetData.symbol}, the value of the debt would increase over time.`,
    });
  }

  const assetsData = {
    [collAsset.symbol]: collAssetData,
    [debtAsset.symbol]: debtAssetData,
  };
  const marketInfo = getFluidMarketInfoById(+(data.vaultId.toString()), network);
  const totalSupplyVault = getEthAmountForDecimals(data.totalSupplyVault.toString(), collAsset.decimals);
  const totalBorrowVault = getEthAmountForDecimals(data.totalBorrowVault.toString(), debtAsset.decimals);

  const liqRatio = new Dec(data.liquidationThreshold).div(100).toString();
  const liquidationMaxLimit = new Dec(data.liquidationMaxLimit).div(100).toString();
  const liqFactor = new Dec(data.liquidationThreshold).div(10_000).toString();

  const marketData = {
    vaultId: +(data.vaultId.toString()),
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+(data.vaultType.toString())),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: liqRatio,
    liqFactor,
    minRatio: new Dec(1).div(liqFactor).mul(100).toString(),
    collAsset0: collAsset.symbol,
    debtAsset0: debtAsset.symbol,
    totalPositions: data.totalPositions.toString(),
    totalSupplyVault,
    totalBorrowVault,
    totalSupplyVaultUsd: new Dec(totalSupplyVault).mul(collAssetData.price).toString(),
    totalBorrowVaultUsd: new Dec(totalBorrowVault).mul(debtAssetData.price).toString(),
    withdrawalLimit: getEthAmountForDecimals(data.withdrawalLimit.toString(), collAsset.decimals),
    withdrawableUntilLimit: getEthAmountForDecimals(data.withdrawableUntilLimit.toString(), collAsset.decimals),
    withdrawable: getEthAmountForDecimals(data.withdrawable.toString(), collAsset.decimals),
    borrowLimit: getEthAmountForDecimals(data.borrowLimit.toString(), debtAsset.decimals),
    borrowableUntilLimit: getEthAmountForDecimals(data.borrowableUntilLimit.toString(), debtAsset.decimals),
    borrowable: getEthAmountForDecimals(data.borrowable.toString(), debtAsset.decimals),
    borrowLimitUtilization: getEthAmountForDecimals(data.borrowLimitUtilization.toString(), debtAsset.decimals),
    maxBorrowLimit: getEthAmountForDecimals(data.maxBorrowLimit.toString(), debtAsset.decimals),
    baseBorrowLimit: getEthAmountForDecimals(data.baseBorrowLimit.toString(), debtAsset.decimals),
    minimumBorrowing: getEthAmountForDecimals(data.minimumBorrowing.toString(), debtAsset.decimals),
    liquidationMaxLimit,
    borrowRate,
    supplyRate,
    oraclePrice,
    incentiveSupplyRate: collAssetData.supplyIncentives[0]?.apy || '0',
    incentiveBorrowRate: debtAssetData.borrowIncentives[0]?.apy || '0',
  };

  return {
    assetsData,
    marketData,
  } as FluidMarketData;
};

const parseT2MarketData = async (provider: PublicClient, data: FluidVaultDataStructOutputStruct, network: NetworkNumber, tokenPrices: Record<string, string> | null = null) => {
  const collAsset0 = getAssetInfoByAddress(data.supplyToken0, network);
  const collAsset1 = getAssetInfoByAddress(data.supplyToken1, network);
  const debtAsset = getAssetInfoByAddress(data.borrowToken0, network);

  // 18 because collateral is represented in shares for which they use 18 decimals
  const oracleScaleFactor = new Dec(27).add(debtAsset.decimals).sub(18).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();
  const oraclePrice = new Dec(data.oraclePriceOperate).div(oracleScale).toString();

  let prices: Record<string, string> = {};
  if (tokenPrices) {
    prices = tokenPrices;
  } else {
    prices = await getChainLinkPricesForTokens([collAsset0.address, collAsset1.address, debtAsset.address], network, provider);
  }

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
    price: prices[tokenPrices ? collAsset0.symbol : collAsset0.address],
    totalSupply: new Dec(totalSupplyShares).mul(token0PerSupplyShare).toString(),
    canBeSupplied: true,
    supplyRate: supplyRate0,
    utilization: utilizationSupply0,
    withdrawable: withdrawable0,
    tokenPerSupplyShare: token0PerSupplyShare,
    supplyReserves: reservesSupplyToken0,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(collFirstAssetData.symbol!)) {
    collFirstAssetData.supplyIncentives!.push({
      apy: await getStakingApy(collAsset0.symbol),
      token: collAsset0.symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${collAsset0.symbol} yield.`,
    });
  }

  const collSecondAssetData: Partial<FluidAssetData> = {
    symbol: collAsset1.symbol,
    address: collAsset1.address,
    price: prices[tokenPrices ? collAsset1.symbol : collAsset1.address],
    totalSupply: new Dec(totalSupplyShares).mul(token1PerSupplyShare).toString(),
    canBeSupplied: true,
    supplyRate: supplyRate1,
    withdrawable: withdrawable1,
    utilization: utilizationSupply1,
    tokenPerSupplyShare: token1PerSupplyShare,
    supplyReserves: reservesSupplyToken1,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(collSecondAssetData.symbol!)) {
    collSecondAssetData.supplyIncentives!.push({
      apy: await getStakingApy(collAsset1.symbol),
      token: collAsset1.symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${collAsset1.symbol} yield.`,
    });
  }

  const marketSupplyRate = getMarketRateForDex(token1PerSupplyShare, token0PerSupplyShare, supplyRate0, supplyRate1, collFirstAssetData.price!, collSecondAssetData.price!);
  const incentiveSupplyRate = getAdditionalMarketRateForDex(token1PerSupplyShare, token0PerSupplyShare, collFirstAssetData.supplyIncentives![0]?.apy || '0', collSecondAssetData.supplyIncentives![0]?.apy || '0', collFirstAssetData.price!, collSecondAssetData.price!);
  const tradingSupplyRate = await getTradingApy(data.dexSupplyData.dexPool as EthAddress);

  const borrowRate = new Dec(data.borrowRateVault).div(100).toString();
  const debtAssetData: Partial<FluidAssetData> = {
    symbol: debtAsset.symbol,
    price: prices[tokenPrices ? debtAsset.symbol : debtAsset.address],
    address: debtAsset.address,
    totalBorrow: data.totalBorrowVault.toString(),
    canBeBorrowed: true,
    borrowRate,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(debtAssetData.symbol!)) {
    debtAssetData.borrowIncentives!.push({
      apy: new Dec(await getStakingApy(debtAsset.symbol)).mul(-1).toString(),
      token: debtAsset.symbol,
      incentiveKind: IncentiveKind.Reward,
      description: `Due to the native yield of ${debtAsset.symbol}, the value of the debt would increase over time.`,
    });
  }

  const incentiveBorrowRate = new Dec(debtAssetData.borrowIncentives![0]?.apy || '0').mul(-1).toString();

  const assetsData: FluidAssetsData = ([
    [collAsset0.symbol, collFirstAssetData],
    [collAsset1.symbol, collSecondAssetData],
    [debtAsset.symbol, debtAssetData],
  ] as [string, FluidAssetData][])
    .reduce((acc, [symbol, partialData]) => ({
      ...acc,
      [symbol]: mergeAssetData(acc[symbol], partialData),
    }), {} as Record<string, FluidAssetData>) as FluidAssetsData;

  const marketInfo = getFluidMarketInfoById(+(data.vaultId.toString()), network);

  const totalBorrowVault = getEthAmountForDecimals(data.totalBorrowVault.toString(), debtAsset.decimals);

  const liqRatio = new Dec(data.liquidationThreshold).div(100).toString();
  const liquidationMaxLimit = new Dec(data.liquidationMaxLimit).div(100).toString();
  const liqFactor = new Dec(data.liquidationThreshold).div(10_000).toString();

  const totalSupplySharesInVault = assetAmountInEth(data.totalSupplyVault.toString());
  const collSharePrice = new Dec(oraclePrice).mul(prices[tokenPrices ? debtAsset.symbol : debtAsset.address]).toString();
  const totalSupplyVaultUsd = new Dec(totalSupplySharesInVault).mul(collSharePrice).toString();
  const maxSupplySharesUsd = new Dec(maxSupplyShares).mul(collSharePrice).toString();

  const withdrawableUSD = new Dec(withdrawableShares).mul(collSharePrice).toString();

  const marketData = {
    vaultId: +(data.vaultId.toString()),
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+(data.vaultType.toString())),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: liqRatio,
    liqFactor,
    minRatio: new Dec(1).div(liqFactor).mul(100).toString(),
    collAsset0: collAsset0.symbol,
    collAsset1: collAsset1.symbol,
    debtAsset0: debtAsset.symbol,
    totalPositions: data.totalPositions.toString(),
    totalSupplyVault: totalSupplyShares,
    totalBorrowVault,
    totalSupplyVaultUsd,
    collSharePrice,
    totalBorrowVaultUsd: new Dec(totalBorrowVault).mul(assetsData[debtAsset.symbol].price).toString(),
    borrowLimit: getEthAmountForDecimals(data.borrowLimit.toString(), debtAsset.decimals),
    borrowableUntilLimit: getEthAmountForDecimals(data.borrowableUntilLimit.toString(), debtAsset.decimals),
    borrowable: getEthAmountForDecimals(data.borrowable.toString(), debtAsset.decimals),
    borrowLimitUtilization: getEthAmountForDecimals(data.borrowLimitUtilization.toString(), debtAsset.decimals),
    maxBorrowLimit: getEthAmountForDecimals(data.maxBorrowLimit.toString(), debtAsset.decimals),
    baseBorrowLimit: getEthAmountForDecimals(data.baseBorrowLimit.toString(), debtAsset.decimals),
    minimumBorrowing: getEthAmountForDecimals(data.minimumBorrowing.toString(), debtAsset.decimals),
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

const parseT3MarketData = async (provider: PublicClient, data: FluidVaultDataStructOutputStruct, network: NetworkNumber, tokenPrices: Record<string, string> | null = null) => {
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

  let prices: Record<string, string> = {};
  if (tokenPrices) {
    prices = tokenPrices;
  } else {
    prices = await getChainLinkPricesForTokens([collAsset.address, debtAsset0.address, debtAsset1.address], network, provider);
  }

  const supplyRate = new Dec(data.supplyRateVault).div(100).toString();
  const collAssetData: Partial<FluidAssetData> = {
    symbol: collAsset.symbol,
    address: collAsset.address,
    price: prices[tokenPrices ? collAsset.symbol : collAsset.address],
    totalSupply: data.totalSupplyVault.toString(),
    canBeSupplied: true,
    supplyRate,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(collAssetData.symbol!)) {
    collAssetData.supplyIncentives!.push({
      apy: await getStakingApy(collAsset.symbol),
      token: collAsset.symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${collAsset.symbol} yield.`,
    });
  }

  const incentiveSupplyRate = collAssetData.supplyIncentives?.[0]?.apy || '0';

  const debtAsset0Data: Partial<FluidAssetData> = {
    symbol: debtAsset0.symbol,
    address: debtAsset0.address,
    price: prices[tokenPrices ? debtAsset0.symbol : debtAsset0.address],
    totalBorrow: new Dec(totalBorrowShares).mul(token0PerBorrowShare).toString(),
    canBeBorrowed: true,
    borrowRate: borrowRate0,
    borrowable: borrowable0,
    utilization: utilizationBorrow0,
    tokenPerBorrowShare: token0PerBorrowShare,
    borrowReserves: reservesBorrowToken0,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(debtAsset0Data.symbol!)) {
    debtAsset0Data.borrowIncentives!.push({
      apy: new Dec(await getStakingApy(debtAsset0.symbol)).mul(-1).toString(),
      token: debtAsset0.symbol,
      incentiveKind: IncentiveKind.Reward,
      description: `Due to the native yield of ${debtAsset0.symbol}, the value of the debt would increase over time.`,
    });
  }

  const debtAsset1Data: Partial<FluidAssetData> = {
    symbol: debtAsset1.symbol,
    address: debtAsset1.address,
    price: prices[tokenPrices ? debtAsset1.symbol : debtAsset1.address],
    totalBorrow: new Dec(totalBorrowShares).mul(token1PerBorrowShare).toString(),
    canBeBorrowed: true,
    borrowRate: borrowRate1,
    borrowable: borrowable1,
    utilization: utilizationBorrow1,
    tokenPerBorrowShare: token1PerBorrowShare,
    borrowReserves: reservesBorrowToken1,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(debtAsset1Data.symbol!)) {
    debtAsset1Data.borrowIncentives!.push({
      apy: new Dec(await getStakingApy(debtAsset1.symbol)).mul(-1).toString(),
      token: debtAsset1.symbol,
      incentiveKind: IncentiveKind.Reward,
      description: `Due to the native yield of ${debtAsset1.symbol}, the value of the debt would increase over time.`,
    });
  }
  const marketBorrowRate = getMarketRateForDex(token1PerBorrowShare, token0PerBorrowShare, borrowRate0, borrowRate1, debtAsset0Data.price!, debtAsset1Data.price!);
  const incentiveBorrowRate = getAdditionalMarketRateForDex(token1PerBorrowShare, token0PerBorrowShare, new Dec(debtAsset0Data.borrowIncentives![0]?.apy || '0').mul(-1).toString(), new Dec(debtAsset1Data.borrowIncentives![0]?.apy || '0').mul(-1).toString(), debtAsset0Data.price!, debtAsset1Data.price!);
  const tradingBorrowRate = await getTradingApy(data.dexBorrowData.dexPool as EthAddress);

  const assetsData: FluidAssetsData = ([
    [collAsset.symbol, collAssetData],
    [debtAsset0.symbol, debtAsset0Data],
    [debtAsset1.symbol, debtAsset1Data],
  ] as [string, FluidAssetData][])
    .reduce((acc, [symbol, partialData]) => ({
      ...acc,
      [symbol]: mergeAssetData(acc[symbol], partialData),
    }), {} as Record<string, FluidAssetData>) as FluidAssetsData;

  const marketInfo = getFluidMarketInfoById(+(data.vaultId.toString()), network);

  const totalSupplyVault = getEthAmountForDecimals(data.totalSupplyVault.toString(), collAsset.decimals);

  const liqRatio = new Dec(data.liquidationThreshold).div(100).toString();
  const liquidationMaxLimit = new Dec(data.liquidationMaxLimit).div(100).toString();
  const liqFactor = new Dec(data.liquidationThreshold).div(10_000).toString();

  const debtSharePrice = new Dec(oraclePrice).mul(prices[tokenPrices ? collAsset.symbol : collAsset.address]).toString();

  const totalBorrowSharesInVault = assetAmountInEth(data.totalBorrowVault.toString());

  const totalBorrowVaultUsd = new Dec(totalBorrowSharesInVault).mul(debtSharePrice).toString();

  const borrowableUSD = new Dec(borrowableShares).mul(debtSharePrice).toString();
  const maxBorrowSharesUsd = new Dec(maxBorrowShares).mul(debtSharePrice).toString();

  const marketData = {
    vaultId: +(data.vaultId.toString()),
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+(data.vaultType.toString())),
    oracle: data.oracle,
    liquidationPenaltyPercent: new Dec(data.liquidationPenalty).div(100).toString(),
    collFactor: new Dec(data.collateralFactor).div(10000).toString(), // we want actual factor, not in %, so we divide by 10000 instead of 100
    liquidationRatio: liqRatio,
    liqFactor,
    minRatio: new Dec(1).div(liqFactor).mul(100).toString(),
    collAsset0: collAsset.symbol,
    debtAsset0: debtAsset0.symbol,
    debtAsset1: debtAsset1.symbol,
    totalPositions: data.totalPositions.toString(),
    totalSupplyVault,
    totalBorrowVault: totalBorrowShares,
    totalSupplyVaultUsd: new Dec(totalSupplyVault).mul(assetsData[collAsset.symbol].price).toString(),
    totalBorrowVaultUsd,
    withdrawalLimit: getEthAmountForDecimals(data.withdrawalLimit.toString(), collAsset.decimals),
    withdrawableUntilLimit: getEthAmountForDecimals(data.withdrawableUntilLimit.toString(), collAsset.decimals),
    withdrawable: getEthAmountForDecimals(data.withdrawable.toString(), collAsset.decimals),
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

const parseT4MarketData = async (provider: PublicClient, data: FluidVaultDataStructOutputStruct, network: NetworkNumber, tokenPrices: Record<string, string> | null = null) => {
  const collAsset0 = getAssetInfoByAddress(data.supplyToken0, network);
  const collAsset1 = getAssetInfoByAddress(data.supplyToken1, network);
  const debtAsset0 = getAssetInfoByAddress(data.borrowToken0, network);
  const debtAsset1 = getAssetInfoByAddress(data.borrowToken1, network);
  const quoteToken = getAssetInfoByAddress(data.dexBorrowData.quoteToken, network);

  // 27 - 18 + 18
  const oracleScaleFactor = new Dec(27).toString();
  const oracleScale = new Dec(10).pow(oracleScaleFactor).toString();
  const oraclePrice = new Dec(data.oraclePriceOperate).div(oracleScale).toString();

  let prices: Record<string, string> = {};
  if (tokenPrices) {
    prices = tokenPrices;
  } else {
    prices = await getChainLinkPricesForTokens(
      [collAsset0.address, collAsset1.address, debtAsset0.address, debtAsset1.address],
      network, provider);
  }

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
    price: prices[tokenPrices ? collAsset0.symbol : collAsset0.address],
    totalSupply: new Dec(totalSupplyShares).mul(token0PerSupplyShare).toString(),
    canBeSupplied: true,
    supplyRate: supplyRate0,
    utilization: utilizationSupply0,
    withdrawable: withdrawable0,
    tokenPerSupplyShare: token0PerSupplyShare,
    supplyReserves: reservesSupplyToken0,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(collAsset0Data.symbol!)) {
    collAsset0Data.supplyIncentives!.push({
      apy: await getStakingApy(collAsset0.symbol),
      token: collAsset0.symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${collAsset0.symbol} yield.`,
    });
  }

  const collAsset1Data: Partial<FluidAssetData> = {
    symbol: collAsset1.symbol,
    address: collAsset1.address,
    price: prices[tokenPrices ? collAsset1.symbol : collAsset1.address],
    totalSupply: new Dec(totalSupplyShares).mul(token1PerSupplyShare).toString(),
    canBeSupplied: true,
    supplyRate: supplyRate1,
    withdrawable: withdrawable1,
    utilization: utilizationSupply1,
    tokenPerSupplyShare: token1PerSupplyShare,
    supplyReserves: reservesSupplyToken1,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(collAsset1Data.symbol!)) {
    collAsset1Data.supplyIncentives!.push({
      apy: await getStakingApy(collAsset1.symbol),
      token: collAsset1.symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${collAsset1.symbol} yield.`,
    });
  }

  const debtAsset0Data: Partial<FluidAssetData> = {
    symbol: debtAsset0.symbol,
    address: debtAsset0.address,
    price: prices[tokenPrices ? debtAsset0.symbol : debtAsset0.address],
    totalBorrow: new Dec(totalBorrowShares).mul(token0PerBorrowShare).toString(),
    canBeBorrowed: true,
    borrowRate: borrowRate0,
    borrowable: borrowable0,
    utilization: utilizationBorrow0,
    tokenPerBorrowShare: token0PerBorrowShare,
    borrowReserves: reservesBorrowToken0,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(debtAsset0Data.symbol!)) {
    debtAsset0Data.borrowIncentives!.push({
      apy: new Dec(await getStakingApy(debtAsset0.symbol)).mul(-1).toString(),
      token: debtAsset0.symbol,
      incentiveKind: IncentiveKind.Reward,
      description: `Due to the native yield of ${debtAsset0.symbol}, the value of the debt would increase over time.`,
    });
  }

  const debtAsset1Data: Partial<FluidAssetData> = {
    symbol: debtAsset1.symbol,
    address: debtAsset1.address,
    price: prices[tokenPrices ? debtAsset1.symbol : debtAsset1.address],
    totalBorrow: new Dec(totalBorrowShares).mul(token1PerBorrowShare).toString(),
    canBeBorrowed: true,
    borrowRate: borrowRate1,
    borrowable: borrowable1,
    utilization: utilizationBorrow1,
    tokenPerBorrowShare: token1PerBorrowShare,
    borrowReserves: reservesBorrowToken1,
    supplyIncentives: [],
    borrowIncentives: [],
  };
  if (STAKING_ASSETS.includes(debtAsset1Data.symbol!)) {
    debtAsset1Data.borrowIncentives!.push({
      apy: new Dec(await getStakingApy(debtAsset1.symbol)).mul(-1).toString(),
      token: debtAsset1.symbol,
      incentiveKind: IncentiveKind.Reward,
      description: `Due to the native yield of ${debtAsset1.symbol}, the value of the debt would increase over time.`,
    });
  }
  const marketInfo = getFluidMarketInfoById(+(data.vaultId.toString()), network);

  const marketBorrowRate = getMarketRateForDex(token1PerBorrowShare, token0PerBorrowShare, borrowRate0, borrowRate1, debtAsset0Data.price!, debtAsset1Data.price!);
  const incentiveBorrowRate = getAdditionalMarketRateForDex(token1PerBorrowShare, token0PerBorrowShare, new Dec(debtAsset0Data.borrowIncentives![0]?.apy || '0').mul(-1).toString(), new Dec(debtAsset1Data.borrowIncentives![0]?.apy || '0').mul(-1).toString(), debtAsset0Data.price!, debtAsset1Data.price!);
  const tradingBorrowRate = await getTradingApy(data.dexBorrowData.dexPool as EthAddress);

  const marketSupplyRate = getMarketRateForDex(token1PerSupplyShare, token0PerSupplyShare, supplyRate0, supplyRate1, collAsset0Data.price!, collAsset1Data.price!);
  const incentiveSupplyRate = getAdditionalMarketRateForDex(token1PerSupplyShare, token0PerSupplyShare, collAsset0Data.supplyIncentives![0]?.apy || '0', collAsset1Data.supplyIncentives![0]?.apy || '0', collAsset0Data.price!, collAsset1Data.price!);
  const tradingSupplyRate = await getTradingApy(data.dexSupplyData.dexPool as EthAddress);

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

  const totalBorrowSharesInVault = assetAmountInEth(data.totalBorrowVault.toString());
  const debtSharePrice = new Dec(quoteTokensPerShare).mul(prices[tokenPrices ? quoteToken.symbol : quoteToken.address]).toString();
  const totalBorrowVaultUsd = new Dec(totalBorrowSharesInVault).mul(debtSharePrice).toString();
  const maxBorrowSharesUsd = new Dec(maxBorrowShares).mul(debtSharePrice).toString();
  const borrowableUSD = new Dec(borrowableShares).mul(debtSharePrice).toString();

  const totalSupplySharesInVault = assetAmountInEth(data.totalSupplyVault.toString());
  const collSharePrice = new Dec(oraclePrice).mul(debtSharePrice).toString();
  const totalSupplyVaultUsd = new Dec(totalSupplySharesInVault).mul(collSharePrice).toString();
  const maxSupplySharesUsd = new Dec(maxSupplyShares).mul(collSharePrice).toString();
  const withdrawableUSD = new Dec(withdrawableShares).mul(collSharePrice).toString();

  const marketData = {
    vaultId: +(data.vaultId.toString()),
    vaultValue: marketInfo?.value,
    isSmartColl: data.isSmartColl,
    isSmartDebt: data.isSmartDebt,
    marketAddress: data.vault,
    vaultType: parseVaultType(+(data.vaultType.toString())),
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
    totalPositions: data.totalPositions.toString(),
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

const parseMarketData = async (provider: PublicClient, data: FluidVaultDataStructOutputStruct, network: NetworkNumber, tokenPrices: Record<string, string> | null = null) => {
  const vaultType = parseVaultType(+(data.vaultType.toString()));
  switch (vaultType) {
    case FluidVaultType.T1:
      return parseT1MarketData(provider, data, network, tokenPrices);
    case FluidVaultType.T2:
      return parseT2MarketData(provider, data, network, tokenPrices);
    case FluidVaultType.T3:
      return parseT3MarketData(provider, data, network, tokenPrices);
    case FluidVaultType.T4:
      return parseT4MarketData(provider, data, network, tokenPrices);
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

const parseT1UserData = (userPositionData: FluidUserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
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
  const supplied = getEthAmountForDecimals(userPositionData.supply.toString(), collAsset.decimals);
  const borrowed = getEthAmountForDecimals(userPositionData.borrow.toString(), debtAsset.decimals);

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
    nftId: userPositionData.nftId.toString(),
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }) as FluidAggregatedVaultData),
  };
};

const parseT2UserData = (userPositionData: FluidUserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
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

  const supplyShares = getEthAmountForDecimals(userPositionData.supply.toString(), 18); // this is supplied in coll shares
  const borrowed = getEthAmountForDecimals(userPositionData.borrow.toString(), debtAsset.decimals); // this is actual token borrow

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
    nftId: userPositionData.nftId.toString(),
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }, supplyShares) as FluidAggregatedVaultData),
  };
};

const parseT3UserData = (userPositionData: FluidUserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
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

  const supplied = getEthAmountForDecimals(userPositionData.supply.toString(), collAsset.decimals); // this is actual token supply
  const borrowShares = getEthAmountForDecimals(userPositionData.borrow.toString(), 18); // this is actual token borrow

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
    nftId: userPositionData.nftId.toString(),
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }, '', borrowShares) as FluidAggregatedVaultData),
  };
};

const parseT4UserData = (userPositionData: FluidUserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
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

  const supplyShares = getEthAmountForDecimals(userPositionData.supply.toString(), 18); // this is actual token supply
  const borrowShares = getEthAmountForDecimals(userPositionData.borrow.toString(), 18); // this is actual token borrow

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
    nftId: userPositionData.nftId.toString(),
    ...(getFluidAggregatedData({
      usedAssets,
      assetsData,
      marketData,
    }, supplyShares, borrowShares) as FluidAggregatedVaultData),
  };
};

const parseUserData = (userPositionData: FluidUserPositionStructOutputStruct, vaultData: FluidMarketData): FluidVaultData => {
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

export const _getFluidMarketData = async (provider: PublicClient, network: NetworkNumber, market: FluidMarketInfo) => {
  const view = FluidViewContractViem(provider, network);

  const data = await view.read.getVaultData([market.marketAddress]);

  return parseMarketData(provider, data, network);
};

export const getFluidMarketData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  market: FluidMarketInfo,
) => _getFluidMarketData(getViemProvider(provider, network), network, market);

export const _getFluidVaultIdsForUser = async (
  provider: Client,
  network: NetworkNumber,
  user: EthAddress,
): Promise<string[]> => {
  const view = FluidViewContractViem(provider, network);

  return (await view.read.getUserNftIds([user])).map((item: bigint) => item.toString());
};

export const getFluidVaultIdsForUser = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  user: EthAddress,
): Promise<string[]> => _getFluidVaultIdsForUser(getViemProvider(provider, network), network, user);


export const _getFluidPosition = async (
  provider: Client,
  network: NetworkNumber,
  vaultId: string,
  extractedState: {
    assetsData: FluidAssetsData
    marketData: InnerFluidMarketData,
  },
): Promise<FluidVaultData> => {
  const view = FluidViewContractViem(provider, network);

  const data = await view.read.getPositionByNftId([BigInt(vaultId)]);

  const userPositionData = data[0];

  return parseUserData(userPositionData, extractedState);
};

export const getFluidPosition = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  vaultId: string,
  extractedState: {
    assetsData: FluidAssetsData
    marketData: InnerFluidMarketData,
  },
): Promise<FluidVaultData> => _getFluidPosition(getViemProvider(provider, network), network, vaultId, extractedState);

export const _getFluidPositionWithMarket = async (provider: PublicClient, network: NetworkNumber, vaultId: string) => {
  const view = FluidViewContractViem(provider, network);
  const data = await view.read.getPositionByNftId([BigInt(vaultId)]);
  const marketData = await parseMarketData(provider, data[1], network);
  const userData = parseUserData(data[0], marketData);

  return {
    userData,
    marketData,
  };
};

export const getFluidPositionWithMarket = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  vaultId: string,
) => _getFluidPositionWithMarket(getViemProvider(provider, network), network, vaultId);

export const _getAllFluidMarketDataChunked = async (network: NetworkNumber, provider: PublicClient) => {
  const versions = getFluidVersionsDataForNetwork(network);
  const view = FluidViewContractViem(provider, network);
  const data = await Promise.all(versions.map((version) => view.read.getVaultData([version.marketAddress])));
  return Promise.all(data.map(async (item, i) => parseMarketData(provider, item, network)));
};

export const getAllFluidMarketDataChunked = async (
  network: NetworkNumber,
  provider: EthereumProvider,
) => _getAllFluidMarketDataChunked(network, getViemProvider(provider, network, { batch: { multicall: true } }));

export const _getFluidTokenData = async (provider: Client, network: NetworkNumber, token: string) => {
  const view = FluidViewContractViem(provider, network);
  const fTokenAddress = getFTokenAddress(token, network);
  const data = await view.read.getFTokenData([fTokenAddress]);
  const supplyRate = new Dec(data.supplyRate).div(100).toString();
  const rewardsRate = new Dec(data.rewardsRate).div(1e12).toString();
  const decimals = data.decimals.toString();

  const depositRate = new Dec(getEthAmountForDecimals(data.convertToShares.toString(), decimals)).toString();
  const withdrawRate = new Dec(getEthAmountForDecimals(data.convertToAssets.toString(), decimals)).toString();

  return {
    fTokenAddress,
    fTokenSymbol: data.symbol,
    decimals,
    totalDeposited: getEthAmountForDecimals(data.totalAssets.toString(), decimals),
    withdrawable: getEthAmountForDecimals(data.withdrawable.toString(), decimals),
    apy: new Dec(supplyRate).add(rewardsRate).toString(),
    depositRate,
    withdrawRate,
  };
};

export const getFluidTokenData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  token: string,
) => _getFluidTokenData(getViemProvider(provider, network), network, token);

const parseFDepositTokenData = (fTokenData: FluidFTokenDataStructOutput, userPosition: FluidUserEarnPositionStructOutput, fTokenAddress?: string) => {
  const supplyRate = new Dec(fTokenData.supplyRate).div(100).toString();
  const rewardsRate = new Dec(fTokenData.rewardsRate).div(1e12).toString();
  const decimals = fTokenData.decimals.toString();

  const depositRate = new Dec(getEthAmountForDecimals(fTokenData.convertToShares.toString(), decimals)).toString();
  const withdrawRate = new Dec(getEthAmountForDecimals(fTokenData.convertToAssets.toString(), decimals)).toString();

  return {
    fTokenAddress,
    fTokenSymbol: fTokenData.symbol,
    decimals,
    totalDeposited: getEthAmountForDecimals(fTokenData.totalAssets.toString(), decimals),
    withdrawable: getEthAmountForDecimals(fTokenData.withdrawable.toString(), decimals),
    apy: new Dec(supplyRate).add(rewardsRate).toString(),
    depositRate,
    withdrawRate,
    deposited: getEthAmountForDecimals(userPosition.underlyingAssets.toString(), decimals),
    depositedShares: getEthAmountForDecimals(userPosition.fTokenShares.toString(), decimals),
  };
};

export const _getFluidDepositData = async (provider: Client, network: NetworkNumber, token: string, address: EthAddress) => {
  const view = FluidViewContractViem(provider, network);
  const fTokenAddress = getFTokenAddress(token, network);
  const [userPosition, fTokenData] = await view.read.getUserEarnPositionWithFToken([fTokenAddress, address]);

  return parseFDepositTokenData(fTokenData, userPosition, fTokenAddress);
};

export const getFluidDepositData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  token: string,
  address: EthAddress,
) => _getFluidDepositData(getViemProvider(provider, network), network, token, address);

export const _getAllUserEarnPositionsWithFTokens = async (provider: Client, network: NetworkNumber, user: EthAddress) => {
  const view = FluidViewContractViem(provider, network);
  const [userPositions, fTokensData] = await view.read.getAllUserEarnPositionsWithFTokens([user]);

  const parsedRes = fTokensData.reduce<ReturnType<typeof parseFDepositTokenData>[]>((acc, fTokenData, i) => {
    const userPosition = userPositions[i];
    const deposited = userPosition?.underlyingAssets;

    if (Number(deposited) > 0) {
      const fTokenAddress = fTokenData.tokenAddress;
      acc.push(parseFDepositTokenData(fTokenData, userPosition, fTokenAddress));
    }

    return acc;
  }, []);

  return parsedRes;
};

export const getAllUserEarnPositionsWithFTokens = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  user: EthAddress,
) => _getAllUserEarnPositionsWithFTokens(getViemProvider(provider, network), network, user);

export const _getUserPositions = async (provider: PublicClient, network: NetworkNumber, user: EthAddress) => {
  const view = FluidViewContractViem(provider, network);

  const data = await view.read.getUserPositions([user]);

  const parsedMarketData = await Promise.all(data[1].map(async (vaultData) => parseMarketData(provider, vaultData, network)));

  const userData = data[0].map((position, i) => ({ ...parseUserData(position, parsedMarketData[i]) }));

  return parsedMarketData.map((market, i) => ({
    marketData: market,
    userData: userData[i],
  }));
};

export const getUserPositions = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  user: EthAddress,
) => _getUserPositions(getViemProvider(provider, network), network, user);

const getTokenPricePortfolio = async (token: string, provider: PublicClient, network: NetworkNumber) => {
  if (token === 'ETH') {
    const ethFeedContract = ETHPriceFeedContractViem(provider, network);
    return ethFeedContract.read.latestAnswer();
  }
  if (token === 'WBTC') {
    const wbtcFeedContract = BTCPriceFeedContractViem(provider, network);
    return wbtcFeedContract.read.latestAnswer();
  }
  if (token === 'wstETH') {
    return getWstETHPrice(provider, network);
  }
  if (token === 'weETH') {
    return getWeETHPrice(provider, network);
  }

  const isMainnet = isMainnetNetwork(network);
  const chainLinkFeedAddress = getChainlinkAssetAddress(token, network);
  if (isMainnet) {
    const feedRegistryContract = FeedRegistryContractViem(provider, NetworkNumber.Eth);
    return feedRegistryContract.read.latestAnswer([chainLinkFeedAddress, USD_QUOTE]);
  }

  const feedRegistryContract = DFSFeedRegistryContractViem(provider, network);
  return feedRegistryContract.read.latestRoundData([chainLinkFeedAddress, USD_QUOTE]);
};

const tokensWithoutChainlinkPrices = ['sUSDS', 'USDA', 'ezETH', 'rsETH', 'weETHs', 'LBTC'];

const handleTokenWithoutChainlinkPrice = (token: string, prices: Record<string, string>) => {
  if (token === 'sUSDS') {
    return new Dec('105276929').div(1e8).toString();
  }
  if (token === 'USDA') {
    return new Dec('100000000').div(1e8).toString();
  }
  if (token === 'ezETH') {
    return new Dec(prices.ETH).mul(1.049).toString();
  }
  if (token === 'rsETH') {
    return new Dec(prices.wstETH).mul(1.0454).toString();
  }
  if (token === 'weETHs') {
    return new Dec(prices.wstETH).mul(1.026).toString();
  }
  if (token === 'LBTC') {
    return prices.WBTC;
  }
  return '0';
};

const getTokensPricesForPortfolio = async (tokens: string[], provider: PublicClient, network: NetworkNumber) => {
  const tokensWithChainlinkPrices = tokens.filter((token) => !tokensWithoutChainlinkPrices.includes(token));
  const pricesFromChainlink: Record<string, string> = {};
  await Promise.all(tokensWithChainlinkPrices.map(async (token) => {
    const price = await getTokenPricePortfolio(token, provider, network);
    if (typeof price === 'string') pricesFromChainlink[token] = price;
    else if (typeof price === 'bigint') pricesFromChainlink[token] = new Dec(price).div(1e8).toString();
    else pricesFromChainlink[token] = new Dec(price[1]!.toString() as string).div(1e8).toString();
  }));
  tokens.forEach((token) => {
    if (tokensWithoutChainlinkPrices.includes(token)) {
      pricesFromChainlink[token] = handleTokenWithoutChainlinkPrice(token, pricesFromChainlink);
    }
  });

  return pricesFromChainlink;
};

export const _getUserPositionsPortfolio = async (provider: PublicClient, network: NetworkNumber, user: EthAddress) => {
  const view = FluidViewContractViem(provider, network);

  const data = await view.read.getUserPositions([user]);
  const tokens = Array.from(new Set(data[1].map((vaultData) => {
    const vaultTokens = [getAssetInfoByAddress(vaultData.supplyToken0, network).symbol, getAssetInfoByAddress(vaultData.borrowToken0, network).symbol];
    if (vaultData.supplyToken1 && !compareAddresses(ZERO_ADDRESS, vaultData.supplyToken1)) vaultTokens.push(getAssetInfoByAddress(vaultData.supplyToken1, network).symbol);
    if (vaultData.borrowToken1 && !compareAddresses(ZERO_ADDRESS, vaultData.borrowToken1)) vaultTokens.push(getAssetInfoByAddress(vaultData.borrowToken1, network).symbol);
    return vaultTokens;
  }).flat()));

  if (tokens.length === 0) return [];
  // ETH and WBTC needed for other tokens prices
  if (!tokens.includes('ETH')) tokens.push('ETH');
  if (!tokens.includes('WBTC')) tokens.push('WBTC');

  const tokenPrices = await getTokensPricesForPortfolio(tokens, provider, network);

  const parsedMarketData = await Promise.all(data[1].map(async (vaultData) => parseMarketData(provider, vaultData, network, tokenPrices)));

  const userData = data[0].map((position, i) => ({ ...parseUserData(position, parsedMarketData[i]) }));

  return parsedMarketData.map((market, i) => ({
    marketData: market,
    userData: userData[i],
  }));
};