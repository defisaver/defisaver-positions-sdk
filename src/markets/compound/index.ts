import { getConfigContractAddress } from '../../contracts';
import { CompoundBulkerOptions, CompoundMarketData, CompoundVersions } from '../../types';
import { NetworkNumber } from '../../types/common';
import {
  compoundV2CollateralAssets,
  v3ETHCollAssets,
  v3USDbCCollAssets,
  v3USDCCollAssets,
  v3USDCeCollAssets,
  v3USDTCollAssets,
} from './marketsAssets';

export {
  compoundV2CollateralAssets,
  v3ETHCollAssets,
  v3USDbCCollAssets,
  v3USDCCollAssets,
  v3USDCeCollAssets,
  v3USDTCollAssets,
};

const EMPTY_BULKER_OPTIONS: CompoundBulkerOptions = { supply: '', withdraw: '' };

const STANDARD_BULKER_OPTIONS: CompoundBulkerOptions = {
  supply: '0x414354494f4e5f535550504c595f4e41544956455f544f4b454e000000000000',
  withdraw: '0x414354494f4e5f57495448445241575f4e41544956455f544f4b454e00000000',
};

const BULKER_OPTIONS: Record<NetworkNumber, Record<CompoundVersions, CompoundBulkerOptions>> = {
  [NetworkNumber.Eth]: {
    [CompoundVersions.CompoundV3USDC]: { supply: 2, withdraw: 5 },
    [CompoundVersions.CompoundV3ETH]: STANDARD_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDT]: STANDARD_BULKER_OPTIONS,

    // Non-existing markets, keeping it because of typescript
    [CompoundVersions.CompoundV2]: EMPTY_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDCe]: EMPTY_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDbC]: EMPTY_BULKER_OPTIONS,
  },
  [NetworkNumber.Arb]: {
    [CompoundVersions.CompoundV3USDC]: STANDARD_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDCe]: STANDARD_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3ETH]: STANDARD_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDT]: STANDARD_BULKER_OPTIONS,

    // Non-existing markets, keeping it because of typescript
    [CompoundVersions.CompoundV2]: EMPTY_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDbC]: EMPTY_BULKER_OPTIONS,
  },
  [NetworkNumber.Base]: {
    [CompoundVersions.CompoundV3ETH]: STANDARD_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDbC]: STANDARD_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDC]: STANDARD_BULKER_OPTIONS,

    // Non-existing markets, keeping it because of typescript
    [CompoundVersions.CompoundV2]: EMPTY_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDCe]: EMPTY_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDT]: EMPTY_BULKER_OPTIONS,
  },
  [NetworkNumber.Opt]: {
    [CompoundVersions.CompoundV3USDC]: STANDARD_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDT]: STANDARD_BULKER_OPTIONS,
    // Non-existing markets, keeping it because of typescript
    [CompoundVersions.CompoundV3ETH]: EMPTY_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDbC]: EMPTY_BULKER_OPTIONS,
    [CompoundVersions.CompoundV2]: EMPTY_BULKER_OPTIONS,
    [CompoundVersions.CompoundV3USDCe]: EMPTY_BULKER_OPTIONS,
  },
};

export const COMPOUND_V2: CompoundMarketData = {
  chainIds: [NetworkNumber.Eth],
  label: 'Compound V2',
  shortLabel: 'v2',
  value: CompoundVersions.CompoundV2,
  baseAsset: '',
  collAssets: compoundV2CollateralAssets.map(a => a.underlyingAsset),
  baseMarket: '',
  baseMarketAddress: '',
  secondLabel: '',
  bulkerName: '',
  bulkerAddress: '',
  bulkerOptions: BULKER_OPTIONS[NetworkNumber.Eth][CompoundVersions.CompoundV2],
  // icon: SvgAdapter(protocolIcons.compound),
};

export const COMPOUND_V3_USDC = (networkId: NetworkNumber): CompoundMarketData => ({
  chainIds: [NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Base, NetworkNumber.Opt],
  label: 'Compound V3 - USDC',
  shortLabel: 'v3',
  value: CompoundVersions.CompoundV3USDC,
  baseAsset: 'USDC',
  collAssets: networkId ? v3USDCCollAssets[networkId] : [],
  baseMarket: 'cUSDCv3',
  baseMarketAddress: getConfigContractAddress('cUSDCv3', networkId),
  secondLabel: 'Market',
  bulkerName: networkId === NetworkNumber.Eth ? 'CompV3BulkerMainnetUSDC' : 'CompV3BulkerL2',
  bulkerAddress: getConfigContractAddress(networkId === NetworkNumber.Eth ? 'CompV3BulkerMainnetUSDC' : 'CompV3BulkerL2', networkId),
  bulkerOptions: BULKER_OPTIONS[networkId][CompoundVersions.CompoundV3USDC],
  // icon: SvgAdapter(protocolIcons.compoundv3),
});

