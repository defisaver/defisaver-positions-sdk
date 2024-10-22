import { NetworkNumber } from '../../types/common';
import { LiquityV2MarketInfo, LiquityV2Versions } from '../../types/liquityV2';

export const LIQUITY_V2_ETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [1],
  label: 'Liquity V2',
  shortLabel: 'ETH',
  value: LiquityV2Versions.LiquityV2Eth,
  url: 'eth',
  debtToken: 'BOLD',
  collateralToken: 'ETH',
  marketAddress: '0xd7199b16945f1ebaa0b301bf3d05bf489caa408b',
  protocolName: 'liquity-v2',
});

export const LIQUITY_V2_WSTETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [1],
  label: 'Liquity V2',
  shortLabel: 'wstETH',
  value: LiquityV2Versions.LiquityV2WstEth,
  url: 'wsteth',
  debtToken: 'BOLD',
  collateralToken: 'wstETH',
  marketAddress: '0x0d22113a543826eeaf2ae0fc9d10aea66efba156',
  protocolName: 'liquity-v2',
});

export const LiquityV2Markets = (networkId: NetworkNumber) => ({
  [LiquityV2Versions.LiquityV2Eth]: LIQUITY_V2_ETH_MARKET(networkId),
  [LiquityV2Versions.LiquityV2WstEth]: LIQUITY_V2_WSTETH_MARKET(networkId),
}) as const;