import { getConfigContractAddress } from '../../contracts';
import { compareAddresses } from '../../services/utils';
import {
  AaveMarketInfo, AaveVersions, MorphoAaveV2MarketInfo, MorphoAaveV3MarketInfo,
} from '../../types';
import { NetworkNumber } from '../../types/common';
import {
  aaveV1AssetsDefaultMarket, aaveV2AssetsDefaultMarket, aaveV3AssetsDefaultMarket, aaveV3AssetsEtherfiMarket, aaveV3AssetsLidoMarket, morphoAaveV2AssetDefaultMarket, morphoAaveV3AssetEthMarket,
} from './marketAssets';

export {
  aaveV1AssetsDefaultMarket,
  aaveV2AssetsDefaultMarket,
  aaveV3AssetsDefaultMarket,
  morphoAaveV2AssetDefaultMarket,
  morphoAaveV3AssetEthMarket,
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
  label: 'Aave v3',
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
  label: 'Aave v3 Lido',
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

export const MORPHO_AAVE_V2: MorphoAaveV2MarketInfo = {
  chainIds: [1],
  label: 'Morpho-Aave V2',
  shortLabel: 'morpho-aave-v2',
  value: AaveVersions.MorphoAaveV2,
  url: '',
  assets: morphoAaveV2AssetDefaultMarket,
  providerAddress: getConfigContractAddress('LendingPoolAddressesProvider', 1),
  lendingPoolAddress: getConfigContractAddress('MorphoAaveV2Proxy', 1),
  // icon: SvgAdapter(protocolIcons.morpho),
  protocolName: 'morpho',
};

export const MORPHO_AAVE_V3_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): MorphoAaveV3MarketInfo => ({
  chainIds: [1],
  label: 'Morpho-Aave V3',
  shortLabel: 'morpho-aave-v3',
  subVersionLabel: 'ETH Optimizer',
  value: AaveVersions.MorphoAaveV3Eth,
  url: 'eth-optimizer',
  assets: morphoAaveV3AssetEthMarket,
  providerAddress: getConfigContractAddress('AaveV3PoolAddressesProvider', networkId), // TODO - check if used and if value is good?
  protocolData: 'AaveV3ProtocolDataProvider',
  protocolDataAddress: getConfigContractAddress('AaveV3ProtocolDataProvider', networkId),
  aaveLendingPool: 'AaveV3LendingPool',
  aaveLendingPoolAddress: getConfigContractAddress('AaveV3LendingPool', networkId),
  lendingPool: 'MorphoAaveV3ProxyEthMarket',
  lendingPoolAddress: getConfigContractAddress('MorphoAaveV3ProxyEthMarket', 1),
  // icon: SvgAdapter(protocolIcons.morpho),
  protocolName: 'morpho',
});


export const AaveMarkets = (networkId: NetworkNumber) => ({
  [AaveVersions.AaveV1]: AAVE_V1,
  [AaveVersions.AaveV2]: AAVE_V2,
  [AaveVersions.AaveV3]: AAVE_V3(networkId),
  [AaveVersions.AaveV3Lido]: AAVE_V3_LIDO(networkId),
  [AaveVersions.AaveV3Etherfi]: AAVE_V3_ETHERFI(networkId),
  [AaveVersions.MorphoAaveV3Eth]: MORPHO_AAVE_V3_ETH(networkId),
  [AaveVersions.MorphoAaveV2]: MORPHO_AAVE_V2,
}) as const;

export const getAaveV3MarketByMarketAddress = (marketAddress: string, network = NetworkNumber.Eth): AaveMarketInfo | MorphoAaveV2MarketInfo | MorphoAaveV3MarketInfo | undefined => {
  const markets = AaveMarkets(network);
  return Object.values(markets).filter((m) => (![AaveVersions.MorphoAaveV3Eth, AaveVersions.MorphoAaveV2].includes(m.value))).find((m) => compareAddresses(m.providerAddress, marketAddress));
};
