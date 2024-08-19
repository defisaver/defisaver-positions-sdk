import { MMUsedAssets, NetworkNumber } from './common';

export enum MorphoVersions {
  // MAINNET
  MorphoWstEthUSDC = 'morphowstethusdc', // wstETH/USDC
  MorphoSDAIUSDC = 'morphosdaiusdc', // sDAI/USDC
  MorphoWBTCUSDC = 'morphowbtcusdc', // WBTC/USDC
  MorphoEthUSDC = 'morphoethusdc', // ETH/USDC
  MorphoWBTCUSDT = 'morphowbtcusdt', // WBTC/USDT
  MorphoWstEthUSDT = 'morphowstethusdt', // wstETH/USDT
  MorphoWstEthUSDA_Exchange_Rate = 'morphowstethusda_exchange_rate', // wstETH/USDA
  MorphoWstEthPYUSD = 'morphowstethpyusd', // wstETH/PYUSD
  MorphoWeEthEth = 'morphoweetheth', // weETH/ETH
  MorphoWBTCPYUSD = 'morphowbtcpyusd', // WBTC/PYUSD
  MorphoWBTCEth = 'morphowbtceth', // WBTC/ETH
  MorphoUSDeUSDT = 'morphousdeusdt', // USDe/USDT
  MorphoSUSDeUSDT = 'morphosusdeusdt', // sUSDe/USDT
  MorphoSDAIEth = 'morphosdaieth', // sDAI/ETH
  MorphoEzEthEth = 'morphoezetheth', // ezETH/ETH
  MorphoMKRUSDC = 'morphomkrusdc', // MKR/USDC
  MorphoTBTCUSDC = 'morphotbtcusdc', // tBTC/USDC
  // wstETH/WETH
  MorphoWstEthEth_945 = 'morphowstetheth_945',
  MorphoWstEthEth_945_Exchange_Rate = 'morphowstetheth_945_exchange_rate',
  MorphoWstEthEth_965_Exchange_Rate = 'morphowstetheth_965_exchange_rate',
  // sUSDe/DAI
  MorphoSUSDeDAI_770 = 'morphosusdedai_770',
  MorphoSUSDeDAI_860 = 'morphosusdedai_860',
  MorphoSUSDeDAI_915 = 'morphosusdedai_915',
  MorphoSUSDeDAI_945 = 'morphosusdedai_945',
  // USDe/DAI
  MorphoUSDeDAI_770 = 'morphousdedai_770',
  MorphoUSDeDAI_860 = 'morphousdedai_860',
  MorphoUSDeDAI_915 = 'morphousdedai_915',
  MorphoUSDeDAI_945 = 'morphousdedai_945',

  // BASE
  MorphoCbEthUSDC_860_Base = 'morphocbethusdc_860_base',
  MorphoWstEthUSDC_860_Base = 'morphowstethusdc_860_base',
  MorphoEthUSDC_860_Base = 'morphoethusdc_860_base',
  MorphoCbEthEth_945_Base = 'morphocbetheth_945_base',
  MorphoCbEthEth_965_Base = 'morphocbetheth_965_base',
  MorphoWstEthEth_945_Base = 'morphowstetheth_945_base',
  MorphoWstEthEth_965_Base = 'morphowstetheth_965_base',
  MorphoREthUSDC_860_Base = 'morphorethusdc_860_base',
  MorphoREthEth_945_Base = 'morphoretheth_945_base',
}

export enum MorphoOracleType {
  MARKET_RATE = 'Market rate',
  LIDO_RATE = 'Lido rate',
  ETHENA_RATE = 'Ethena rate',
}

export interface MorphoMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: MorphoVersions,
  loanToken: string,
  collateralToken: string,
  oracle: string,
  oracleType: MorphoOracleType,
  irm: string,
  lltv: number | string,
  marketId: string,
  // icon: Function,
  protocolName: string,
}

export interface MorphoAssetData {
  symbol: string,
  address: string,
  price: string,
  supplyRate: string,
  borrowRate: string,
  incentiveSupplyApy?: string,
  incentiveSupplyToken?: string,
  totalSupply?: string,
  totalBorrow?: string,
  canBeSupplied?: boolean,
  canBeBorrowed?: boolean,
}

export type MorphoAssetsData = { [key: string]: MorphoAssetData };

export interface MorphoMarketInfo {
  id: string,
  fee: string,
  loanToken: string,
  collateralToken: string,
  utillization: string,
  oracle: string,
  oracleType: MorphoOracleType,
  lltv: string,
  minRatio: string,
  assetsData: MorphoAssetsData,
}

export interface MorphoAggregatedPositionData {
  suppliedUsd: string,
  suppliedCollateralUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  leftToBorrowUsd: string,
  leftToBorrow: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  ltv: string,
  ratio: string,
  leveragedType: string,
  leveragedAsset?: string,
  leveragedLsdAssetRatio?: string,
  liquidationPrice?: string,
}

export interface MorphoPositionData {
  usedAssets: MMUsedAssets,
  suppliedUsd: string,
  suppliedCollateralUsd: string,
  borrowedUsd: string,
  borrowLimitUsd: string,
  liquidationLimitUsd: string,
  leftToBorrowUsd: string,
  leftToBorrow: string,
  netApy: string,
  incentiveUsd: string,
  totalInterestUsd: string,
  ltv: string,
  ratio: string,
  leveragedType: string,
  leveragedAsset?: string,
  leveragedLsdAssetRatio?: string,
  liquidationPrice?: string,
  supplyShares: string,
  borrowShares: string,
}
