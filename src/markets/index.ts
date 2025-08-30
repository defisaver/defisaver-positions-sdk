export {
  AaveMarkets,
  aaveV1AssetsDefaultMarket,
  aaveV2AssetsDefaultMarket,
  aaveV3AssetsDefaultMarket,
  getAaveV3MarketByMarketAddress,
} from './aave';
export {
  CompoundMarkets,
  compoundV2CollateralAssets,
  v3ETHCollAssets,
  v3USDbCCollAssets,
  v3USDCCollAssets,
  v3USDCeCollAssets,
  v3USDTCollAssets,
} from './compound';
export { SparkMarkets } from './spark';
export { CrvUsdMarkets } from './curveUsd';
export { MorphoBlueMarkets, findMorphoBlueMarket } from './morphoBlue';
export { LlamaLendMarkets } from './llamaLend';
export { LiquityV2Markets, findLiquityV2MarketByAddress } from './liquityV2';
export { EulerV2Markets } from './euler';
export {
  FluidMarkets, getFluidVersionsDataForNetwork, getFluidMarketInfoById, getFTokenAddress, getFluidMarketInfoByAddress,
} from './fluid';
