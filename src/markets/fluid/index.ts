import { NetworkNumber } from '../../types/common';
import {
  FluidArbitrumVersion,
  FluidBaseVersions,
  FluidMainnetVersion,
  FluidMarketInfo,
  FluidVersions,
} from '../../types';

export const ETH_USDC_1 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'ETH / USDC Market 1',
  shortLabel: 'ETH/USDC',
  value: FluidMainnetVersion.ETH_USDC_1,
  url: 'eth-usdc-1',
  id: 1,
  marketAddress: '0xeAbBfca72F8a8bf14C4ac59e69ECB2eB69F0811C',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'USDC',
});

export const ETH_USDT_2 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'ETH / USDT Market 2',
  shortLabel: 'ETH/USDT',
  value: FluidMainnetVersion.ETH_USDT_2,
  url: 'eth-usdt-2',
  marketAddress: '0xbEC491FeF7B4f666b270F9D5E5C3f443cBf20991',
  id: 2,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'USDT',
});

export const WSTETH_ETH_3 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / ETH Market 3',
  shortLabel: 'wstETH/ETH',
  value: FluidMainnetVersion.WSTETH_ETH_3,
  url: 'wsteth-eth-3',
  marketAddress: '0xA0F83Fc5885cEBc0420ce7C7b139Adc80c4F4D91',
  id: 3,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'ETH',
});

export const WSTETH_USDC_4 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / USDC Market 4',
  shortLabel: 'wstETH/USDC',
  value: FluidMainnetVersion.WSTETH_USDC_4,
  url: 'wsteth-usdc-4',
  marketAddress: '0x51197586F6A9e2571868b6ffaef308f3bdfEd3aE',
  id: 4,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'USDC',
});

export const WSTETH_USDT_5 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / USDT Market 5',
  shortLabel: 'wstETH/USDT',
  value: FluidMainnetVersion.WSTETH_USDT_5,
  url: 'wsteth-usdt-5',
  marketAddress: '0x1c2bB46f36561bc4F05A94BD50916496aa501078',
  id: 5,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'USDT',
});

export const WEETH_WSTETH_6 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / wstETH Market 6',
  shortLabel: 'weETH/wstETH',
  value: FluidMainnetVersion.WEETH_WSTETH_6,
  url: 'weeth-wsteth-6',
  marketAddress: '0x40D9b8417E6E1DcD358f04E3328bCEd061018A82',
  id: 6,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'wstETH',
});

export const SUSDE_USDC_7 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'sUSDe / USDC Market 7',
  shortLabel: 'sUSDe/USDC',
  value: FluidMainnetVersion.SUSDE_USDC_7,
  url: 'susde-usdc-7',
  marketAddress: '0x4045720a33193b4Fe66c94DFbc8D37B0b4D9B469',
  id: 7,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'sUSDe',
  debtAsset: 'USDC',
});

export const SUSDE_USDT_8 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'sUSDe / USDT Market 8',
  shortLabel: 'sUSDe/USDT',
  value: FluidMainnetVersion.SUSDE_USDT_8,
  url: 'susde-usdt-8',
  marketAddress: '0xBFADEA65591235f38809076e14803Ac84AcF3F97',
  id: 8,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'sUSDe',
  debtAsset: 'USDT',
});

export const WEETH_USDC_9 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / USDC Market 9',
  shortLabel: 'weETH/USDC',
  value: FluidMainnetVersion.WEETH_USDC_9,
  url: 'weeth-usdc-9',
  marketAddress: '0xf55B8e9F0c51Ace009f4b41d03321675d4C643b3',
  id: 9,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'USDC',
});

export const WEETH_USDT_10 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / USDT Market 10',
  shortLabel: 'weETH/USDT',
  value: FluidMainnetVersion.WEETH_USDT_10,
  url: 'weeth-usdt-10',
  marketAddress: '0xdF16AdaF80584b2723F3BA1Eb7a601338Ba18c4e',
  id: 10,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'USDT',
});

export const ETH_USDC_11 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'ETH / USDC Market 11',
  shortLabel: 'ETH/USDC',
  value: FluidMainnetVersion.ETH_USDC_11,
  url: 'eth-usdc-11',
  marketAddress: '0x0C8C77B7FF4c2aF7F6CEBbe67350A490E3DD6cB3',
  id: 11,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'USDC',
});

export const ETH_USDT_12 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'ETH / USDT Market 12',
  shortLabel: 'ETH/USDT',
  value: FluidMainnetVersion.ETH_USDT_12,
  url: 'eth-usdt-12',
  marketAddress: '0xE16A6f5359ABB1f61cE71e25dD0932e3E00B00eB',
  id: 12,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'USDT',
});

export const WSTETH_ETH_13 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / ETH Market 13',
  shortLabel: 'wstETH/ETH',
  value: FluidMainnetVersion.WSTETH_ETH_13,
  url: 'wsteth-eth-13',
  marketAddress: '0x82B27fA821419F5689381b565a8B0786aA2548De',
  id: 13,
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'ETH',
});

export const WSTETH_USDC_14 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / USDC Market 14',
  shortLabel: 'wstETH/USDC',
  value: FluidMainnetVersion.WSTETH_USDC_14,
  url: 'wsteth-usdc-14',
  id: 14,
  marketAddress: '0x1982CC7b1570C2503282d0A0B41F69b3B28fdcc3',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'USDC',
});

