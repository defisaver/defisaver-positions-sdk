import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  Blockish, EthAddress, EthereumProvider, IncentiveKind, NetworkNumber, PositionBalances,
} from '../types/common';
import { calculateNetApy, getStakingApy } from '../staking';
import { ethToWeth, wethToEth, wethToEthByAddress } from '../services/utils';
import { AaveLoanInfoV2ContractViem, createViemContractFromConfigFunc } from '../contracts';
import { aprToApy, calculateBorrowingAssetLimit } from '../moneymarket';
import {
  AaveMarketInfo, AaveV2AssetData, AaveV2AssetsData, AaveV2PositionData, AaveV2UsedAsset, AaveV2UsedAssets,
} from '../types';
import { EMPTY_AAVE_DATA } from '../aaveV3';
import { AAVE_V2 } from '../markets/aave';
import { aaveAnyGetAggregatedPositionData } from '../helpers/aaveHelpers';
import { getEthPrice } from '../services/priceService';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

export const _getAaveV2MarketsData = async (provider: Client, network: NetworkNumber, selectedMarket: AaveMarketInfo) => {
  const _addresses = selectedMarket.assets.map(a => getAssetInfo(ethToWeth(a)).address);
  const loanInfoContract = AaveLoanInfoV2ContractViem(provider, network);
  const marketAddress = selectedMarket.providerAddress;
  const [loanInfo, ethPrice] = await Promise.all([
    loanInfoContract.read.getFullTokensInfo([marketAddress, _addresses as EthAddress[]]),
    getEthPrice(provider),
  ]);
  const markets: AaveV2AssetData[] = loanInfo
    .map((market, i) => ({
      symbol: selectedMarket.assets[i],
      underlyingTokenAddress: market.underlyingTokenAddress,
      supplyRate: aprToApy(new Dec(market.supplyRate.toString()).div(1e25).toString()),
      borrowRate: aprToApy(new Dec(market.borrowRateVariable.toString()).div(1e25).toString()),
      borrowRateStable: aprToApy(new Dec(market.borrowRateStable.toString()).div(1e25).toString()),
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
      supplyCap: '0',
      borrowCap: '0', // v2 doesnt have borrow cap but adding it for compatability with v3
      totalSupply: assetAmountInEth(market.totalSupply.toString(), selectedMarket.assets[i]),
      isInactive: !market.isActive,
      isFrozen: market.isFrozen,
      canBeBorrowed: market.isActive && market.borrowingEnabled && !market.isFrozen,
      canBeSupplied: market.isActive && !market.isFrozen,
      canBeWithdrawn: market.isActive,
      canBePayBacked: market.isActive,
      disabledStableBorrowing: !market.stableBorrowRateEnabled,
      totalBorrow: assetAmountInEth(market.totalBorrow.toString(), selectedMarket.assets[i]),
      totalBorrowVar: assetAmountInEth(market.totalBorrowVar.toString(), selectedMarket.assets[i]),
      priceInEth: new Dec(market.price.toString()).div(1e18).toString(),
      supplyIncentives: [],
      borrowIncentives: [],
      price: new Dec(market.price.toString()).div(1e18).mul(ethPrice).toString(),
    }));

  const stEthMarket = markets.find(({ symbol }) => symbol === 'stETH');
  if (stEthMarket) {
    stEthMarket.supplyIncentives.push({
      apy: await getStakingApy('stETH'),
      token: 'stETH',
      incentiveKind: IncentiveKind.Staking,
      description: 'Native stETH yield.',
    });
  }

  const payload: AaveV2AssetsData = {};
  // Sort by market size
  markets
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalSupply).toString();
      const bMarket = new Dec(b.price).times(b.totalSupply).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((assetData: AaveV2AssetData, i) => {
      payload[assetData.symbol] = { ...assetData, sortIndex: i };
    });

  return { assetsData: payload };
};

export const getAaveV2MarketsData = async (provider: EthereumProvider, network: NetworkNumber, selectedMarket: AaveMarketInfo) => _getAaveV2MarketsData(getViemProvider(provider, network), network, selectedMarket);

