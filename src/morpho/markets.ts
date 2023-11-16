import {morphoAaveV2AssetDefaultMarket, morphoAaveV3AssetEthMarket} from "../markets/aave/marketAssets";
import {getConfigContractAddress} from "../contracts";
import {AaveMarketInfo, AaveVersions} from "../types/aave";
import {NetworkNumber} from "../types/common";

export const MORPHO_AAVE_V2: AaveMarketInfo = {
  chainIds: [1],
  label: 'Morpho-Aave V2',
  shortLabel: 'morpho-aave-v2',
  value: AaveVersions.MorphoAaveV2,
  url: '',
  assets: morphoAaveV2AssetDefaultMarket,
  provider: 'LendingPoolAddressesProvider',
  providerAddress: getConfigContractAddress('LendingPoolAddressesProvider', 1), // rename
  protocolData: 'AaveProtocolDataProvider',
  protocolDataAddress: getConfigContractAddress('AaveProtocolDataProvider', 1),
  lendingPool: 'AaveLendingPoolV2',
  lendingPoolAddress: getConfigContractAddress('MorphoAaveV2Proxy', 1),
  // icon: SvgAdapter(protocolIcons.morpho),
  protocolName: 'morpho',
};

export const MORPHO_AAVE_V3_ETH = (networkId: NetworkNumber = NetworkNumber.Eth): AaveMarketInfo => ({
  chainIds: [1],
  label: 'Morpho-Aave V3',
  shortLabel: 'morpho-aave-v3',
  subVersionLabel: 'ETH Optimizer',
  value: AaveVersions.MorphoAaveV3Eth,
  url: 'eth-optimizer',
  assets: morphoAaveV3AssetEthMarket,
  provider: 'AaveV3PoolAddressesProvider',
  providerAddress: getConfigContractAddress('AaveV3PoolAddressesProvider', networkId), // TODO - check if used and if value is good?
  protocolData: 'AaveV3ProtocolDataProvider',
  protocolDataAddress: getConfigContractAddress('AaveV3ProtocolDataProvider', networkId),
  lendingPool: 'MorphoAaveV3ProxyEthMarket',
  lendingPoolAddress: getConfigContractAddress('MorphoAaveV3ProxyEthMarket', networkId),
  // icon: SvgAdapter(protocolIcons.morpho),
  protocolName: 'morpho',
});
