import { compareAddresses } from '../../services/utils';
import { EthAddress, NetworkNumber } from '../../types/common';
import { LiquityV2MarketInfo, LiquityV2Versions } from '../../types/liquityV2';

export const LIQUITY_V2_ETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 ETH',
  shortLabel: 'ETH',
  value: LiquityV2Versions.LiquityV2Eth,
  url: 'eth',
  debtToken: 'BOLD',
  collateralToken: 'ETH',
  marketAddress: '0xde524be191de806011e98c8d36d50d7a88391a3e',
  protocolName: 'liquity-v2',
  isLegacy: false,
});

export const LIQUITY_V2_WSTETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 wstETH',
  shortLabel: 'wstETH',
  value: LiquityV2Versions.LiquityV2WstEth,
  url: 'wsteth',
  debtToken: 'BOLD',
  collateralToken: 'wstETH',
  marketAddress: '0x1649ccb966c90ff524a15231bc177d77a275fda1',
  protocolName: 'liquity-v2',
  isLegacy: false,
});

export const LIQUITY_V2_RETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 rETH',
  shortLabel: 'rETH',
  value: LiquityV2Versions.LiquityV2REth,
  url: 'reth',
  debtToken: 'BOLD',
  collateralToken: 'rETH',
  marketAddress: '0x6809ac46fa55e4d86be368c589427684616f91c2',
  protocolName: 'liquity-v2',
  isLegacy: false,
});

// Legacy markets

export const LIQUITY_V2_ETH_LEGACY_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 ETH Legacy',
  shortLabel: 'ETH Legacy',
  value: LiquityV2Versions.LiquityV2EthLegacy,
  url: 'eth-legacy',
  debtToken: 'BOLD Legacy',
  collateralToken: 'ETH',
  marketAddress: '0x38e1f07b954cfab7239d7acab49997fbaad96476',
  protocolName: 'liquity-v2',
  isLegacy: true,
});

export const LIQUITY_V2_WSTETH_LEGACY_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 wstETH Legacy',
  shortLabel: 'wstETH Legacy',
  value: LiquityV2Versions.LiquityV2WstEthLegacy,
  url: 'wsteth-legacy',
  debtToken: 'BOLD Legacy',
  collateralToken: 'wstETH',
  marketAddress: '0x2d4ef56cb626e9a4c90c156018ba9ce269573c61',
  protocolName: 'liquity-v2',
  isLegacy: true,
});

export const LIQUITY_V2_RETH_LEGACY_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 rETH Legacy',
  shortLabel: 'rETH Legacy',
  value: LiquityV2Versions.LiquityV2REthLegacy,
  url: 'reth-legacy',
  debtToken: 'BOLD Legacy',
  collateralToken: 'rETH',
  marketAddress: '0x3b48169809dd827f22c9e0f2d71ff12ea7a94a2f',
  protocolName: 'liquity-v2',
  isLegacy: true,
});

export const LiquityV2Markets = (networkId: NetworkNumber) => ({
  [LiquityV2Versions.LiquityV2Eth]: LIQUITY_V2_ETH_MARKET(networkId),
  [LiquityV2Versions.LiquityV2WstEth]: LIQUITY_V2_WSTETH_MARKET(networkId),
  [LiquityV2Versions.LiquityV2REth]: LIQUITY_V2_RETH_MARKET(networkId),
  // Legacy
  [LiquityV2Versions.LiquityV2EthLegacy]: LIQUITY_V2_ETH_LEGACY_MARKET(networkId),
  [LiquityV2Versions.LiquityV2WstEthLegacy]: LIQUITY_V2_WSTETH_LEGACY_MARKET(networkId),
  [LiquityV2Versions.LiquityV2REthLegacy]: LIQUITY_V2_RETH_LEGACY_MARKET(networkId),
}) as const;

export const findLiquityV2MarketByAddress = (marketAddress: EthAddress) => {
  const markets = LiquityV2Markets(NetworkNumber.Eth);
  for (const market of Object.values(markets)) {
    if (compareAddresses(market.marketAddress, marketAddress)) {
      return market;
    }
  }
  return null;
};