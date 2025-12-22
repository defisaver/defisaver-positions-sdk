import { Client } from 'viem';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { getViemProvider } from '../services/viem';
import {
  AaveV4HubAssetOnChainData,
  AaveV4HubOnChainData,
  AaveV4ReserveAssetData, AaveV4ReserveAssetOnChain, AaveV4SpokeData, AaveV4SpokeInfo,
} from '../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import { AaveV4ViewContractViem } from '../contracts';

const fetchHubData = async (viewContract: ReturnType<typeof AaveV4ViewContractViem>, hubAddress: EthAddress): Promise<AaveV4HubOnChainData> => {
  const hubData = await viewContract.read.getHubAllAssetsData([hubAddress]);
  console.log('hubData', hubData);
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

const formatReserveAsset = (reserveAsset: AaveV4ReserveAssetOnChain, hubAsset: AaveV4HubAssetOnChainData, oracleDecimals: number): AaveV4ReserveAssetData => {
  const assetInfo = getAssetInfoByAddress(reserveAsset.underlying);
  return ({
    symbol: assetInfo.symbol,
    underlying: reserveAsset.underlying,
    hub: reserveAsset.hub,
    assetId: reserveAsset.assetId,
    paused: reserveAsset.paused,
    frozen: reserveAsset.frozen,
    borrowable: reserveAsset.borrowable,
    collateralRisk: new Dec(reserveAsset.collateralRisk).div(10000).toNumber(),
    collateralFactor: new Dec(reserveAsset.collateralFactor).div(10000).toNumber(),
    liquidationFee: new Dec(reserveAsset.liquidationFee).div(10000).toNumber(),
    price: new Dec(reserveAsset.price).div(new Dec(10).pow(oracleDecimals)).toString(),
    totalSupplied: assetAmountInEth(reserveAsset.totalSupplied.toString(), assetInfo.symbol),
    totalDrawn: assetAmountInEth(reserveAsset.totalDrawn.toString(), assetInfo.symbol),
    totalPremium: assetAmountInEth(reserveAsset.totalPremium.toString(), assetInfo.symbol),
    totalDebt: assetAmountInEth(reserveAsset.totalDebt.toString(), assetInfo.symbol),
    supplyCap: assetAmountInEth(reserveAsset.supplyCap.toString(), assetInfo.symbol),
    borrowCap: assetAmountInEth(reserveAsset.borrowCap.toString(), assetInfo.symbol),
    spokeActive: reserveAsset.spokeActive,
    spokePaused: reserveAsset.spokePaused,
    drawnRate: new Dec(hubAsset.drawnRate).div(new Dec(10).pow(27)).toString(),
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

  const reserveAssetsArray = spokeData[1].map((reserveAssetOnChain: AaveV4ReserveAssetOnChain) => formatReserveAsset(reserveAssetOnChain, hubsData[reserveAssetOnChain.hub].assets[reserveAssetOnChain.assetId], +spokeData[0].oracleDecimals.toString()));

  return {
    assetsData: reserveAssetsArray.reduce((acc: Record<string, AaveV4ReserveAssetData>, reserveAsset: AaveV4ReserveAssetData) => {
      acc[reserveAsset.symbol] = reserveAsset;
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

export async function _getAaveV4AccountData(provider: Client, network: NetworkNumber, marketData: AaveV4SpokeData, address: EthAddress, blockNumber: 'latest' | number = 'latest'): Promise<any> {
  const viewContract = AaveV4ViewContractViem(provider, network, blockNumber);

  const loanData = await viewContract.read.getLoanData([marketData.address, address]);
  console.log('loanData', loanData);
}

export async function getAaveV4AccountData(provider: EthereumProvider, network: NetworkNumber, marketData: AaveV4SpokeData, address: EthAddress, blockNumber: 'latest' | number = 'latest'): Promise<any> {
  return _getAaveV4AccountData(getViemProvider(provider, network), network, marketData, address, blockNumber);
}