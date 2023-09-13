
import { getConfigContractAddress } from '../contracts';
import { NetworkNumber } from '../types/common';
import { AaveMarketInfo, AaveVersions } from '../types/aave';
import { aaveV2AssetsDefaultMarket, aaveV3AssetsDefaultMarket } from './marketAssets';

// export const AAVE_V2: AaveMarketInfo = {
//   chainIds: [1],
//   label: 'Aave v2',
//   shortLabel: 'v2',
//   value: AaveVersions.AaveV2,
//   url: 'default',
//   assets: aaveV2AssetsDefaultMarket,
//   provider: 'LendingPoolAddressesProvider',
//   providerAddress: getConfigContractAddress('LendingPoolAddressesProvider', 1), // rename
//   lendingPool: 'AaveLendingPoolV2',
//   lendingPoolAddress: getConfigContractAddress('AaveLendingPoolV2', 1),
//   protocolData: 'AaveProtocolDataProvider',
//   protocolDataAddress: getConfigContractAddress('AaveProtocolDataProvider', 1),
//   // icon: SvgAdapter(protocolIcons.aave),
//   protocolName: 'aave',
// };

export const AAVE_V3 = (networkId: NetworkNumber): AaveMarketInfo => ({
  chainIds: [1, 10, 42161],
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


export const AaveMarkets = (networkId: NetworkNumber) => ({
  // [AaveVersions.AaveV2]: AAVE_V2,
  [AaveVersions.AaveV3]: AAVE_V3(networkId),
}) as const;
