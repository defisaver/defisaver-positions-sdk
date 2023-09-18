import {
  MMAssetData, MMPositionData, MMUsedAsset, NetworkNumber,
} from './common';

export enum CompoundVersions {
  'CompoundV2' = 'v2',
  'CompoundV3USDC' = 'v3-USDC',
  'CompoundV3ETH' = 'v3-ETH',
}

export interface CompoundMarketData {
  chainIds: NetworkNumber[],
  label: string,
  shortLabel: string,
  value: CompoundVersions,
  baseAsset: string,
  collAssets: readonly string[],
  baseMarket: string,
  baseMarketAddress: string,
  secondLabel: string,
  bulkerName: string,
  bulkerAddress: string,
  bulkerOptions: { supply: string | number, withdraw: string | number },
  // icon: Function,
}

export interface CompoundV3UsedAsset extends MMUsedAsset {
  collateral: boolean,
  limit?: string,
}

export interface CompoundV3UsedAssets {
  [token: string]: CompoundV3UsedAsset,
}

export interface CompoundV3AssetData extends MMAssetData {
  borrowCollateralFactor: string,
  liquidateCollateralFactor: string,
  supplyCapAlternative?: string,
  totalSupplyAlternative?: string,
  priceAlternative?: string,
  sortIndex?: number,
}

export interface CompoundV3AssetsData {
  [token: string]: CompoundV3AssetData
}
export type CompoundV3MarketData = { assetsData: CompoundV3AssetsData };

export interface BaseAdditionalAssetData {
  totalBorrow: string,
  utilization: string,
  marketLiquidity: string,
  rewardSupplySpeed: string,
  rewardBorrowSpeed: string,
  minDebt: string,
  isBase: boolean,
}