export const WSTETH_USDT_15 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / USDT Market 15',
  shortLabel: 'wstETH/USDT',
  value: FluidMainnetVersion.WSTETH_USDT_15,
  url: 'wsteth-usdt-15',
  id: 15,
  marketAddress: '0xb4F3bf2d96139563777C0231899cE06EE95Cc946',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'USDT',
});

export const WEETH_WSTETH_16 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / wstETH Market 16',
  shortLabel: 'weETH/wstETH',
  value: FluidMainnetVersion.WEETH_WSTETH_16,
  url: 'weeth-wsteth-16',
  id: 16,
  marketAddress: '0xeAEf563015634a9d0EE6CF1357A3b205C35e028D',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'wstETH',
});

export const SUSDE_USDC_17 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'sUSDe / USDC Market 17',
  shortLabel: 'sUSDe/USDC',
  value: FluidMainnetVersion.SUSDE_USDC_17,
  url: 'susde-usdc-17',
  id: 17,
  marketAddress: '0x3996464c0fCCa8183e13ea5E5e74375e2c8744Dd',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'sUSDe',
  debtAsset: 'USDC',
});

export const SUSDE_USDT_18 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'sUSDe / USDT Market 18',
  shortLabel: 'sUSDe/USDT',
  value: FluidMainnetVersion.SUSDE_USDT_18,
  url: 'susde-usdt-18',
  id: 18,
  marketAddress: '0xBc345229C1b52e4c30530C614BB487323BA38Da5',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'sUSDe',
  debtAsset: 'USDT',
});

export const WEETH_USDC_19 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / USDC Market 19',
  shortLabel: 'weETH/USDC',
  value: FluidMainnetVersion.WEETH_USDC_19,
  url: 'weeth-usdc-19',
  id: 19,
  marketAddress: '0xF2c8F54447cbd591C396b0Dd7ac15FAF552d0FA4',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'USDC',
});

export const WEETH_USDT_20 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / USDT Market 20',
  shortLabel: 'weETH/USDT',
  value: FluidMainnetVersion.WEETH_USDT_20,
  url: 'weeth-usdt-20',
  id: 20,
  marketAddress: '0x92643E964CA4b2c165a95CA919b0A819acA6D5F1',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'USDT',
});

export const WBTC_USDC_21 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'WBTC / USDC Market 21',
  shortLabel: 'WBTC/USDC',
  value: FluidMainnetVersion.WBTC_USDC_21,
  url: 'wbtc-usdc-21',
  id: 21,
  marketAddress: '0x6F72895Cf6904489Bcd862c941c3D02a3eE4f03e',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'WBTC',
  debtAsset: 'USDC',
});

export const WBTC_USDT_22 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'WBTC / USDT Market 22',
  shortLabel: 'WBTC/USDT',
  value: FluidMainnetVersion.WBTC_USDT_22,
  url: 'wbtc-usdt-22',
  id: 22,
  marketAddress: '0x3A0b7c8840D74D39552EF53F586dD8c3d1234C40',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'WBTC',
  debtAsset: 'USDT',
});

export const WBTC_ETH_23 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'WBTC / ETH Market 23',
  shortLabel: 'WBTC/ETH',
  value: FluidMainnetVersion.WBTC_ETH_23,
  url: 'wbtc-eth-23',
  id: 23,
  marketAddress: '0xaD439b9D61b25af1ca4Cd211E3eCb9AfBaAEd84a',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'WBTC',
  debtAsset: 'ETH',
});

export const ETH_WBTC_24 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'ETH / WBTC Market 24',
  shortLabel: 'ETH/WBTC',
  value: FluidMainnetVersion.ETH_WBTC_24,
  url: 'eth-wbtc-24',
  id: 24,
  marketAddress: '0x991416539E9DA46db233bCcbaEA38C4f852776D4',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'WBTC',
});

export const WSTETH_WBTC_25 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / WBTC Market 25',
  shortLabel: 'wstETH/WBTC',
  value: FluidMainnetVersion.WSTETH_WBTC_25,
  url: 'wsteth-wbtc-25',
  id: 25,
  marketAddress: '0x03271C337c86a6Fd89625A2820e48621DC2a128b',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'WBTC',
});

export const WEETH_WBTC_26 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / WBTC Market 26',
  shortLabel: 'weETH/WBTC',
  value: FluidMainnetVersion.WEETH_WBTC_26,
  url: 'weeth-wbtc-26',
  id: 26,
  marketAddress: '0xF74cb9D69ada3559903149CFD60fD57cEAF95F30',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'WBTC',
});

export const WEETHS_WSTETH_27 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETHs / wstETH Market 27',
  shortLabel: 'weETHs/wstETH',
  value: FluidMainnetVersion.WEETHS_WSTETH_27,
  url: 'weeths-wsteth-27',
  id: 27,
  marketAddress: '0x1c6068eC051f0Ac1688cA1FE76810FA9c8644278',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETHs',
  debtAsset: 'wstETH',
});