export const _getAaveV2AccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const market = AAVE_V2;

  const loanInfoContract = AaveLoanInfoV2ContractViem(provider, network, block);

  const marketAddress = market.providerAddress;
  // @ts-ignore
  const protocolDataProviderContract = createViemContractFromConfigFunc(market.protocolData, market.protocolDataAddress)(provider, network);

  // @ts-ignore
  const reserveTokens = await protocolDataProviderContract.read.getAllReservesTokens(setViemBlockNumber(block)) as { symbol: string, tokenAddress: EthAddress }[];
  const symbols = reserveTokens.map(({ symbol }: { symbol: string }) => symbol);
  const _addresses = reserveTokens.map(({ tokenAddress }: { tokenAddress: EthAddress }) => tokenAddress);

  const loanInfo = await loanInfoContract.read.getTokenBalances([marketAddress, address, _addresses as EthAddress[]], setViemBlockNumber(block));

  loanInfo.forEach((_tokenInfo: any, i: number) => {
    const asset = wethToEth(symbols[i]);
    const assetAddr = wethToEthByAddress(_addresses[i], network).toLowerCase();
    const tokenInfo = { ..._tokenInfo };

    // known bug: stETH leaves 1 wei on every transfer
    if (asset === 'stETH' && tokenInfo.balance.toString() === '1') {
      tokenInfo.balance = '0';
    }

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

export const getAaveV2AccountBalances = async (provider: EthereumProvider, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => _getAaveV2AccountBalances(getViemProvider(provider, network), network, block, addressMapping, address);

export const _getAaveV2AccountData = async (provider: Client, network: NetworkNumber, address: EthAddress, assetsData: AaveV2AssetsData, market: AaveMarketInfo): Promise<AaveV2PositionData> => {
  if (!address) throw new Error('Address is required');

  let payload: AaveV2PositionData = {
    ...EMPTY_AAVE_DATA,
    lastUpdated: Date.now(),
  };

  const loanInfoContract = AaveLoanInfoV2ContractViem(provider, network);
  const marketAddress = market.providerAddress;
  const _addresses = market.assets.map(a => getAssetInfo(ethToWeth(a)).address);
  const loanInfo = await loanInfoContract.read.getTokenBalances([marketAddress, address, _addresses as EthAddress[]]);
  const usedAssets = {} as AaveV2UsedAssets;
  loanInfo.forEach((_tokenInfo, i) => {
    const asset = market.assets[i];
    const tokenInfo = { ..._tokenInfo };

    // known bug: stETH leaves 1 wei on every transfer
    if (asset === 'stETH' && tokenInfo.balance.toString() === '1') tokenInfo.balance = BigInt('0');

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
    if (!usedAssets[asset]) usedAssets[asset] = {} as AaveV2UsedAsset;
    usedAssets[asset] = {
      ...usedAssets[asset],
      symbol: asset,
      supplied,
      suppliedUsd: new Dec(supplied).mul(assetsData[asset].price).toString(),
      isSupplied,
      collateral: enabledAsCollateral,
      stableBorrowRate: aprToApy(new Dec(tokenInfo.stableBorrowRate).div(1e25).toString()),
      borrowedStable,
      borrowedVariable,
      borrowedUsdStable: new Dec(borrowedStable).mul(assetsData[asset].price).toString(),
      borrowedUsdVariable: new Dec(borrowedVariable).mul(assetsData[asset].price).toString(),
      borrowed: new Dec(borrowedStable).add(borrowedVariable).toString(),
      borrowedUsd: new Dec(new Dec(borrowedVariable).add(borrowedStable)).mul(assetsData[asset].price).toString(),
      isBorrowed,
      interestMode,
    };
  });
  payload = {
    ...payload,
    usedAssets,
    ...aaveAnyGetAggregatedPositionData({
      usedAssets, assetsData, eModeCategory: 0, selectedMarket: market,
    }),
  };

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

export const getAaveV2AccountData = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress, assetsData: AaveV2AssetsData, market: AaveMarketInfo): Promise<AaveV2PositionData> => _getAaveV2AccountData(getViemProvider(provider, network), network, address, assetsData, market);

export const getAaveV2FullPositionData = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress, market: AaveMarketInfo): Promise<AaveV2PositionData> => {
  const marketData = await getAaveV2MarketsData(provider, network, market);
  const positionData = await getAaveV2AccountData(provider, network, address, marketData.assetsData, market);
  return positionData;
};
