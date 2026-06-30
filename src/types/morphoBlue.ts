import {
  EthAddress, IncentiveData, LeverageType, MMUsedAssets, NetworkNumber,
} from './common';

export enum MorphoBlueVersions {
  // MAINNET
  MorphoBlueMKRDAI_777 = 'morphobluemkrdai_777', // MKR/DAI
  MorphoBlueWoEthEth_860 = 'morphobluewoetheth_860', // woETH/ETH
  MorphoBlueOsEthEth_860 = 'morphoblueosetheth_860', // osETH/ETH
  MorphoBlueWeEthEth_860 = 'morphoblueweetheth_860', // weETH/ETH
  MorphoBlueWstEthUSDC = 'morphobluewstethusdc', // wstETH/USDC
  MorphoBlueSDAIUSDC = 'morphobluesdaiusdc', // sDAI/USDC
  MorphoBlueWBTCUSDC = 'morphobluewbtcusdc', // WBTC/USDC
  MorphoBlueEthUSDC_915 = 'morphoblueethusdc_915', // ETH/USDC
  MorphoBlueEthUSDC_860 = 'morphoblueethusdc_860', // ETH/USDC
  MorphoBlueWBTCUSDT = 'morphobluewbtcusdt', // WBTC/USDT
  MorphoBlueWstEthUSDT = 'morphobluewstethusdt', // wstETH/USDT
  MorphoBlueWstEthUSDA_Exchange_Rate = 'morphobluewstethusda_exchange_rate', // wstETH/USDA
  MorphoBlueWstEthPYUSD = 'morphobluwstethpyusd', // wstETH/PYUSD
  MorphoBlueWBTCPYUSD = 'morphobluewbtcpyusd', // WBTC/PYUSD
  MorphoBlueWBTCEth = 'morphobluewbtceth', // WBTC/ETH
  MorphoBlueUSDeUSDT = 'morphoblueusdeusdt', // USDe/USDT
  MorphoBlueSUSDeUSDT = 'morphobluesusdeusdt', // sUSDe/USDT
  MorphoBlueMKRUSDC = 'morphobluemkrusdc', // MKR/USDC
  MorphoBlueTBTCUSDC = 'morphobluetbtcusdc', // tBTC/USDC
  MorphoBlueCbBTCEth_915 = 'morphobluecbbtceth', // cbBTC/Eth
  MorphoBlueCbBTCUSDC_860 = 'morphobluecbbtcusdc', // cbBTC/USDC
  MorphoBlueSUSDeUSDC_915 = 'morphobluesusdeusdc_915', // sUSDe/USDC
  MorphoBlueLBTCWBTC_945 = 'morphobluelbtcwbtc_945', // LBTC/WBTC
  MorphoBlueLBTCUSDC_860 = 'morphobluelbtcusdc_860', // LBTC/USDC
  MorphoBlueLBTCCbBTC_945 = 'morphobluelbtccbbtc_945', // LBTC/cbBTC
  MorphoBlueUSRUSDC_915 = 'morphoblueusrusdc_915', // USR/USDC
  MorphoBlueSyrupUSDCUSDC_915 = 'morphobluesyrupusdcusdc_915', // syrupUSDC/USDC
  MorphoBluesUSDSUSDT_965 = 'morphobluesusdsusdt_965', // sUSDS/USDT
  MorphoBlueSUSDeUSDtb_915 = 'morphobluesusdeusdtb_915', // sUSDe/USDTb
  MorphoBlueUSDeUSDtb_915 = 'morphoblueusdeusdtb_915', // USDe/USDTb
  MorphoBlueEthUSDT_915 = 'morphoblueethusdt_915', // ETH/USDT
  MorphoBlueRsEthEth_945 = 'morphobluersetheth_945', // rsETH/ETH
  MorphoBlueRswEthEth_945 = 'morphobluerswetheth_945', // rswETH/ETH
  MorphoBluePTweETHUSDA_860 = 'morphoblueptweethusda_860', // PTweETH/USDA
  MorphoBlueSwBTCWBTC_945 = 'morphoblueswbtcwbtc_945', // swBTC/WBTC

