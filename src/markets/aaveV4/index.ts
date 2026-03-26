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
  address: '0xCca852Bc40e560adC3b1Cc58CA5b55638ce826c9',
});

export const AAVE_V4_PLUS_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Plus Hub',
  value: AaveV4HubsType.AaveV4PlusHub,
  address: '0x06002e9c4412CB7814a791eA3666D905871E536A',
});

export const AAVE_V4_PRIME_HUB = (networkId: NetworkNumber): AaveV4HubInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Prime Hub',
  value: AaveV4HubsType.AaveV4PrimeHub,
  address: '0x943827DCA022D0F354a8a8c332dA1e5Eb9f9F931',
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
  address: '0x973a023A77420ba610f06b3858aD991Df6d85A08',
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
  address: '0x58131E79531caB1d52301228d1f7b842F26B9649',
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
  address: '0xba1B3D55D249692b669A164024A838309B7508AF',
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
  address: '0xbF10BDfE177dE0336aFD7fcCF80A904E15386219',
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
  address: '0xD8B93635b8C6d0fF98CbE90b5988E3F2d1Cd9da1',
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
  address: '0x65407b940966954b23dfA3caA5C0702bB42984DC',
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
  address: '0x3131FE68C4722e726fe6B2819ED68e514395B9a4',
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
  address: '0xe1900480ac69f0B296841Cd01cC37546d92F35Cd',
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
  address: '0x7EC68b5695e803e98a21a9A05d744F28b0a7753D',
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
  address: '0x94e7A5dCbE816e498b89aB752661904E2F56c485',
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