export const CBBTC_ETH_28 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'cbBTC / ETH Market 28',
  shortLabel: 'cbBTC/ETH',
  value: FluidMainnetVersion.CBBTC_ETH_28,
  url: 'cbbtc-eth-28',
  id: 28,
  marketAddress: '0x5dae640956711E11016C1b27CF9968Ba5B4a69CC',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'cbBTC',
  debtAsset: 'ETH',
});

export const CBBTC_USDC_29 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'cbBTC / USDC Market 29',
  shortLabel: 'cbBTC/USDC',
  value: FluidMainnetVersion.CBBTC_USDC_29,
  url: 'cbbtc-usdc-29',
  id: 29,
  marketAddress: '0x01c7c1c41dea58b043e700eFb23Dc077F12a125e',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'cbBTC',
  debtAsset: 'USDC',
});

export const CBBTC_USDT_30 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'cbBTC / USDT Market 30',
  shortLabel: 'cbBTC/USDT',
  value: FluidMainnetVersion.CBBTC_USDT_30,
  url: 'cbbtc-usdt-30',
  id: 30,
  marketAddress: '0xE6b5D1CdC4935295c84772C4700932b4BFC93274',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'cbBTC',
  debtAsset: 'USDT',
});

export const ETH_CBBTC_31 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'ETH / cbBTC Market 31',
  shortLabel: 'ETH/cbBTC',
  value: FluidMainnetVersion.ETH_CBBTC_31,
  url: 'eth-cbbtc-31',
  id: 31,
  marketAddress: '0x69deb634Edc47A35B7b05056768d957F029Cbc0A',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'cbBTC',
});

export const WEETH_CBBTC_32 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / cbBTC Market 32',
  shortLabel: 'weETH/cbBTC',
  value: FluidMainnetVersion.WEETH_CBBTC_32,
  url: 'weeth-cbbtc-32',
  id: 32,
  marketAddress: '0xB242508306db9A52932a754D2F408Ca0cb479135',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'cbBTC',
});

export const WSTETH_CBBTC_33 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / cbBTC Market 33',
  shortLabel: 'wstETH/cbBTC',
  value: FluidMainnetVersion.WSTETH_CBBTC_33,
  url: 'wsteth-cbbtc-33',
  id: 33,
  marketAddress: '0x6E0cDB09eb33cD3894C905E0DFF9289b95a86FFF',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'cbBTC',
});

export const WSTETH_ETH_WSTETH_ETH_44 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / ETH Market 44',
  shortLabel: 'wstETH/ETH',
  value: FluidMainnetVersion.WSTETH_ETH_WSTETH_ETH_44,
  url: 'wsteth-eth-wsteth-eth-44',
  id: 44,
  marketAddress: '0x528CF7DBBff878e02e48E83De5097F8071af768D',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'ETH',
});

export const ETH_USDC_USDT_45 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'ETH / USDC Market 45',
  shortLabel: 'ETH/USDC',
  value: FluidMainnetVersion.ETH_USDC_USDT_45,
  url: 'eth-usdc-usdt-45',
  id: 45,
  marketAddress: '0x3E11B9aEb9C7dBbda4DD41477223Cc2f3f24b9d7',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'USDC',
});

export const WSTETH_USDC_USDT_46 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / USDC Market 46',
  shortLabel: 'wstETH/USDC',
  value: FluidMainnetVersion.WSTETH_USDC_USDT_46,
  url: 'wsteth-usdc-usdt-46',
  id: 46,
  marketAddress: '0x221E35b5655A1eEB3C42c4DeFc39648531f6C9CF',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'USDC',
});

export const WEETH_USDC_USDT_47 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / USDC Market 47',
  shortLabel: 'weETH/USDC',
  value: FluidMainnetVersion.WEETH_USDC_USDT_47,
  url: 'weeth-usdc-usdt-47',
  id: 47,
  marketAddress: '0x01F0D07fdE184614216e76782c6b7dF663F5375e',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'USDC',
});

export const WBTC_USDC_USDT_48 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'WBTC / USDC Market 48',
  shortLabel: 'WBTC/USDC',
  value: FluidMainnetVersion.WBTC_USDC_USDT_48,
  url: 'wbtc-usdc-usdt-48',
  id: 48,
  marketAddress: '0x59fa2F51F5c8fFfceB538180EC47A869eC3DBd4a',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'WBTC',
  debtAsset: 'USDC',
});

export const CBBTC_USDC_USDT_49 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'cbBTC / USDC Market 49',
  shortLabel: 'cbBTC/USDC',
  value: FluidMainnetVersion.CBBTC_USDC_USDT_49,
  url: 'cbbtc-usdc-usdt-49',
  id: 49,
  marketAddress: '0x47b6e2c8a0cB072198f17ccC6C7634dCc7126c3E',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'cbBTC',
  debtAsset: 'USDC',
});

export const SUSDE_USDC_USDT_50 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'sUSDe / USDC Market 50',
  shortLabel: 'sUSDe/USDC',
  value: FluidMainnetVersion.SUSDE_USDC_USDT_50,
  url: 'susde-usdc-usdt-50',
  id: 50,
  marketAddress: '0xe210d8ded13Abe836a10E8Aa956dd424658d0034',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'sUSDe',
  debtAsset: 'USDC',
});

