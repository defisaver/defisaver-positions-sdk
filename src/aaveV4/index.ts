import { Client } from 'viem';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { getViemProvider } from '../services/viem';
import {
  AaveV4AccountData,
  AaveV4HubAssetOnChainData,
  AaveV4HubOnChainData,
  AaveV4ReserveAssetData,
  AaveV4ReserveAssetOnChain,
  AaveV4SpokeData,
  AaveV4SpokeInfo,
  AaveV4UsedReserveAssets,
  EthAddress,
  EthereumProvider,
  IncentiveData,
  IncentiveKind,
  NetworkNumber,
} from '../types';
import { AaveV4ViewContractViem } from '../contracts';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { isMaxUint, wethToEth } from '../services/utils';
import { aaveV4GetAggregatedPositionData, calcUserRiskPremiumBps } from '../helpers/aaveV4Helpers';
import { getAaveV4HubByAddress } from '../markets/aaveV4';
import { aprToApy } from '../moneymarket';

export * as lend from './lend';

const fetchHubData = async (viewContract: ReturnType<typeof AaveV4ViewContractViem>, hubAddress: EthAddress): Promise<AaveV4HubOnChainData> => {
  const hubData = await viewContract.read.getHubAllAssetsData([hubAddress]);
  return {
    assets: hubData.reduce((acc: Record<number, AaveV4HubAssetOnChainData>, assetOnChainData) => {
      acc[assetOnChainData.assetId] = {
        assetId: assetOnChainData.assetId,
        drawnRate: assetOnChainData.drawnRate,
        liquidity: assetOnChainData.liquidity,
        liquidityFee: assetOnChainData.liquidityFee,
        swept: assetOnChainData.swept,
        totalDrawn: assetOnChainData.totalDrawn,
        totalDrawnShares: assetOnChainData.totalDrawnShares,
        totalPremiumShares: assetOnChainData.totalPremiumShares,
      };
      return acc;
    }, {}),
  };
};