  // ezETH/ETH
  MorphoBlueEzEthEth_860 = 'morphoblueezetheth_860',
  MorphoBlueEzEthEth_945 = 'morphoblueezetheth_945',
  // weETH/ETH
  MorphoBlueWeEthEth_945 = 'morphoblueweetheth_945',
  // wstETH/WETH
  MorphoBlueWstEthEth_945 = 'morphobluewstetheth_945',
  MorphoBlueWstEthEth_945_Exchange_Rate = 'morphobluewstetheth_945_exchange_rate',
  MorphoBlueWstEthEth_965_Exchange_Rate = 'morphobluewstetheth_965_exchange_rate',
  // sUSDe/DAI
  MorphoBlueSUSDeDAI_860 = 'morphobluesusdedai_860',
  MorphoBlueSUSDeDAI_915 = 'morphobluesusdedai_915',
  MorphoBlueSUSDeDAI_945 = 'morphobluesusdedai_945',
  MorphoBlueSUSDeDAI_777 = 'morphobluesusdedai_777',
  // USDe/DAI
  MorphoBlueUSDeDAI_860 = 'morphoblueusdedai_860',
  MorphoBlueUSDeDAI_915 = 'morphoblueusdedai_915',
  MorphoBlueUSDeDAI_945 = 'morphoblueusdedai_945',
  MorphoBlueUSDeDAI_777 = 'morphoblueusdedai_777',

  MorphoBlueMORPHOUSDC_625 = 'morphobluemorphousdc_625',

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
  MorphoBlueWETHEURC_860_Base = 'morphobluewetheurc_860_base', // WETH/EURC
  MorphoBlueCbEthEURC_860_Base = 'morphobluecbetheurc_860_base', // cbETH/EURC
  MorphoBlueWeEthEth_945_Base = 'morphoblueweetheth_945_base', // weETH/ETH 0.945
  MorphoBlueWeEthEth_915_Base = 'morphoblueweetheth_915_base', // weETH/ETH 0.915
  MorphoBlueAEROUSDC_625_Base = 'morphoblueaerousdc_625_base', // AERO/USDC
  MorphoBlueWeEthUSDC_777_Base = 'morphoblueweethusdc_777_base', // weETH/USDC
  MorphoBlueEzEthUsdc_777_Base = 'morphoblueezethusdc_777_base', // ezETH/USDC
  MorphoBlueEzEthEth_777_Base = 'morphoblueezetheth_777_base', // ezETH/ETH
  MorphoBlueBsdEthEth_860_Base = 'morphobluebsdetheth_860_base', // bsdETH/ETH

  // ARBITRUM
  MorphoBlueSyrupUSDCUSDC_915_Arb = 'morphobluesyrupusdcusdc_915_arb', // syrupUSDC/USDC
  MorphoBlueWBTCUSDC_860_Arb = 'morphobluewbtcusdc_860_arb', // WBTC/USDC
  MorphoBlueWstEthUSDC_860_Arb = 'morphobluewstethusdc_860_arb', // wstETH/USDC
  MorphoBlueEthUSDC_860_Arb = 'morphoblueethusdc_860_arb', // ETH/USDC
  MorphoBluesUSDSUSDC_945_Arb = 'morphobluesusdsusdc_945_arb', // sUSDS/USDC