export const WBTC_CBBTC_WBTC_CBBTC_51 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'WBTC / cbBTC Market 51',
  shortLabel: 'WBTC/cbBTC',
  value: FluidMainnetVersion.WBTC_CBBTC_WBTC_CBBTC_51,
  url: 'wbtc-cbbtc-wbtc-cbbtc-51',
  id: 51,
  marketAddress: '0xDCe03288F9A109150f314ED0Ca9b59a690300d9d',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'WBTC',
  debtAsset: 'cbBTC',
});

export const WBTC_CBBTC_USDC_52 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  chainIds: [NetworkNumber.Eth],
  label: 'WBTC / cbBTC Market 52',
  shortLabel: 'WBTC/cbBTC',
  value: FluidMainnetVersion.WBTC_CBBTC_USDC_52,
  url: 'wbtc-cbbtc-usdc-52',
  id: 52,
  marketAddress: '0x4e564A29c1FC18ed9b66e5754A37fCa0C8a980ff',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'WBTC',
  debtAsset: 'cbBTC',
});

export const WBTC_CBBTC_USDT_53 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 53,
  chainIds: [NetworkNumber.Eth],
  label: 'WBTC / cbBTC Market 53',
  shortLabel: 'WBTC/cbBTC',
  value: FluidMainnetVersion.WBTC_CBBTC_USDT_53,
  url: 'wbtc-cbbtc-usdt-53',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'WBTC',
  debtAsset: 'cbBTC',
});

export const ETH_GHO_54 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 54,
  chainIds: [NetworkNumber.Eth],
  label: 'ETH / GHO Market 54',
  shortLabel: 'ETH/GHO',
  value: FluidMainnetVersion.ETH_GHO_54,
  url: 'eth-gho-54',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'GHO',
});

export const WSTETH_GHO_55 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 55,
  chainIds: [NetworkNumber.Eth],
  label: 'wstETH / GHO Market 55',
  shortLabel: 'wstETH/GHO',
  value: FluidMainnetVersion.WSTETH_GHO_55,
  url: 'wsteth-gho-55',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'GHO',
});

export const SUSDE_GHO_56 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 56,
  chainIds: [NetworkNumber.Eth],
  label: 'sUSDe / GHO Market 56',
  shortLabel: 'sUSDe/GHO',
  value: FluidMainnetVersion.SUSDE_GHO_56,
  url: 'susde-gho-56',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'sUSDe',
  debtAsset: 'GHO',
});

export const WEETH_GHO_57 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 57,
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / GHO Market 57',
  shortLabel: 'weETH/GHO',
  value: FluidMainnetVersion.WEETH_GHO_57,
  url: 'weeth-gho-57',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'GHO',
});

export const SUSDS_GHO_58 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 58,
  chainIds: [NetworkNumber.Eth],
  label: 'SUSDS / GHO Market 58',
  shortLabel: 'SUSDS/GHO',
  value: FluidMainnetVersion.SUSDS_GHO_58,
  url: 'susds-gho-58',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'SUSDS',
  debtAsset: 'GHO',
});

export const WBTC_GHO_59 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 59,
  chainIds: [NetworkNumber.Eth],
  label: 'WBTC / GHO Market 59',
  shortLabel: 'WBTC/GHO',
  value: FluidMainnetVersion.WBTC_GHO_59,
  url: 'wbtc-gho-59',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'WBTC',
  debtAsset: 'GHO',
});

export const CBBTC_GHO_60 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 60,
  chainIds: [NetworkNumber.Eth],
  label: 'cbBTC / GHO Market 60',
  shortLabel: 'cbBTC/GHO',
  value: FluidMainnetVersion.CBBTC_GHO_60,
  url: 'cbbtc-gho-60',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'cbBTC',
  debtAsset: 'GHO',
});

export const GHO_USDC_GHO_USDC_61 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 61,
  chainIds: [NetworkNumber.Eth],
  label: 'GHO / USDC Market 61',
  shortLabel: 'GHO/USDC',
  value: FluidMainnetVersion.GHO_USDC_GHO_USDC_61,
  url: 'gho-usdc-gho-usdc-61',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'GHO',
  debtAsset: 'USDC',
});

export const WEETH_ETH_WSTETH_74 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 74,
  chainIds: [NetworkNumber.Eth],
  label: 'weETH / ETH Market 74',
  shortLabel: 'weETH/ETH',
  value: FluidMainnetVersion.WEETH_ETH_WSTETH_74,
  url: 'weeth-eth-wsteth-74',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'ETH',
});

export const USDC_ETH_USDC_ETH_77 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 77,
  chainIds: [NetworkNumber.Eth],
  label: 'USDC / ETH Market 77',
  shortLabel: 'USDC/ETH',
  value: FluidMainnetVersion.USDC_ETH_USDC_ETH_77,
  url: 'usdc-eth-usdc-eth-77',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'USDC',
  debtAsset: 'ETH',
});

export const RSETH_ETH_WSTETH_78 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 78,
  chainIds: [NetworkNumber.Eth],
  label: 'RSETH / ETH Market 78',
  shortLabel: 'RSETH/ETH',
  value: FluidMainnetVersion.RSETH_ETH_WSTETH_78,
  url: 'rseth-eth-wsteth-78',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'RSETH',
  debtAsset: 'ETH',
});