export const COMPOUND_V3_USDCe = (networkId: NetworkNumber): CompoundMarketData => ({
  chainIds: [NetworkNumber.Arb],
  label: 'Compound V3 - USDC.e',
  shortLabel: 'v3',
  value: CompoundVersions.CompoundV3USDCe,
  baseAsset: 'USDC.e',
  collAssets: networkId ? v3USDCeCollAssets[networkId] : [],
  baseMarket: 'cUSDCev3',
  baseMarketAddress: getConfigContractAddress('cUSDCev3', networkId),
  secondLabel: 'Market',
  bulkerName: 'CompV3BulkerL2',
  bulkerAddress: getConfigContractAddress('CompV3BulkerL2', networkId),
  bulkerOptions: BULKER_OPTIONS[networkId][CompoundVersions.CompoundV3USDCe],
  // icon: SvgAdapter(protocolIcons.compoundv3),
});

export const COMPOUND_V3_ETH = (networkId: NetworkNumber): CompoundMarketData => ({
  chainIds: [NetworkNumber.Eth, NetworkNumber.Base, NetworkNumber.Arb],
  label: 'Compound V3 - ETH',
  shortLabel: 'v3',
  value: CompoundVersions.CompoundV3ETH,
  baseAsset: 'ETH',
  collAssets: networkId ? v3ETHCollAssets[networkId] : [],
  baseMarket: 'cETHv3',
  baseMarketAddress: getConfigContractAddress('cETHv3', networkId),
  secondLabel: 'Market',
  bulkerName: networkId === NetworkNumber.Eth ? 'CompV3BulkerMainnetETH' : 'CompV3BulkerL2',
  bulkerAddress: getConfigContractAddress(networkId === NetworkNumber.Eth ? 'CompV3BulkerMainnetETH' : 'CompV3BulkerL2', networkId),
  bulkerOptions: BULKER_OPTIONS[networkId][CompoundVersions.CompoundV3ETH],
  // icon: SvgAdapter(protocolIcons.compoundv3),
});

export const COMPOUND_V3_USDBC = (networkId: NetworkNumber): CompoundMarketData => ({
  chainIds: [NetworkNumber.Base],
  label: 'Compound V3 - USDbC',
  shortLabel: 'v3',
  value: CompoundVersions.CompoundV3USDbC,
  baseAsset: 'USDbC',
  collAssets: networkId ? v3USDbCCollAssets[networkId] : [],
  baseMarket: 'cUSDbCv3',
  baseMarketAddress: getConfigContractAddress('cUSDbCv3', networkId),
  secondLabel: 'Market',
  bulkerName: 'CompV3BulkerL2',
  bulkerAddress: getConfigContractAddress('CompV3BulkerL2', networkId),
  bulkerOptions: BULKER_OPTIONS[networkId][CompoundVersions.CompoundV3USDbC],
  // icon: SvgAdapter(protocolIcons.compoundv3),
});

export const COMPOUND_V3_USDT = (networkId: NetworkNumber): CompoundMarketData => ({
  chainIds: [NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Opt],
  label: 'Compound V3 - USDT',
  shortLabel: 'v3',
  value: CompoundVersions.CompoundV3USDT,
  baseAsset: 'USDT',
  collAssets: networkId ? v3USDTCollAssets[networkId] : [],
  baseMarket: 'cUSDTv3',
  baseMarketAddress: getConfigContractAddress('cUSDTv3', networkId),
  secondLabel: 'Market',
  bulkerName: networkId === NetworkNumber.Eth ? 'CompV3BulkerMainnetETH' : 'CompV3BulkerL2',
  bulkerAddress: getConfigContractAddress(networkId === NetworkNumber.Eth ? 'CompV3BulkerMainnetETH' : 'CompV3BulkerL2', networkId),
  bulkerOptions: BULKER_OPTIONS[networkId][CompoundVersions.CompoundV3USDT],
  // icon: SvgAdapter(protocolIcons.compoundv3),
});

export const CompoundMarkets = (networkId: NetworkNumber) => ({
  [CompoundVersions.CompoundV2]: COMPOUND_V2,
  [CompoundVersions.CompoundV3ETH]: COMPOUND_V3_ETH(networkId),
  [CompoundVersions.CompoundV3USDC]: COMPOUND_V3_USDC(networkId),
  [CompoundVersions.CompoundV3USDbC]: COMPOUND_V3_USDBC(networkId),
  [CompoundVersions.CompoundV3USDCe]: COMPOUND_V3_USDCe(networkId),
  [CompoundVersions.CompoundV3USDT]: COMPOUND_V3_USDT(networkId),
}) as const;