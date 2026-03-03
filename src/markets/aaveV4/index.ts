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
  address: '0x8b5aABDbf90744FA259fa7A708c00fF5Cf43FD75',
});

export const AAVE_V4_PLUS_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Plus Hub',
  value: AaveV4HubsType.AaveV4PlusHub,
  address: '0xDf488F18631Ff7DcF39Ab305C9BE5AeC06F673d0',
});

export const AAVE_V4_PRIME_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Prime Hub',
  value: AaveV4HubsType.AaveV4PrimeHub,
  address: '0xaa605F00a695fE90f4818CcB11C0daF22e23Aa69',
});

export const AaveV4Hubs = (networkId: NetworkNumber) => ({
  [AaveV4HubsType.AaveV4CoreHub]: AAVE_V4_CORE_HUB(networkId),
  [AaveV4HubsType.AaveV4PlusHub]: AAVE_V4_PLUS_HUB(networkId),
  [AaveV4HubsType.AaveV4PrimeHub]: AAVE_V4_PRIME_HUB(networkId),
}) as const;

export const getAaveV4HubTypeInfo = (type: AaveV4HubsType, network?: NetworkNumber) => ({ ...AaveV4Hubs(network ?? NetworkNumber.Eth) }[type]);

export const getAaveV4HubByAddress = (networkId: NetworkNumber, address: string): AaveV4HubInfo | undefined => Object.values(AaveV4Hubs(networkId)).find(
  hub => hub.address.toLowerCase() === address.toLowerCase(),
);

// SPOKES

export const AAVE_V4_BLUECHIP_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Bluechip Spoke',
  value: AaveV4SpokesType.AaveV4BluechipSpoke,
  url: 'bluechip',
  address: '0xe8344a3A199Cb995241BEcD6129a93Cc128f24ca',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_ETHENA_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Ethena Spoke',
  value: AaveV4SpokesType.AaveV4EthenaSpoke,
  url: 'ethena',
  address: '0x57893f96d25f7125211d797bC39972b629572b2c',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_ETHERFI_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Etherfi Spoke',
  value: AaveV4SpokesType.AaveV4EtherfiSpoke,
  url: 'etherfi',
  address: '0xFC2685999D5a1d15AAEf0E73426673829A483cA6',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_GOLD_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Gold Spoke',
  value: AaveV4SpokesType.AaveV4GoldSpoke,
  url: 'gold',
  address: '0x4b8A81E96dcbD21Aaf6bd32E03Bd0c64b8a2E6Fa',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_KELP_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Kelp Spoke',
  value: AaveV4SpokesType.AaveV4KelpSpoke,
  url: 'kelp',
  address: '0x4a2A38377cC85BFd8548a4C9AC71DBb245dc9A9D',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_LIDO_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Lido Spoke',
  value: AaveV4SpokesType.AaveV4LidoSpoke,
  url: 'lido',
  address: '0x4f7202367f72ADae87393c3e49b3Fbc353a9110D',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_MAIN_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Main Spoke',
  value: AaveV4SpokesType.AaveV4MainSpoke,
  url: 'main',
  address: '0x5738d9cB82d6a1617973C257D05A387bF5568F47',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AaveV4Spokes = (networkId: NetworkNumber) => ({
  [AaveV4SpokesType.AaveV4BluechipSpoke]: AAVE_V4_BLUECHIP_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4EthenaSpoke]: AAVE_V4_ETHENA_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4EtherfiSpoke]: AAVE_V4_ETHERFI_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4GoldSpoke]: AAVE_V4_GOLD_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4KelpSpoke]: AAVE_V4_KELP_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4LidoSpoke]: AAVE_V4_LIDO_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4MainSpoke]: AAVE_V4_MAIN_SPOKE(networkId),
}) as const;

export const getAaveV4SpokeTypeInfo = (type: AaveV4SpokesType, network?: NetworkNumber) => ({ ...AaveV4Spokes(network ?? NetworkNumber.Eth) }[type]);


