import { MMUsedAssets, NetworkNumber } from './common';

export enum MorphoBlueVersions {
  // MAINNET
  MorphoBlueWstEthUSDC = 'morphobluewstethusdc', // wstETH/USDC
  MorphoBlueSDAIUSDC = 'morphobluesdaiusdc', // sDAI/USDC
  MorphoBlueWBTCUSDC = 'morphobluewbtcusdc', // WBTC/USDC
  MorphoBlueEthUSDC = 'morphoblueethusdc', // ETH/USDC
  MorphoBlueWBTCUSDT = 'morphobluewbtcusdt', // WBTC/USDT
  MorphoBlueWstEthUSDT = 'morphobluewstethusdt', // wstETH/USDT
  MorphoBlueWstEthUSDA_Exchange_Rate = 'morphobluewstethusda_exchange_rate', // wstETH/USDA
  MorphoBlueWstEthPYUSD = 'morphobluwstethpyusd', // wstETH/PYUSD
  MorphoBlueWeEthEth = 'morphoblueweetheth', // weETH/ETH
  MorphoBlueWBTCPYUSD = 'morphobluewbtcpyusd', // WBTC/PYUSD
  MorphoBlueWBTCEth = 'morphobluewbtceth', // WBTC/ETH
  MorphoBlueUSDeUSDT = 'morphoblueusdeusdt', // USDe/USDT
  MorphoBlueSUSDeUSDT = 'morphobluesusdeusdt', // sUSDe/USDT
  MorphoBlueSDAIEth = 'morphobluesdaieth', // sDAI/ETH
  MorphoBlueEzEthEth = 'morphoblueezetheth', // ezETH/ETH
  MorphoBlueMKRUSDC = 'morphobluemkrusdc', // MKR/USDC
  MorphoBlueTBTCUSDC = 'morphobluetbtcusdc', // tBTC/USDC
  // wstETH/WETH
  MorphoBlueWstEthEth_945 = 'morphobluewstetheth_945',
  MorphoBlueWstEthEth_945_Exchange_Rate = 'morphobluewstetheth_945_exchange_rate',
  MorphoBlueWstEthEth_965_Exchange_Rate = 'morphobluewstetheth_965_exchange_rate',
  // sUSDe/DAI
  MorphoBlueSUSDeDAI_770 = 'morphobluesusdedai_770',
  MorphoBlueSUSDeDAI_860 = 'morphobluesusdedai_860',
  MorphoBlueSUSDeDAI_915 = 'morphobluesusdedai_915',
  MorphoBlueSUSDeDAI_945 = 'morphobluesusdedai_945',
  // USDe/DAI
  MorphoBlueUSDeDAI_770 = 'morphoblueusdedai_770',
  MorphoBlueUSDeDAI_860 = 'morphoblueusdedai_860',
  MorphoBlueUSDeDAI_915 = 'morphoblueusdedai_915',
  MorphoBlueUSDeDAI_945 = 'morphoblueusdedai_945',

  // BASE
  MorphoBlueCbEthUSDC_860_Base = 'morphobluecbethusdc_860_base',
  MorphoBlueWstEthUSDC_860_Base = 'morphobluewstethusdc_860_base',
  MorphoBlueEthUSDC_860_Base = 'morphoblueethusdc_860_base',
  MorphoBlueCbEthEth_945_Base = 'morphobluecbetheth_945_base',
  MorphoBlueCbEthEth_965_Base = 'morphobluecbetheth_965_base',
  MorphoBlueWstEthEth_945_Base = 'morphobluewstetheth_945_base',
  MorphoBlueWstEthEth_965_Base = 'morphobluewstetheth_965_base',
  MorphoBlueREthUSDC_860_Base = 'morphobluerethusdc_860_base',
  MorphoBlueREthEth_945_Base = 'morphoblueretheth_945_base',
}

export enum MorphoBlueOracleType {
  MARKET_RATE = 'Market rate',
  LIDO_RATE = 'Lido rate',
  ETHENA_RATE = 'Ethena rate',
}

export interface MorphoBlueMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  url: string,
  value: MorphoBlueVersions,
  loanToken: string,
  collateralToken: string,
  oracle: string,
  oracleType: MorphoBlueOracleType,
  irm: string,
  lltv: number | string,
  marketId: string,
  // icon: Function,
  protocolName: string,
}

export interface MorphoBlueAssetData {
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

export type MorphoBlueAssetsData = { [key: string]: MorphoBlueAssetData };

export interface MorphoBlueMarketInfo {
  id: string,
  fee: string,
  loanToken: string,
  collateralToken: string,
  utillization: string,
  oracle: string,
  oracleType: MorphoBlueOracleType,
  lltv: string,
  minRatio: string,
  assetsData: MorphoBlueAssetsData,
}

export interface MorphoBlueAggregatedPositionData {
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

export interface MorphoBluePositionData {
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
