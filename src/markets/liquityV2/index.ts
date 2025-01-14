import { NetworkNumber } from '../../types/common';
import { LiquityV2MarketInfo, LiquityV2Versions } from '../../types/liquityV2';

export const LIQUITY_V2_ETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 ETH',
  shortLabel: 'ETH',
  value: LiquityV2Versions.LiquityV2Eth,
  url: 'eth',
  debtToken: 'BOLD',
  collateralToken: 'ETH',
  marketAddress: '0xc3fe668b43439525f70fe860f89882f0be312504',
  protocolName: 'liquity-v2',
});

export const LIQUITY_V2_WSTETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 wstETH',
  shortLabel: 'wstETH',
  value: LiquityV2Versions.LiquityV2WstEth,
  url: 'wsteth',
  debtToken: 'BOLD',
  collateralToken: 'wstETH',
  marketAddress: '0x9b27787ff66aa3cea8dbc47772328459a1fa05ac',
  protocolName: 'liquity-v2',
});

export const LIQUITY_V2_RETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Liquity V2 rETH',
  shortLabel: 'rETH',
  value: LiquityV2Versions.LiquityV2REth,
  url: 'reth',
  debtToken: 'BOLD',
  collateralToken: 'rETH',
  marketAddress: '0xde524be191de806011e98c8d36d50d7a88391a3e',
  protocolName: 'liquity-v2',
});

export const LiquityV2Markets = (networkId: NetworkNumber) => ({
  [LiquityV2Versions.LiquityV2Eth]: LIQUITY_V2_ETH_MARKET(networkId),
  [LiquityV2Versions.LiquityV2WstEth]: LIQUITY_V2_WSTETH_MARKET(networkId),
  [LiquityV2Versions.LiquityV2REth]: LIQUITY_V2_RETH_MARKET(networkId),
}) as const;