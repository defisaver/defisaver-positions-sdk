// @ts-nocheck
import { getConfigContractAddress } from '../../contracts';
import { compareAddresses } from '../../services/utils';
import {
  AaveMarketInfo, AaveVersions,
} from '../../types';
import { NetworkNumber } from '../../types/common';
import {
  aaveV1AssetsDefaultMarket, aaveV2AssetsDefaultMarket, aaveV3AssetsDefaultMarket, aaveV3AssetsEtherfiMarket, aaveV3AssetsLidoMarket,
} from './marketAssets';

export {
  aaveV1AssetsDefaultMarket,
  aaveV2AssetsDefaultMarket,
  aaveV3AssetsDefaultMarket,
  aaveV3AssetsLidoMarket,
};

export const AAVE_V1: AaveMarketInfo = {
  chainIds: [NetworkNumber.Eth],
  label: 'Aave v1',
  shortLabel: 'v1',
  url: '',
  value: AaveVersions.AaveV1,
  assets: aaveV1AssetsDefaultMarket.map((a) => a.underlyingAsset),
  provider: '',
  providerAddress: '',
  lendingPool: '',
  lendingPoolAddress: '',
  protocolData: '',
  protocolDataAddress: '',
  // icon: SvgAdapter(protocolIcons.aave),
  disabled: true,
  protocolName: 'aave',
};

export const AAVE_V2: AaveMarketInfo = {
  chainIds: [NetworkNumber.Eth],
  label: 'Aave v2',
  shortLabel: 'v2',
  value: AaveVersions.AaveV2,
  url: 'default',
  assets: aaveV2AssetsDefaultMarket,
  provider: 'LendingPoolAddressesProvider',
  providerAddress: getConfigContractAddress('LendingPoolAddressesProvider', 1), // rename
  lendingPool: 'AaveLendingPoolV2',
  lendingPoolAddress: getConfigContractAddress('AaveLendingPoolV2', 1),
  protocolData: 'AaveProtocolDataProvider',
  protocolDataAddress: getConfigContractAddress('AaveProtocolDataProvider', 1),
  // icon: SvgAdapter(protocolIcons.aave),
  protocolName: 'aave',
};

export const AAVE_V3 = (networkId: NetworkNumber): AaveMarketInfo => ({
  chainIds: [NetworkNumber.Eth, NetworkNumber.Opt, NetworkNumber.Arb, NetworkNumber.Base],
  label: networkId === 1 ? 'Aave v3 Core' : 'Aave v3',
  shortLabel: 'v3',
  value: AaveVersions.AaveV3,
  url: 'default',
  assets: networkId ? aaveV3AssetsDefaultMarket[networkId] : [],
  provider: 'AaveV3PoolAddressesProvider',
  providerAddress: getConfigContractAddress('AaveV3PoolAddressesProvider', networkId),
  lendingPool: 'AaveV3LendingPool',
  lendingPoolAddress: getConfigContractAddress('AaveV3LendingPool', networkId),
  protocolData: 'AaveV3ProtocolDataProvider',
  protocolDataAddress: getConfigContractAddress('AaveV3ProtocolDataProvider', networkId),
  // icon: SvgAdapter(protocolIcons.aave),
  protocolName: 'aave',
});

export const AAVE_V3_LIDO = (networkId: NetworkNumber): AaveMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Aave v3 Prime',
  shortLabel: 'v3',
  value: AaveVersions.AaveV3Lido,
  url: 'lido',
  assets: networkId ? aaveV3AssetsLidoMarket[networkId] : [],
  provider: 'AaveV3LidoPoolAddressesProvider',
  providerAddress: getConfigContractAddress('AaveV3LidoPoolAddressesProvider', networkId),
  lendingPool: 'AaveV3LidoLendingPool',
  lendingPoolAddress: getConfigContractAddress('AaveV3LidoLendingPool', networkId),
  protocolData: 'AaveV3LidoProtocolDataProvider',
  protocolDataAddress: getConfigContractAddress('AaveV3LidoProtocolDataProvider', networkId),
  // icon: SvgAdapter(protocolIcons.aave),
  protocolName: 'aave',
});

export const AAVE_V3_ETHERFI = (networkId: NetworkNumber): AaveMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Aave v3 EtherFi',
  shortLabel: 'v3',
  value: AaveVersions.AaveV3Etherfi,
  url: 'etherfi',
  assets: networkId ? aaveV3AssetsEtherfiMarket[networkId] : [],
  provider: 'AaveV3EtherfiPoolAddressesProvider',
  providerAddress: getConfigContractAddress('AaveV3EtherfiPoolAddressesProvider', networkId),
  lendingPool: 'AaveV3EtherfiLendingPool',
  lendingPoolAddress: getConfigContractAddress('AaveV3EtherfiLendingPool', networkId),
  protocolData: 'AaveV3EtherfiProtocolDataProvider',
  protocolDataAddress: getConfigContractAddress('AaveV3EtherfiProtocolDataProvider', networkId),
  // icon: SvgAdapter(protocolIcons.aave),
  protocolName: 'aave',
});

export const AaveMarkets = (networkId: NetworkNumber) => ({
  [AaveVersions.AaveV1]: AAVE_V1,
  [AaveVersions.AaveV2]: AAVE_V2,
  [AaveVersions.AaveV3]: AAVE_V3(networkId),
  [AaveVersions.AaveV3Lido]: AAVE_V3_LIDO(networkId),
  [AaveVersions.AaveV3Etherfi]: AAVE_V3_ETHERFI(networkId),
}) as const;

export const getAaveV3MarketByMarketAddress = (marketAddress: string, network = NetworkNumber.Eth): AaveMarketInfo | undefined => {
  const markets = AaveMarkets(network);
  return Object.values(markets).find((m) => compareAddresses(m.providerAddress, marketAddress));
};
