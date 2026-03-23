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
  address: '0x630c2cFF89cb11E62dE047EaeD8C4B396906bD7D',
});

export const AAVE_V4_PLUS_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Plus Hub',
  value: AaveV4HubsType.AaveV4PlusHub,
  address: '0x903395aEF788bD0A3a4c7a08651a9115add7c36b',
});

export const AAVE_V4_PRIME_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Prime Hub',
  value: AaveV4HubsType.AaveV4PrimeHub,
  address: '0xf64d97bd0454DF721d0edB468265f204D3A3421D',
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
  address: '0xF1Fa1042474dC8bd4Ef830Fe70aE22C85A326729',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_ETHENA_CORRELATED_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Ethena Correlated Spoke',
  value: AaveV4SpokesType.AaveV4EthenaCorrelatedSpoke,
  url: 'ethena-correlated',
  address: '0xa1A984B65b661599a61680f56a6c864ECED96CA6',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_ETHENA_ECOSYSTEM_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Ethena Ecosystem Spoke',
  value: AaveV4SpokesType.AaveV4EthenaEcosystemSpoke,
  url: 'ethena-ecosystem',
  address: '0x417Fae379865b8E298332e2F6fdcc2526D55a090',
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
  address: '0x7ED7431793eCbe5d42D64CA9b2593d026beB051B',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_FOREX_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Forex Spoke',
  value: AaveV4SpokesType.AaveV4ForexSpoke,
  url: 'forex',
  address: '0x37b36B7dfaBB69B12519B7Faaf019a6C0B261264',
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
  address: '0x332EFa0E2121091Ae94f44F8c2C383B061ae2Ea7',
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
  address: '0xC8FA3983843E7a978244e34c0e2562159A3D0783',
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
  address: '0xa9Dd188591A6F0C92bD1dC3A461a64c188694FB3',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AAVE_V4_LOMBARD_BTC_SPOKE = (networkId: NetworkNumber): AaveV4SpokeInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Lombard BTC Spoke',
  value: AaveV4SpokesType.AaveV4LombardBtcSpoke,
  url: 'lombard-btc',
  address: '0xc78F5e5566C9Bde0C531fC8c7F5dC5954daFcA9e',
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
  address: '0x6488A415e9eA693EC7Ef32579507e1907c0AC798',
  hubs: [
    AAVE_V4_CORE_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PLUS_HUB(NetworkNumber.Eth).address,
    AAVE_V4_PRIME_HUB(NetworkNumber.Eth).address,
  ],
});

export const AaveV4Spokes = (networkId: NetworkNumber) => ({
  [AaveV4SpokesType.AaveV4BluechipSpoke]: AAVE_V4_BLUECHIP_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4EthenaCorrelatedSpoke]: AAVE_V4_ETHENA_CORRELATED_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4EthenaEcosystemSpoke]: AAVE_V4_ETHENA_ECOSYSTEM_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4EtherfiSpoke]: AAVE_V4_ETHERFI_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4ForexSpoke]: AAVE_V4_FOREX_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4GoldSpoke]: AAVE_V4_GOLD_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4KelpSpoke]: AAVE_V4_KELP_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4LidoSpoke]: AAVE_V4_LIDO_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4LombardBtcSpoke]: AAVE_V4_LOMBARD_BTC_SPOKE(networkId),
  [AaveV4SpokesType.AaveV4MainSpoke]: AAVE_V4_MAIN_SPOKE(networkId),
}) as const;

export const getAaveV4SpokeTypeInfo = (type: AaveV4SpokesType, network?: NetworkNumber) => ({ ...AaveV4Spokes(network ?? NetworkNumber.Eth) }[type]);