export const RSETH_WSTETH_79 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 79,
  chainIds: [NetworkNumber.Eth],
  label: 'RSETH / wstETH Market 79',
  shortLabel: 'RSETH/wstETH',
  value: FluidMainnetVersion.RSETH_WSTETH_79,
  url: 'rseth-wsteth-79',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'RSETH',
  debtAsset: 'wstETH',
});

export const WEETHS_ETH_WSTETH_80 = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 80,
  chainIds: [NetworkNumber.Eth],
  label: 'weETHs / ETH Market 80',
  shortLabel: 'weETHs/ETH',
  value: FluidMainnetVersion.WEETHS_ETH_WSTETH_80,
  url: 'weeths-eth-wsteth-80',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETHs',
  debtAsset: 'ETH',
});

export const ETH_USDC_1_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 1,
  chainIds: [NetworkNumber.Arb],
  label: 'ETH / USDC Market 1',
  shortLabel: 'ETH/USDC',
  value: FluidArbitrumVersion.ETH_USDC_1_ARB,
  url: 'eth-usdc-1-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'USDC',
});

export const ETH_USDT_2_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 2,
  chainIds: [NetworkNumber.Arb],
  label: 'ETH / USDT Market 2',
  shortLabel: 'ETH/USDT',
  value: FluidArbitrumVersion.ETH_USDT_2_ARB,
  url: 'eth-usdt-2-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'USDT',
});

export const WSTETH_USDC_3_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 3,
  chainIds: [NetworkNumber.Arb],
  label: 'wstETH / USDC Market 3',
  shortLabel: 'wstETH/USDC',
  value: FluidArbitrumVersion.WSTETH_USDC_3_ARB,
  url: 'wsteth-usdc-3-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'USDC',
});

export const WSTETH_USDT_4_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 4,
  chainIds: [NetworkNumber.Arb],
  label: 'wstETH / USDT Market 4',
  shortLabel: 'wstETH/USDT',
  value: FluidArbitrumVersion.WSTETH_USDT_4_ARB,
  url: 'wsteth-usdt-4-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'USDT',
});

export const WSTETH_ETH_5_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 5,
  chainIds: [NetworkNumber.Arb],
  label: 'wstETH / ETH Market 5',
  shortLabel: 'wstETH/ETH',
  value: FluidArbitrumVersion.WSTETH_ETH_5_ARB,
  url: 'wsteth-eth-5-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'ETH',
});

export const WEETH_WSTETH_6_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 6,
  chainIds: [NetworkNumber.Arb],
  label: 'weETH / wstETH Market 6',
  shortLabel: 'weETH/wstETH',
  value: FluidArbitrumVersion.WEETH_WSTETH_6_ARB,
  url: 'weeth-wsteth-6-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'wstETH',
});

export const WEETH_USDC_7_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 7,
  chainIds: [NetworkNumber.Arb],
  label: 'weETH / USDC Market 7',
  shortLabel: 'weETH/USDC',
  value: FluidArbitrumVersion.WEETH_USDC_7_ARB,
  url: 'weeth-usdc-7-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'USDC',
});

export const WEETH_USDT_8_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 8,
  chainIds: [NetworkNumber.Arb],
  label: 'weETH / USDT Market 8',
  shortLabel: 'weETH/USDT',
  value: FluidArbitrumVersion.WEETH_USDT_8_ARB,
  url: 'weeth-usdt-8-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'USDT',
});

export const ETH_ARB_9_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 9,
  chainIds: [NetworkNumber.Arb],
  label: 'ETH / ARB Market 9',
  shortLabel: 'ETH/ARB',
  value: FluidArbitrumVersion.ETH_ARB_9_ARB,
  url: 'eth-arb-9-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'ARB',
});

export const ARB_USDC_10_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 10,
  chainIds: [NetworkNumber.Arb],
  label: 'ARB / USDC Market 10',
  shortLabel: 'ARB/USDC',
  value: FluidArbitrumVersion.ARB_USDC_10_ARB,
  url: 'arb-usdc-10-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ARB',
  debtAsset: 'USDC',
});

export const ARB_USDT_11_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 11,
  chainIds: [NetworkNumber.Arb],
  label: 'ARB / USDT Market 11',
  shortLabel: 'ARB/USDT',
  value: FluidArbitrumVersion.ARB_USDT_11_ARB,
  url: 'arb-usdt-11-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ARB',
  debtAsset: 'USDT',
});

export const WSTETH_ETH_WSTETH_ETH_16_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 16,
  chainIds: [NetworkNumber.Arb],
  label: 'wstETH / ETH Market 16',
  shortLabel: 'wstETH/ETH',
  value: FluidArbitrumVersion.WSTETH_ETH_WSTETH_ETH_16_ARB,
  url: 'wsteth-eth-wsteth-eth-16-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'ETH',
});

export const WEETH_ETH_WSTETH_17_ARB = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 17,
  chainIds: [NetworkNumber.Arb],
  label: 'weETH / ETH Market 17',
  shortLabel: 'weETH/ETH',
  value: FluidArbitrumVersion.WEETH_ETH_WSTETH_17_ARB,
  url: 'weeth-eth-wsteth-17-arb',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'ETH',
});

export const ETH_USDC_1_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 1,
  chainIds: [NetworkNumber.Base],
  label: 'ETH / USDC Market 1',
  shortLabel: 'ETH/USDC',
  value: FluidBaseVersions.ETH_USDC_1_BASE,
  url: 'eth-usdc-1-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'USDC',
});

