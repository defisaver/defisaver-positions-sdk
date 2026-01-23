import { Client } from 'viem';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { getViemProvider } from '../services/viem';
import {
  AaveV4AccountData,
  AaveV4HubAssetOnChainData,
  AaveV4HubOnChainData,
  AaveV4ReserveAssetData, AaveV4ReserveAssetOnChain, AaveV4SpokeData, AaveV4SpokeInfo,
  AaveV4UsedReserveAssets,
} from '../types';
import {
  EthAddress, EthereumProvider, IncentiveData, IncentiveKind, NetworkNumber,
} from '../types/common';
import { AaveV4ViewContractViem } from '../contracts';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { wethToEth } from '../services/utils';
import { aaveV4GetAggregatedPositionData } from '../helpers/aaveV4Helpers';
import { getAaveV4HubByAddress } from '../markets/aaveV4';

const fetchHubData = async (viewContract: ReturnType<typeof AaveV4ViewContractViem>, hubAddress: EthAddress): Promise<AaveV4HubOnChainData> => {
  const hubData = await viewContract.read.getHubAllAssetsData([hubAddress]);
  return {
    assets: hubData.reduce((acc: Record<number, AaveV4HubAssetOnChainData>, assetOnChainData) => {
      acc[assetOnChainData.assetId] = {
        assetId: assetOnChainData.assetId,
        drawnRate: assetOnChainData.drawnRate,
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
      // when borrowing assets whose value increases over time
      borrowIncentives.push({
        apy: new Dec(yieldApy).mul(-1).toString(),
        token: symbol,
        incentiveKind: IncentiveKind.Reward,
        description: `Due to the native yield of ${symbol}, the value of the debt would increase over time.`,
      });
    }
  }

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
    price: new Dec(reserveAsset.price).div(new Dec(10).pow(oracleDecimals)).toString(),
    totalSupplied: assetAmountInEth(reserveAsset.totalSupplied.toString(), symbol),
    totalDrawn: assetAmountInEth(reserveAsset.totalDrawn.toString(), symbol),
    totalPremium: assetAmountInEth(reserveAsset.totalPremium.toString(), symbol),
    totalDebt: assetAmountInEth(reserveAsset.totalDebt.toString(), symbol),
    supplyCap: assetAmountInEth(reserveAsset.supplyCap.toString(), symbol),
    borrowCap: assetAmountInEth(reserveAsset.borrowCap.toString(), symbol),
    spokeActive: reserveAsset.spokeActive,
    spokePaused: reserveAsset.spokePaused,
    drawnRate: new Dec(hubAsset.drawnRate).div(new Dec(10).pow(27)).toString(),
    supplyRate: '0', // To be implemented
    supplyIncentives,
    borrowIncentives,
    canBeBorrowed: reserveAsset.spokeActive && !reserveAsset.spokePaused && !reserveAsset.paused && !reserveAsset.frozen,
    canBeSupplied: reserveAsset.spokeActive && !reserveAsset.spokePaused && !reserveAsset.paused && !reserveAsset.frozen,
    canBeWithdrawn: reserveAsset.spokeActive && !reserveAsset.spokePaused && !reserveAsset.paused,
    canBePayBacked: reserveAsset.spokeActive && !reserveAsset.spokePaused && !reserveAsset.paused,
    utilization: new Dec(reserveAsset.totalDrawn.toString()).times(100).div(new Dec(reserveAsset.totalSupplied.toString())).toString(),
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

  const healthFactor = new Dec(loanData.healthFactor).div(1e18).toString();
  const usedAssets = loanData.reserves.reduce((acc: AaveV4UsedReserveAssets, usedReserveAsset) => {
    const identifier = `${wethToEth(getAssetInfoByAddress(usedReserveAsset.underlying, network).symbol)}-${+usedReserveAsset.reserveId.toString()}`;
    const reserveData = spokeData.assetsData[identifier];
    const price = reserveData.price;
    const supplied = assetAmountInEth(usedReserveAsset.supplied.toString(), reserveData.symbol);
    const drawn = assetAmountInEth(usedReserveAsset.drawn.toString(), reserveData.symbol);
    const premium = assetAmountInEth(usedReserveAsset.premium.toString(), reserveData.symbol);
    const borrowed = assetAmountInEth(usedReserveAsset.totalDebt.toString(), reserveData.symbol);
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

  return {
    usedAssets,
    healthFactor,
    ...aaveV4GetAggregatedPositionData({
      usedAssets,
      assetsData: spokeData.assetsData,
      network,
      useUserCollateralFactor: true,
    }),
  };
}

export async function getAaveV4AccountData(provider: EthereumProvider, network: NetworkNumber, marketData: AaveV4SpokeData, address: EthAddress, blockNumber: 'latest' | number = 'latest'): Promise<any> {
  return _getAaveV4AccountData(getViemProvider(provider, network), network, marketData, address, blockNumber);
}