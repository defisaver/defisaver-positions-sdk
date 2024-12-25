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
  MorphoBlueREthEth_945 = 'morphoblueretheth_945', // rETH/ETH
  MorphoBlueWBTCPYUSD = 'morphobluewbtcpyusd', // WBTC/PYUSD
  MorphoBlueWBTCEth = 'morphobluewbtceth', // WBTC/ETH
  MorphoBlueUSDeUSDT = 'morphoblueusdeusdt', // USDe/USDT
  MorphoBlueSUSDeUSDT = 'morphobluesusdeusdt', // sUSDe/USDT
  MorphoBlueSDAIEth = 'morphobluesdaieth', // sDAI/ETH
  MorphoBlueMKRUSDC = 'morphobluemkrusdc', // MKR/USDC
  MorphoBlueTBTCUSDC = 'morphobluetbtcusdc', // tBTC/USDC
  MorphoBlueCbBTCEth_915 = 'morphobluecbbtceth', // cbBTC/Eth
  MorphoBlueCbBTCUSDC_860 = 'morphobluecbbtcusdc', // cbBTC/USDC
  MorphoBlueSUSDeUSDC_915 = 'morphobluesusdeusdc_915', // sUSDe/USDC
  MorphoBlueLBTCWBTC_945 = 'morphobluelbtcwbtc_945', // LBTC/WBTC
  // ezETH/ETH
  MorphoBlueEzEthEth_860 = 'morphoblueezetheth_860',
  MorphoBlueEzEthEth_945 = 'morphoblueezetheth_945',
  // weETH/ETH
  MorphoBlueWeEthEth_860 = 'morphoblueweetheth_860',
  MorphoBlueWeEthEth_945 = 'morphoblueweetheth_945',
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
  MorphoBlueCbEthUSDC_860_Base_1c21c59d = 'morphobluecbethusdc_860_base_1c21c59d',
  MorphoBlueWstEthUSDC_860_Base = 'morphobluewstethusdc_860_base',
  MorphoBlueWstEthUSDC_860_Base_13c42741 = 'morphobluewstethusdc_860_base_13c42741',
  MorphoBlueEthUSDC_860_Base = 'morphoblueethusdc_860_base',
  MorphoBlueCbEthEth_945_Base = 'morphobluecbetheth_945_base',
  MorphoBlueCbEthEth_965_Base = 'morphobluecbetheth_965_base',
  MorphoBlueWstEthEth_945_Base = 'morphobluewstetheth_945_base',
  MorphoBlueWstEthEth_965_Base = 'morphobluewstetheth_965_base',
  MorphoBlueREthUSDC_860_Base = 'morphobluerethusdc_860_base',
  MorphoBlueREthEth_945_Base = 'morphoblueretheth_945_base',
  MorphoBlueCbBTCEth_915_Base = 'morphobluecbbtceth_915_base',
  MorphoBlueCbBTCUSDC_860_Base = 'morphobluecbbtcusdc_860_base',
  MorphoBlueWsuperOETHbWETH_915_Base = 'morphobluewsuperoethbweth_915_base',
  MorphoBlueLBTCCbBTC_945_Base = 'morphobluelbtccbbtc_945_base', // LBTC/cbBTC
  MorphoBlueWstEthEURC_860_Base = 'morphobluewstetheurc_860_base', // wstETH/EURC
  MorphoBlueCbBTCEURC_860_Base = 'morphobluecbbtceurc_860_base', // cbBTC/EURC
}

export enum MorphoBlueOracleType {
  MARKET_RATE = 'Market rate',
  LIDO_RATE = 'Lido rate',
  ETHENA_RATE = 'Ethena rate',
  CONTRACT_RATE = 'Contract rate',
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
  incentiveBorrowApy?: string,
  incentiveBorrowToken?: string,
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

export interface MorphoBlueVault {
  address: string,
}

export interface MorphoBlueAllocationMarket {
  loanAsset: { address: string },
  collateralAsset: { address: string },
  oracle: { address: string },
  irmAddress: string,
  lltv: string,
  uniqueKey: string,
}

export interface MorphoBluePublicAllocatorItem {
  vault: MorphoBlueVault,
  assets: string,
  allocationMarket: MorphoBlueAllocationMarket,
}

export interface MorphoBlueAllocatorMarketState {
  borrowAssets: string,
  supplyAssets: string,
}

export interface MorphoBlueRealloactionMarketData {
  reallocatableLiquidityAssets: string,
  targetBorrowUtilization: string,
  publicAllocatorSharedLiquidity: MorphoBluePublicAllocatorItem[],
  state: MorphoBlueAllocatorMarketState,
}
