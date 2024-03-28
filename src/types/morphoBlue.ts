import { MMUsedAssets, NetworkNumber } from './common';

export enum MorphoBlueVersions {
  MorphoBlueWstEthEth = 'morphobluewstetheth',
  MorphoBlueWstEthUSDC = 'morphobluewstethusdc',
  MorphoBlueSDAIUSDC = 'morphobluesdaiusdc',
  MorphoBlueWBTCUSDC = 'morphobluewbtcusdc',
  MorphoBlueEthUSDC = 'morphoblueethusdc',
  MorphoBlueWBTCUSDT = 'morphobluewbtcusdt',
  MorphoBlueWstEthUSDT = 'morphobluewstethusdt',
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
}

export interface MorphoBlueMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  pill?: string,
  url: string,
  value: MorphoBlueVersions,
  loanToken: string,
  collateralToken: string,
  oracle: string,
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
