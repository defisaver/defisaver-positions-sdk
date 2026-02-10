import {
  AaveV4HubInfo,
  AaveV4HubsType,
  AaveV4SpokeInfo,
  AaveV4SpokesType,
  NetworkNumber,
} from '../../types';

// HUBS

export const AAVE_V4_CORE_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Core Hub',
  value: AaveV4HubsType.AaveV4CoreHub,
  address: '0xaD905aD5EA5B98cD50AE40Cfe368344686a21366',
});

export const AAVE_V4_YIELD_SEEKING_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Yield Seeking Hub',
  value: AaveV4HubsType.AaveV4YieldSeekingHub,
  address: '0x86F37ba3b480c5fE22A7eb1ba2B2D49c94089FBB',
});

export const AaveV4Hubs = (networkId: NetworkNumber) => ({
  [AaveV4HubsType.AaveV4CoreHub]: AAVE_V4_CORE_HUB(networkId),
  [AaveV4HubsType.AaveV4YieldSeekingHub]: AAVE_V4_YIELD_SEEKING_HUB(networkId),
}) as const;

export const getAaveV4HubTypeInfo = (type: AaveV4HubsType, network?: NetworkNumber) => ({ ...AaveV4Hubs(network ?? NetworkNumber.Eth) }[type]);

export const getAaveV4HubByAddress = (networkId: NetworkNumber, address: string): AaveV4HubInfo | undefined => Object.values(AaveV4Hubs(networkId)).find(
  hub => hub.address.toLowerCase() === address.toLowerCase(),
);

// SPOKES

export const AAVE_V4_CORE_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Core Spoke',
  value: AaveV4SpokesType.AaveV4CoreSpoke,
  url: 'core',
  address: '0xBa97c5E52cd5BC3D7950Ae70779F8FfE92d40CdC',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_YIELD_SEEKING_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Yield Seeking Spoke',
  value: AaveV4SpokesType.AaveV4YieldSeekingSpoke,
  url: 'yield-seeking',
  address: '0x2559e4e04f2ca7180e5f20c2872d22ec89601b56',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_YIELD_SEEKING_HUB(NetworkNumber.Eth).address,
  ],
});

export const AaveV4Spokes = (networkId: NetworkNumber) => ({
  [AaveV4SpokesType.AaveV4CoreSpoke]: AAVE_V4_CORE_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4YieldSeekingSpoke]: AAVE_V4_YIELD_SEEKING_SPOKE(networkId),
}) as const;

export const getAaveV4SpokeTypeInfo = (type: AaveV4SpokesType, network?: NetworkNumber) => ({ ...AaveV4Spokes(network ?? NetworkNumber.Eth) }[type]);


