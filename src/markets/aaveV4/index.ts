import {
  AaveV4HubInfo, AaveV4HubsType, AaveV4SpokeInfo, AaveV4SpokesType,
} from '../../types';
import { NetworkNumber } from '../../types/common';

// SPOKES

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

// HUBS

export const AAVE_V4_CORE_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Core Hub',
  value: AaveV4HubsType.AaveV4CoreHub,
  address: '0xaD905aD5EA5B98cD50AE40Cfe368344686a21366',
});

export const AaveV4Hubs = (networkId: NetworkNumber) => ({
  [AaveV4HubsType.AaveV4CoreHub]: AAVE_V4_CORE_HUB(networkId),
}) as const;

export const getAaveV4HubTypeInfo = (type: AaveV4HubsType, network?: NetworkNumber) => ({ ...AaveV4Hubs(network ?? NetworkNumber.Eth) }[type]);

export const getAaveV4HubByAddress = (networkId: NetworkNumber, address: string): AaveV4HubInfo | undefined => Object.values(AaveV4Hubs(networkId)).find(
  hub => hub.address.toLowerCase() === address.toLowerCase(),
);
