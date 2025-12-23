import { AaveV4SpokeInfo, AaveV4SpokesType } from '../../types';
import { NetworkNumber } from '../../types/common';

export const AAVE_V4_CORE_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Core Spoke',
  value: AaveV4SpokesType.AaveV4CoreSpoke,
  url: 'core',
  address: '0xBa97c5E52cd5BC3D7950Ae70779F8FfE92d40CdC',
  hubs: [
    '0xaD905aD5EA5B98cD50AE40Cfe368344686a21366',
  ],
});

export const AaveV4Spokes = (networkId: NetworkNumber) => ({
  [AaveV4SpokesType.AaveV4CoreSpoke]: AAVE_V4_CORE_SPOKE(networkId),
}) as const;

export const getAaveV4SpokeTypeInfo = (type: AaveV4SpokesType, network?: NetworkNumber) => ({ ...AaveV4Spokes(network ?? NetworkNumber.Eth) }[type]);