const formatReserveAsset = async (reserveAsset: AaveV4ReserveAssetOnChain, hubAsset: AaveV4HubAssetOnChainData, reserveId: number, oracleDecimals: number, network: NetworkNumber): Promise<AaveV4ReserveAssetData> => {
  const assetInfo = getAssetInfoByAddress(reserveAsset.underlying, network);
  const symbol = wethToEth(assetInfo.symbol);
  const hubInfo = getAaveV4HubByAddress(network, reserveAsset.hub);
  if (!hubInfo) {
    throw new Error(`Hub not found with address: ${reserveAsset.hub}`);
  }

  const isStakingAsset = STAKING_ASSETS.includes(symbol);
  const supplyIncentives: IncentiveData[] = [];
  const borrowIncentives: IncentiveData[] = [];

  if (isStakingAsset) {
    const yieldApy = await getStakingApy(symbol, network as NetworkNumber);
    supplyIncentives.push({
      apy: yieldApy,
      token: symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${symbol} yield.`,
    });
    if (reserveAsset.borrowable) {
      // When borrowing assets whose value increases over time
      borrowIncentives.push({
        apy: new Dec(yieldApy).mul(-1).toString(),
        token: symbol,
        incentiveKind: IncentiveKind.Reward,
        description: `Due to the native yield of ${symbol}, the value of the debt would increase over time.`,
      });
    }
  }

  const totalSuppliedRaw = reserveAsset.totalSupplied ?? 0;
  const totalDrawnRaw = reserveAsset.totalDrawn ?? 0;
  const totalPremiumRaw = reserveAsset.totalPremium ?? 0;
  const totalDebtRaw = reserveAsset.totalDebt ?? 0;
  const supplyCapRaw = reserveAsset.supplyCap ?? 0;
  const borrowCapRaw = reserveAsset.borrowCap ?? 0;

  /** @DEV Hub related calculations */
  const drawnRate = new Dec(hubAsset.drawnRate.toString()).div(new Dec(10).pow(27));
  const borrowApr = drawnRate.mul(100);
  const totalDrawn = new Dec(hubAsset.totalDrawn.toString());
  const liquidity = new Dec(hubAsset.liquidity.toString());
  const swept = new Dec(hubAsset.swept.toString());
  const hubUtilizationDenominator = totalDrawn.add(swept).add(liquidity);
  const hubUtilization = hubUtilizationDenominator.isZero() ? new Dec(0) : totalDrawn.div(hubUtilizationDenominator);
  const liquidityFee = new Dec(hubAsset.liquidityFee.toString()).div(new Dec(10).pow(4));
  const totalDrawnShares = new Dec(hubAsset.totalDrawnShares.toString());
  const totalPremiumShares = new Dec(hubAsset.totalPremiumShares.toString());
  const premiumMultiplier = totalDrawnShares.isZero() ? new Dec(1) : totalDrawnShares.add(totalPremiumShares).div(totalDrawnShares);
  const supplyApr = borrowApr.mul(hubUtilization).mul(premiumMultiplier).mul(new Dec(1).minus(liquidityFee));
  const utilization = hubUtilization.times(100).toString();

  const hubLiquidityRaw = hubAsset.liquidity;
  const hubLiquidity = isMaxUint(hubLiquidityRaw.toString()) ? hubLiquidityRaw.toString() : assetAmountInEth(hubLiquidityRaw.toString(), symbol);

  return ({
    symbol,
    underlying: reserveAsset.underlying,
    hub: hubInfo.address,
    hubName: hubInfo?.label,
    assetId: reserveAsset.assetId,
    reserveId,
    paused: reserveAsset.paused,
    frozen: reserveAsset.frozen,
    borrowable: reserveAsset.borrowable,
    collateralRisk: new Dec(reserveAsset.collateralRisk).div(10000).toNumber(),
    collateralFactor: new Dec(reserveAsset.collateralFactor).div(10000).toNumber(),
    liquidationFee: new Dec(reserveAsset.liquidationFee).div(10000).toNumber(),
    maxLiquidationBonus: new Dec(reserveAsset.maxLiquidationBonus).div(10000).toNumber(),
    price: new Dec(reserveAsset.price).div(new Dec(10).pow(oracleDecimals)).toString(),
    totalSupplied: isMaxUint(totalSuppliedRaw.toString()) ? totalSuppliedRaw.toString() : assetAmountInEth(totalSuppliedRaw.toString(), symbol),
    totalDrawn: isMaxUint(totalDrawnRaw.toString()) ? totalDrawnRaw.toString() : assetAmountInEth(totalDrawnRaw.toString(), symbol),
    totalPremium: isMaxUint(totalPremiumRaw.toString()) ? totalPremiumRaw.toString() : assetAmountInEth(totalPremiumRaw.toString(), symbol),
    totalDebt: isMaxUint(totalDebtRaw.toString()) ? totalDebtRaw.toString() : assetAmountInEth(totalDebtRaw.toString(), symbol),
    supplyCap: isMaxUint(supplyCapRaw.toString()) ? supplyCapRaw.toString() : assetAmountInEth(supplyCapRaw.toString(), symbol),
    borrowCap: isMaxUint(borrowCapRaw.toString()) ? borrowCapRaw.toString() : assetAmountInEth(borrowCapRaw.toString(), symbol),
    spokeActive: reserveAsset.spokeActive,
    spokeHalted: reserveAsset.spokeHalted,
    drawnRate: drawnRate.toString(),
    borrowRate: aprToApy(borrowApr.toString()),
    supplyRate: aprToApy(supplyApr.toString()),
    supplyIncentives,
    borrowIncentives,
    canBeBorrowed: reserveAsset.spokeActive && !reserveAsset.spokeHalted && !reserveAsset.paused && !reserveAsset.frozen && reserveAsset.borrowable,
    canBeSupplied: reserveAsset.spokeActive && !reserveAsset.spokeHalted && !reserveAsset.paused && !reserveAsset.frozen,
    canBeWithdrawn: reserveAsset.spokeActive && !reserveAsset.spokeHalted && !reserveAsset.paused,
    canBePayBacked: reserveAsset.spokeActive && !reserveAsset.spokeHalted && !reserveAsset.paused,
    utilization,
    hubLiquidity,
  });
};

export async function _getAaveV4SpokeData(provider: Client, network: NetworkNumber, market: AaveV4SpokeInfo, blockNumber: 'latest' | number = 'latest'): Promise<AaveV4SpokeData> {
  const viewContract = AaveV4ViewContractViem(provider, network, blockNumber);

  const hubsData: Record<EthAddress, AaveV4HubOnChainData> = {};
  const [spokeData] = await Promise.all([
    viewContract.read.getSpokeDataFull([market.address]),
    ...market.hubs.map(async (hubAddress) => {
      hubsData[hubAddress] = await fetchHubData(viewContract, hubAddress);
    }),
  ]);

  const reserveAssetsArray = await Promise.all(spokeData[1].map(async (reserveAssetOnChain: AaveV4ReserveAssetOnChain, index: number) => formatReserveAsset(reserveAssetOnChain, hubsData[reserveAssetOnChain.hub].assets[reserveAssetOnChain.assetId], index, +spokeData[0].oracleDecimals.toString(), network)));

  return {
    assetsData: reserveAssetsArray.reduce((acc: Record<string, AaveV4ReserveAssetData>, reserveAsset: AaveV4ReserveAssetData) => {
      acc[`${reserveAsset.symbol}-${reserveAsset.reserveId}`] = reserveAsset;
      return acc;
    }, {}),
    oracle: spokeData[0].oracle,
    oracleDecimals: +spokeData[0].oracleDecimals.toString(),
    address: market.address,
  };
}

export async function getAaveV4SpokeData(provider: EthereumProvider, network: NetworkNumber, spoke: AaveV4SpokeInfo, blockNumber: 'latest' | number = 'latest'): Promise<AaveV4SpokeData> {
  return _getAaveV4SpokeData(getViemProvider(provider, network), network, spoke, blockNumber);
}

export async function _getAaveV4AccountData(provider: Client, network: NetworkNumber, spokeData: AaveV4SpokeData, address: EthAddress, blockNumber: 'latest' | number = 'latest'): Promise<AaveV4AccountData> {
  const viewContract = AaveV4ViewContractViem(provider, network, blockNumber);

  const loanData = await viewContract.read.getLoanData([spokeData.address, address]);

  const healthFactorFromContract = new Dec(loanData.healthFactor.toString());
  const healthFactor = isMaxUint(healthFactorFromContract.toString()) ? 'Infinity' : healthFactorFromContract.div(1e18).toString();
  const usedAssets = loanData.reserves.reduce((acc: AaveV4UsedReserveAssets, usedReserveAsset) => {
    const identifier = `${wethToEth(getAssetInfoByAddress(usedReserveAsset.underlying, network).symbol)}-${+usedReserveAsset.reserveId.toString()}`;
    const reserveData = spokeData.assetsData[identifier];
    const price = reserveData.price;
    const supplied = isMaxUint(usedReserveAsset.supplied.toString()) ? usedReserveAsset.supplied.toString() : assetAmountInEth(usedReserveAsset.supplied.toString(), reserveData.symbol);
    const drawn = isMaxUint(usedReserveAsset.drawn.toString()) ? usedReserveAsset.drawn.toString() : assetAmountInEth(usedReserveAsset.drawn.toString(), reserveData.symbol);
    const premium = isMaxUint(usedReserveAsset.premium.toString()) ? usedReserveAsset.premium.toString() : assetAmountInEth(usedReserveAsset.premium.toString(), reserveData.symbol);
    const borrowed = isMaxUint(usedReserveAsset.totalDebt.toString()) ? usedReserveAsset.totalDebt.toString() : assetAmountInEth(usedReserveAsset.totalDebt.toString(), reserveData.symbol);
    acc[identifier] = {
      symbol: reserveData.symbol,
      hubName: reserveData.hubName,
      assetId: reserveData.assetId,
      reserveId: +usedReserveAsset.reserveId.toString(),
      supplied,
      suppliedUsd: new Dec(supplied).mul(price).toString(),
      drawn,
      drawnUsd: new Dec(drawn).mul(price).toString(),
      premium,
      premiumUsd: new Dec(premium).mul(price).toString(),
      borrowed,
      borrowedUsd: new Dec(borrowed).mul(price).toString(),
      isSupplied: !new Dec(supplied).eq(0),
      isBorrowed: usedReserveAsset.isBorrowing,
      collateral: usedReserveAsset.isUsingAsCollateral,
      collateralFactor: new Dec(usedReserveAsset.collateralFactor).div(10000).toNumber(),
    };
    return acc;
  }, {});

  const aggregated = aaveV4GetAggregatedPositionData({
    usedAssets,
    assetsData: spokeData.assetsData,
    network,
    useUserCollateralFactor: true,
  });

  const riskPremiumBps = calcUserRiskPremiumBps(usedAssets, spokeData.assetsData);

  return {
    ...aggregated,
    usedAssets,
    healthFactor,
    riskPremiumBps,
  };
}

export async function getAaveV4AccountData(provider: EthereumProvider, network: NetworkNumber, marketData: AaveV4SpokeData, address: EthAddress, blockNumber: 'latest' | number = 'latest'): Promise<any> {
  return _getAaveV4AccountData(getViemProvider(provider, network), network, marketData, address, blockNumber);
}

const _getAaveV4UnderlyingFromReserveId = async (provider: Client, network: NetworkNumber, spoke: EthAddress, reserveId: number): Promise<any> => {
  const viewContract = AaveV4ViewContractViem(provider, network);

  const reserveData = await viewContract.read.getReserveData([spoke, BigInt(reserveId)]);

  return reserveData.underlying;
};

export async function getAaveV4UnderlyingFromReserveId(provider: EthereumProvider, network: NetworkNumber, spoke: EthAddress, reserveId: number): Promise<any> {
  return _getAaveV4UnderlyingFromReserveId(getViemProvider(provider, network), network, spoke, reserveId);
}