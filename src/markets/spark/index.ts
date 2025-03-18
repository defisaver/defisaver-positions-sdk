import { getConfigContractAddress } from '../../contracts';
import { SparkMarketData, SparkVersions } from '../../types';
import { NetworkNumber } from '../../types/common';
import { sparkAssetsDefaultMarket } from './marketAssets';

export const sparkEthEmodeId = {
  [NetworkNumber.Eth]: 1,
} as const;

export const SPARK_V1 = (networkId: NetworkNumber = NetworkNumber.Eth): SparkMarketData => ({
  chainIds: [1],
  label: 'Spark',
  shortLabel: 'v1',
  value: SparkVersions.SparkV1,
  url: 'default',
  assets: networkId ? sparkAssetsDefaultMarket[networkId] : [],
  provider: 'SparkPoolAddressesProvider',
  providerAddress: getConfigContractAddress('SparkPoolAddressesProvider', networkId),
  lendingPool: 'SparkLendingPool',
  lendingPoolAddress: getConfigContractAddress('SparkLendingPool', networkId),
  protocolData: 'SparkProtocolDataProvider',
  protocolDataAddress: getConfigContractAddress('SparkProtocolDataProvider', networkId),
  // icon: SvgAdapter(protocolIcons.spark),
  protocolName: 'spark',
});


export const SparkMarkets = (networkId: NetworkNumber) => ({
  [SparkVersions.SparkV1]: SPARK_V1(networkId),
}) as const;