export const WSTETH_USDC_2_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 2,
  chainIds: [NetworkNumber.Base],
  label: 'wstETH / USDC Market 2',
  shortLabel: 'wstETH/USDC',
  value: FluidBaseVersions.WSTETH_USDC_2_BASE,
  url: 'wsteth-usdc-2-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'USDC',
});

export const WSTETH_ETH_3_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 3,
  chainIds: [NetworkNumber.Base],
  label: 'wstETH / ETH Market 3',
  shortLabel: 'wstETH/ETH',
  value: FluidBaseVersions.WSTETH_ETH_3_BASE,
  url: 'wsteth-eth-3-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'ETH',
});

export const WEETH_WSTETH_4_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 4,
  chainIds: [NetworkNumber.Base],
  label: 'weETH / wstETH Market 4',
  shortLabel: 'weETH/wstETH',
  value: FluidBaseVersions.WEETH_WSTETH_4_BASE,
  url: 'weeth-wsteth-4-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'wstETH',
});

export const WEETH_USDC_5_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 5,
  chainIds: [NetworkNumber.Base],
  label: 'weETH / USDC Market 5',
  shortLabel: 'weETH/USDC',
  value: FluidBaseVersions.WEETH_USDC_5_BASE,
  url: 'weeth-usdc-5-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'USDC',
});

export const CBETH_USDC_6_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 6,
  chainIds: [NetworkNumber.Base],
  label: 'CBETH / USDC Market 6',
  shortLabel: 'CBETH/USDC',
  value: FluidBaseVersions.CBETH_USDC_6_BASE,
  url: 'cbeth-usdc-6-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'CBETH',
  debtAsset: 'USDC',
});

export const CBBTC_USDC_7_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 7,
  chainIds: [NetworkNumber.Base],
  label: 'cbBTC / USDC Market 7',
  shortLabel: 'cbBTC/USDC',
  value: FluidBaseVersions.CBBTC_USDC_7_BASE,
  url: 'cbbtc-usdc-7-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'cbBTC',
  debtAsset: 'USDC',
});

export const CBBTC_EURC_8_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 8,
  chainIds: [NetworkNumber.Base],
  label: 'cbBTC / EURC Market 8',
  shortLabel: 'cbBTC/EURC',
  value: FluidBaseVersions.CBBTC_EURC_8_BASE,
  url: 'cbbtc-eurc-8-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'cbBTC',
  debtAsset: 'EURC',
});

export const CBETH_EURC_9_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 9,
  chainIds: [NetworkNumber.Base],
  label: 'CBETH / EURC Market 9',
  shortLabel: 'CBETH/EURC',
  value: FluidBaseVersions.CBETH_EURC_9_BASE,
  url: 'cbeth-eurc-9-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'CBETH',
  debtAsset: 'EURC',
});

export const ETH_EURC_10_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 10,
  chainIds: [NetworkNumber.Base],
  label: 'ETH / EURC Market 10',
  shortLabel: 'ETH/EURC',
  value: FluidBaseVersions.ETH_EURC_10_BASE,
  url: 'eth-eurc-10-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'EURC',
});

export const WEETH_EURC_11_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 11,
  chainIds: [NetworkNumber.Base],
  label: 'weETH / EURC Market 11',
  shortLabel: 'weETH/EURC',
  value: FluidBaseVersions.WEETH_EURC_11_BASE,
  url: 'weeth-eurc-11-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'EURC',
});

export const WSTETH_EURC_12_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 12,
  chainIds: [NetworkNumber.Base],
  label: 'wstETH / EURC Market 12',
  shortLabel: 'wstETH/EURC',
  value: FluidBaseVersions.WSTETH_EURC_12_BASE,
  url: 'wsteth-eurc-12-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'EURC',
});

export const CBBTC_ETH_13_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 13,
  chainIds: [NetworkNumber.Base],
  label: 'cbBTC / ETH Market 13',
  shortLabel: 'cbBTC/ETH',
  value: FluidBaseVersions.CBBTC_ETH_13_BASE,
  url: 'cbbtc-eth-13-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'cbBTC',
  debtAsset: 'ETH',
});

export const ETH_CBBTC_14_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 14,
  chainIds: [NetworkNumber.Base],
  label: 'ETH / cbBTC Market 14',
  shortLabel: 'ETH/cbBTC',
  value: FluidBaseVersions.ETH_CBBTC_14_BASE,
  url: 'eth-cbbtc-14-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'ETH',
  debtAsset: 'cbBTC',
});

export const WEETH_CBBTC_15_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 15,
  chainIds: [NetworkNumber.Base],
  label: 'weETH / cbBTC Market 15',
  shortLabel: 'weETH/cbBTC',
  value: FluidBaseVersions.WEETH_CBBTC_15_BASE,
  url: 'weeth-cbbtc-15-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'weETH',
  debtAsset: 'cbBTC',
});

