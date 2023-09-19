import { CompoundMarketData, CompoundVersions } from '../../compoundV3';
import { getConfigContractAddress } from '../../contracts';
import { NetworkNumber } from '../../types/common';
import { compoundV2CollateralAssets, v3ETHCollAssets, v3USDCCollAssets } from './marketsAssets';

const USDC_BULKER_OPTIONS = {
  supply: 2,
  withdraw: 5,
};

const ETH_BULKER_OPTIONS = {
  supply: '0x414354494f4e5f535550504c595f4e41544956455f544f4b454e000000000000',
  withdraw: '0x414354494f4e5f57495448445241575f4e41544956455f544f4b454e00000000',
};

export const COMPOUND_V2: CompoundMarketData = {
  chainIds: [1],
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
  bulkerOptions: { supply: '', withdraw: '' },
  // icon: SvgAdapter(protocolIcons.compound),
};

export const COMPOUND_V3_USDC = (networkId: NetworkNumber): CompoundMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Compound V3 - USDC',
  shortLabel: 'v3',
  value: CompoundVersions.CompoundV3USDC,
  baseAsset: 'USDC',
  collAssets: networkId ? v3USDCCollAssets[networkId] : [],
  baseMarket: 'cUSDCv3',
  baseMarketAddress: getConfigContractAddress('cUSDCv3', networkId),
  secondLabel: 'Market',
  bulkerName: 'CompV3USDCBulker',
  bulkerAddress: getConfigContractAddress('CompV3USDCBulker', networkId),
  bulkerOptions: USDC_BULKER_OPTIONS,
  // icon: SvgAdapter(protocolIcons.compoundv3),
});
export const COMPOUND_V3_ETH = (networkId: NetworkNumber): CompoundMarketData => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Compound V3 - ETH',
  shortLabel: 'v3',
  value: CompoundVersions.CompoundV3ETH,
  baseAsset: 'ETH',
  collAssets: networkId ? v3ETHCollAssets[networkId] : [],
  baseMarket: 'cETHv3',
  baseMarketAddress: getConfigContractAddress('cETHv3', networkId),
  secondLabel: 'Market',
  bulkerName: 'CompV3ETHBulker',
  bulkerAddress: getConfigContractAddress('CompV3ETHBulker', networkId),
  bulkerOptions: ETH_BULKER_OPTIONS,
  // icon: SvgAdapter(protocolIcons.compoundv3),
});

export const CompoundMarkets = (networkId: NetworkNumber) => ({
  [CompoundVersions.CompoundV2]: COMPOUND_V2,
  [CompoundVersions.CompoundV3ETH]: COMPOUND_V3_ETH(networkId),
  [CompoundVersions.CompoundV3USDC]: COMPOUND_V3_USDC(networkId),
}) as const;