  // DEV-13004 MAINNET
  MorphoBluePRIMEPYUSD_860 = 'morphoblueprimepyusd_860', // PRIME/PYUSD 0.86
  MorphoBlueKBTCRLUSD_860 = 'morphobluekbtcrlusd_860', // kBTC/RLUSD 0.86
  MorphoBlueKBTCPYUSD_860 = 'morphobluekbtcpyusd_860', // kBTC/PYUSD 0.86
  MorphoBlueWstEthUSDC_860 = 'morphobluewstethusdc_860', // wstETH/USDC 0.86
  MorphoBlueSyrupUSDCPYUSD_915 = 'morphobluesyrupusdcpyusd_915', // syrupUSDC/PYUSD 0.915
  MorphoBlueWBTCUSDC_860 = 'morphobluewbtcusdc_860', // WBTC/USDC 0.86
  MorphoBlueCbBTCUSDC_860_bc99de6a = 'morphobluecbbtcusdc_860_bc99de6a', // cbBTC/USDC 0.86
  MorphoBlueWeEthRLUSD_860 = 'morphoblueweethrlusd_860', // weETH/RLUSD 0.86
  MorphoBlueWeEthPYUSD_860 = 'morphoblueweethpyusd_860', // weETH/PYUSD 0.86
  MorphoBlueCbBTCUSDT_860 = 'morphobluecbbtcusdt_860', // cbBTC/USDT 0.86
  MorphoBlueLBTCPYUSD_860 = 'morphobluelbtcpyusd_860', // LBTC/PYUSD 0.86
  MorphoBlueSUSDePYUSD_915 = 'morphobluesusdepyusd_915', // sUSDe/PYUSD 0.915
  MorphoBlueWBTCUSDT_860 = 'morphobluewbtcusdt_860', // WBTC/USDT 0.86
  MorphoBlueWstEthUSDT_860 = 'morphobluewstethusdt_860', // wstETH/USDT 0.86
  MorphoBlueSyrupUSDCRLUSD_915 = 'morphobluesyrupusdcrlusd_915', // syrupUSDC/RLUSD 0.915
  MorphoBlueWeEthUSDC_770 = 'morphoblueweethusdc_770', // weETH/USDC 0.77
  MorphoBlueEthUSDC_860_94b823e6 = 'morphoblueethusdc_860_94b823e6', // ETH/USDC 0.86
  MorphoBlueUSD3USDC_915 = 'morphoblueusd3usdc_915', // USD3/USDC 0.915
  MorphoBlueStUSDSUSDC_860 = 'morphobluestusdsusdc_860', // stUSDS/USDC 0.86
  MorphoBlueCbBTCRLUSD_860 = 'morphobluecbbtcrlusd_860', // cbBTC/RLUSD 0.86
  MorphoBlueWBTCEth_915 = 'morphobluewbtceth_915', // WBTC/ETH 0.915
  MorphoBlueCbBTCEth_915_12dbf493 = 'morphobluecbbtceth_915_12dbf493', // cbBTC/ETH 0.915
  MorphoBlueWeEthUSDT_860 = 'morphoblueweethusdt_860', // weETH/USDT 0.86
  MorphoBlueSyrupUSDTUSDT_915 = 'morphobluesyrupusdtusdt_915', // syrupUSDT/USDT 0.915
  MorphoBlueCbBTCPYUSD_860 = 'morphobluecbbtcpyusd_860', // cbBTC/PYUSD 0.86
  MorphoBlueWeEthUSDT_770 = 'morphoblueweethusdt_770', // weETH/USDT 0.77
  MorphoBlueEthUSDT_860 = 'morphoblueethusdt_860', // ETH/USDT 0.86
  MorphoBlueWBTCRLUSD_860 = 'morphobluewbtcrlusd_860', // WBTC/RLUSD 0.86
  MorphoBlueWBTCPYUSD_860 = 'morphobluewbtcpyusd_860', // WBTC/PYUSD 0.86
  // DEV-13004 BASE
  MorphoBlueUSDeUSDC_915_Base = 'morphoblueusdeusdc_915_base', // USDe/USDC 0.915
  MorphoBlueCbEthUSDC_770_Base = 'morphobluecbethusdc_770_base', // cbETH/USDC 0.77
  MorphoBlueCbXRPUSDC_625_Base = 'morphobluecbxrpusdc_625_base', // cbXRP/USDC 0.625
  // DEV-13004 ARBITRUM
  MorphoBlueWeEthUSDC_860_Arb = 'morphoblueweethusdc_860_arb', // weETH/USDC 0.86
  MorphoBluesUSDSUSDT0_945_Arb = 'morphobluesusdsusdt0_945_arb', // sUSDS/USDT0 0.945
  MorphoBlueWeEthUSDT0_860_Arb = 'morphoblueweethusdt0_860_arb', // weETH/USDT0 0.86
  MorphoBlueEthUSDT0_860_Arb = 'morphoblueethusdt0_860_arb', // ETH/USDT0 0.86
  MorphoBlueWstEthUSDT0_860_Arb = 'morphobluewstethusdt0_860_arb', // wstETH/USDT0 0.86
  MorphoBlueWBTCUSDT0_860_Arb = 'morphobluewbtcusdt0_860_arb', // WBTC/USDT0 0.86
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
  loanToken: EthAddress,
  collateralToken: EthAddress,
  oracle: EthAddress,
  oracleType: MorphoBlueOracleType,
  irm: EthAddress,
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
  supplyIncentives: IncentiveData[],
  borrowIncentives: IncentiveData[],
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
  leveragedType: LeverageType,
  leveragedAsset?: string,
  currentVolatilePairRatio?: string,
  liquidationPrice?: string,
  minCollRatio?: string,
  collLiquidationRatio?: string,
  exposure: string,
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
  leveragedType: LeverageType,
  leveragedAsset?: string,
  currentVolatilePairRatio?: string,
  liquidationPrice?: string,
  supplyShares: string,
  borrowShares: string,
  exposure: string,
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
  marketId: string,
}

export interface MorphoBluePublicAllocatorItem {
  vault: MorphoBlueVault,
  assets: string,
  withdrawMarket: MorphoBlueAllocationMarket,
}

export interface MorphoBlueAllocatorMarketState {
  borrowAssets: string,
  supplyAssets: string,
}

export interface MorphoBlueRealloactionMarketData {
  reallocatableLiquidityAssets: string,
  publicAllocatorSharedLiquidity: MorphoBluePublicAllocatorItem[],
  state: MorphoBlueAllocatorMarketState,
}
