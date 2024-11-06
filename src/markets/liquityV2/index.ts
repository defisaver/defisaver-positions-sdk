import { NetworkNumber } from '../../types/common';
import { LiquityV2MarketInfo, LiquityV2Versions } from '../../types/liquityV2';

export const LIQUITY_V2_ETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [1],
  label: 'Liquity V2 ETH',
  shortLabel: 'ETH',
  value: LiquityV2Versions.LiquityV2Eth,
  url: 'eth',
  debtToken: 'BOLD',
  collateralToken: 'ETH',
  marketAddress: '0x7d2d2c79ec89c7f1d718ae1586363ad2c56ded9d',
  protocolName: 'liquity-v2',
});

export const LIQUITY_V2_WSTETH_MARKET = (networkId: NetworkNumber = NetworkNumber.Eth): LiquityV2MarketInfo => ({
  chainIds: [1],
  label: 'Liquity V2 wstETH',
  shortLabel: 'wstETH',
  value: LiquityV2Versions.LiquityV2WstEth,
  url: 'wsteth',
  debtToken: 'BOLD',
  collateralToken: 'wstETH',
  marketAddress: '0x83b74f12a2894fcf7a4864eff6090d7d8a060c6b',
  protocolName: 'liquity-v2',
});

export const LiquityV2Markets = (networkId: NetworkNumber) => ({
  [LiquityV2Versions.LiquityV2Eth]: LIQUITY_V2_ETH_MARKET(networkId),
  [LiquityV2Versions.LiquityV2WstEth]: LIQUITY_V2_WSTETH_MARKET(networkId),
}) as const;