export const WSTETH_CBBTC_16_BASE = (networkId: NetworkNumber = NetworkNumber.Eth): FluidMarketInfo => ({
  id: 16,
  chainIds: [NetworkNumber.Base],
  label: 'wstETH / cbBTC Market 16',
  shortLabel: 'wstETH/cbBTC',
  value: FluidBaseVersions.WSTETH_CBBTC_16_BASE,
  url: 'wsteth-cbbtc-16-base',
  marketAddress: '',
  hasSmartCollateral: false,
  hasSmartDebt: false,
  collateralAsset: 'wstETH',
  debtAsset: 'cbBTC',
});

export const FluidMarkets = (networkId: NetworkNumber) => ({
  [FluidMainnetVersion.ETH_USDC_1]: ETH_USDC_1(networkId),
  [FluidMainnetVersion.ETH_USDT_2]: ETH_USDT_2(networkId),
  [FluidMainnetVersion.WSTETH_ETH_3]: WSTETH_ETH_3(networkId),
  [FluidMainnetVersion.WSTETH_USDC_4]: WSTETH_USDC_4(networkId),
  [FluidMainnetVersion.WSTETH_USDT_5]: WSTETH_USDT_5(networkId),
  [FluidMainnetVersion.WEETH_WSTETH_6]: WEETH_WSTETH_6(networkId),
  [FluidMainnetVersion.SUSDE_USDC_7]: SUSDE_USDC_7(networkId),
  [FluidMainnetVersion.SUSDE_USDT_8]: SUSDE_USDT_8(networkId),
  [FluidMainnetVersion.WEETH_USDC_9]: WEETH_USDC_9(networkId),
  [FluidMainnetVersion.WEETH_USDT_10]: WEETH_USDT_10(networkId),
  [FluidMainnetVersion.ETH_USDC_11]: ETH_USDC_11(networkId),
  [FluidMainnetVersion.ETH_USDT_12]: ETH_USDT_12(networkId),
  [FluidMainnetVersion.WSTETH_ETH_13]: WSTETH_ETH_13(networkId),
  [FluidMainnetVersion.WSTETH_USDC_14]: WSTETH_USDC_14(networkId),
  [FluidMainnetVersion.WSTETH_USDT_15]: WSTETH_USDT_15(networkId),
  [FluidMainnetVersion.WEETH_WSTETH_16]: WEETH_WSTETH_16(networkId),
  [FluidMainnetVersion.SUSDE_USDC_17]: SUSDE_USDC_17(networkId),
  [FluidMainnetVersion.SUSDE_USDT_18]: SUSDE_USDT_18(networkId),
  [FluidMainnetVersion.WEETH_USDC_19]: WEETH_USDC_19(networkId),
  [FluidMainnetVersion.WEETH_USDT_20]: WEETH_USDT_20(networkId),
  [FluidMainnetVersion.WBTC_USDC_21]: WBTC_USDC_21(networkId),
  [FluidMainnetVersion.WBTC_USDT_22]: WBTC_USDT_22(networkId),
  [FluidMainnetVersion.WBTC_ETH_23]: WBTC_ETH_23(networkId),
  [FluidMainnetVersion.ETH_WBTC_24]: ETH_WBTC_24(networkId),
  [FluidMainnetVersion.WSTETH_WBTC_25]: WSTETH_WBTC_25(networkId),
  [FluidMainnetVersion.WEETH_WBTC_26]: WEETH_WBTC_26(networkId),
  [FluidMainnetVersion.WEETHS_WSTETH_27]: WEETHS_WSTETH_27(networkId),
  [FluidMainnetVersion.CBBTC_ETH_28]: CBBTC_ETH_28(networkId),
  [FluidMainnetVersion.CBBTC_USDC_29]: CBBTC_USDC_29(networkId),
  [FluidMainnetVersion.CBBTC_USDT_30]: CBBTC_USDT_30(networkId),
  [FluidMainnetVersion.ETH_CBBTC_31]: ETH_CBBTC_31(networkId),
  [FluidMainnetVersion.WEETH_CBBTC_32]: WEETH_CBBTC_32(networkId),
  [FluidMainnetVersion.WSTETH_CBBTC_33]: WSTETH_CBBTC_33(networkId),
  [FluidMainnetVersion.WSTETH_ETH_WSTETH_ETH_44]: WSTETH_ETH_WSTETH_ETH_44(networkId),
  [FluidMainnetVersion.ETH_USDC_USDT_45]: ETH_USDC_USDT_45(networkId),
  [FluidMainnetVersion.WSTETH_USDC_USDT_46]: WSTETH_USDC_USDT_46(networkId),
  [FluidMainnetVersion.WEETH_USDC_USDT_47]: WEETH_USDC_USDT_47(networkId),
  [FluidMainnetVersion.WBTC_USDC_USDT_48]: WBTC_USDC_USDT_48(networkId),
  [FluidMainnetVersion.CBBTC_USDC_USDT_49]: CBBTC_USDC_USDT_49(networkId),
  [FluidMainnetVersion.SUSDE_USDC_USDT_50]: SUSDE_USDC_USDT_50(networkId),
  [FluidMainnetVersion.WBTC_CBBTC_WBTC_CBBTC_51]: WBTC_CBBTC_WBTC_CBBTC_51(networkId),
  [FluidMainnetVersion.WBTC_CBBTC_USDC_52]: WBTC_CBBTC_USDC_52(networkId),
  [FluidMainnetVersion.WBTC_CBBTC_USDT_53]: WBTC_CBBTC_USDT_53(networkId),
  [FluidMainnetVersion.ETH_GHO_54]: ETH_GHO_54(networkId),
  [FluidMainnetVersion.WSTETH_GHO_55]: WSTETH_GHO_55(networkId),
  [FluidMainnetVersion.SUSDE_GHO_56]: SUSDE_GHO_56(networkId),
  [FluidMainnetVersion.WEETH_GHO_57]: WEETH_GHO_57(networkId),
  [FluidMainnetVersion.SUSDS_GHO_58]: SUSDS_GHO_58(networkId),
  [FluidMainnetVersion.WBTC_GHO_59]: WBTC_GHO_59(networkId),
  [FluidMainnetVersion.CBBTC_GHO_60]: CBBTC_GHO_60(networkId),
  [FluidMainnetVersion.GHO_USDC_GHO_USDC_61]: GHO_USDC_GHO_USDC_61(networkId),
  [FluidMainnetVersion.WEETH_ETH_WSTETH_74]: WEETH_ETH_WSTETH_74(networkId),
  [FluidMainnetVersion.USDC_ETH_USDC_ETH_77]: USDC_ETH_USDC_ETH_77(networkId),
  [FluidMainnetVersion.RSETH_ETH_WSTETH_78]: RSETH_ETH_WSTETH_78(networkId),
  [FluidMainnetVersion.RSETH_WSTETH_79]: RSETH_WSTETH_79(networkId),
  [FluidMainnetVersion.WEETHS_ETH_WSTETH_80]: WEETHS_ETH_WSTETH_80(networkId),

  // arbitrum
  [FluidArbitrumVersion.ETH_USDC_1_ARB]: ETH_USDC_1_ARB(networkId),
  [FluidArbitrumVersion.ETH_USDT_2_ARB]: ETH_USDT_2_ARB(networkId),
  [FluidArbitrumVersion.WSTETH_USDC_3_ARB]: WSTETH_USDC_3_ARB(networkId),
  [FluidArbitrumVersion.WSTETH_USDT_4_ARB]: WSTETH_USDT_4_ARB(networkId),
  [FluidArbitrumVersion.WSTETH_ETH_5_ARB]: WSTETH_ETH_5_ARB(networkId),
  [FluidArbitrumVersion.WEETH_WSTETH_6_ARB]: WEETH_WSTETH_6_ARB(networkId),
  [FluidArbitrumVersion.WEETH_USDC_7_ARB]: WEETH_USDC_7_ARB(networkId),
  [FluidArbitrumVersion.WEETH_USDT_8_ARB]: WEETH_USDT_8_ARB(networkId),
  [FluidArbitrumVersion.ETH_ARB_9_ARB]: ETH_ARB_9_ARB(networkId),
  [FluidArbitrumVersion.ARB_USDC_10_ARB]: ARB_USDC_10_ARB(networkId),
  [FluidArbitrumVersion.ARB_USDT_11_ARB]: ARB_USDT_11_ARB(networkId),
  [FluidArbitrumVersion.WSTETH_ETH_WSTETH_ETH_16_ARB]: WSTETH_ETH_WSTETH_ETH_16_ARB(networkId),
  [FluidArbitrumVersion.WEETH_ETH_WSTETH_17_ARB]: WEETH_ETH_WSTETH_17_ARB(networkId),

  // base
  [FluidBaseVersions.ETH_USDC_1_BASE]: ETH_USDC_1_BASE(networkId),
  [FluidBaseVersions.WSTETH_USDC_2_BASE]: WSTETH_USDC_2_BASE(networkId),
  [FluidBaseVersions.WSTETH_ETH_3_BASE]: WSTETH_ETH_3_BASE(networkId),
  [FluidBaseVersions.WEETH_WSTETH_4_BASE]: WEETH_WSTETH_4_BASE(networkId),
  [FluidBaseVersions.WEETH_USDC_5_BASE]: WEETH_USDC_5_BASE(networkId),
  [FluidBaseVersions.CBETH_USDC_6_BASE]: CBETH_USDC_6_BASE(networkId),
  [FluidBaseVersions.CBBTC_USDC_7_BASE]: CBBTC_USDC_7_BASE(networkId),
  [FluidBaseVersions.CBBTC_EURC_8_BASE]: CBBTC_EURC_8_BASE(networkId),
  [FluidBaseVersions.CBETH_EURC_9_BASE]: CBETH_EURC_9_BASE(networkId),
  [FluidBaseVersions.ETH_EURC_10_BASE]: ETH_EURC_10_BASE(networkId),
  [FluidBaseVersions.WEETH_EURC_11_BASE]: WEETH_EURC_11_BASE(networkId),
  [FluidBaseVersions.WSTETH_EURC_12_BASE]: WSTETH_EURC_12_BASE(networkId),
  [FluidBaseVersions.CBBTC_ETH_13_BASE]: CBBTC_ETH_13_BASE(networkId),
  [FluidBaseVersions.ETH_CBBTC_14_BASE]: ETH_CBBTC_14_BASE(networkId),
  [FluidBaseVersions.WEETH_CBBTC_15_BASE]: WEETH_CBBTC_15_BASE(networkId),
  [FluidBaseVersions.WSTETH_CBBTC_16_BASE]: WSTETH_CBBTC_16_BASE(networkId),
});