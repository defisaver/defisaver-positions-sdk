import {
  AaveV2MarketData, AaveV2PositionData, AaveV3MarketData, AaveV3PositionData, AaveVersions,
} from './aave';
import { AaveV4AccountData, AaveV4SpokeData, AaveV4SpokesType } from './aaveV4';
import { EthAddress } from './common';
import {
  CompoundV2MarketsData, CompoundV2PositionData, CompoundV3MarketsData, CompoundV3PositionData, CompoundVersions,
} from './compound';
import { CrvUSDGlobalMarketData, CrvUSDUserData, CrvUSDVersions } from './curveUsd';
import { FluidMarketData, FluidVaultData } from './fluid';
import { LiquityTroveInfo } from './liquity';
import { LiquityV2MarketData, LiquityV2TroveData, LiquityV2Versions } from './liquityV2';
import { LlamaLendGlobalMarketData, LlamaLendUserData, LlamaLendVersionsType } from './llamaLend';
import { CdpData, IlkInfo } from './maker';
import { MorphoBlueMarketInfo, MorphoBluePositionData, MorphoBlueVersions } from './morphoBlue';
import { MorphoMidnightMarketInfo, MorphoMidnightPositionData, MorphoMidnightVersions } from './morphoMidnight';
import { SparkMarketsData, SparkPositionData, SparkVersions } from './spark';

export interface PortfolioProtocolData<T> {
  error: string,
  data: T | null,
}

export interface PortfolioPositionsDataForAddress {
  aaveV3: {
    [key in AaveVersions]?: PortfolioProtocolData<AaveV3PositionData>;
  };
  morphoBlue: {
    [key in MorphoBlueVersions]?: PortfolioProtocolData<MorphoBluePositionData>;
  };
  morphoMidnight: {
    [key in MorphoMidnightVersions]?: PortfolioProtocolData<MorphoMidnightPositionData>;
  };
  compoundV3: {
    [key in CompoundVersions]?: PortfolioProtocolData<CompoundV3PositionData>;
  };
  spark: {
    [key in SparkVersions]?: PortfolioProtocolData<SparkPositionData>;
  };
  maker: {
    [key: string]: PortfolioProtocolData<CdpData>;
  };
  aaveV2: {
    [key in AaveVersions]?: PortfolioProtocolData<AaveV2PositionData>;
  };
  compoundV2: {
    [key in CompoundVersions]?: PortfolioProtocolData<CompoundV2PositionData>;
  };
  liquity: PortfolioProtocolData<LiquityTroveInfo> | {};
  crvUsd: {
    [key in CrvUSDVersions]?: PortfolioProtocolData<CrvUSDUserData>;
  };
  llamaLend: {
    [key in LlamaLendVersionsType]?: PortfolioProtocolData<LlamaLendUserData>;
  };
  fluid: {
    error: string;
    data: {
      [key: string]: FluidVaultData;
    };
  };
  aaveV4: {
    [key in AaveV4SpokesType]?: PortfolioProtocolData<AaveV4AccountData>;
  };
}

export interface PortfolioPositionsData {
  [key: EthAddress]: PortfolioPositionsDataForAddress;
}
export interface PortfolioMarketsData {
  morphoMarketsData: Record<string, MorphoBlueMarketInfo>;
  morphoMidnightMarketsData: Record<string, MorphoMidnightMarketInfo>;
  compoundV3MarketsData: Record<string, CompoundV3MarketsData>;
  sparkMarketsData: Record<string, SparkMarketsData>;
  aaveV3MarketsData: Record<string, AaveV3MarketData>;
  aaveV2MarketsData: Record<string, AaveV2MarketData>;
  compoundV2MarketsData: Record<string, CompoundV2MarketsData>;
  crvUsdMarketsData: Record<string, CrvUSDGlobalMarketData>;
  llamaLendMarketsData: Record<string, LlamaLendGlobalMarketData>;
  liquityV2MarketsData: Record<string, LiquityV2MarketData>;
  aaveV4SpokesData: Record<string, AaveV4SpokeData>;
  fluidMarketsData: Record<string, FluidMarketData>;
  makerMarketsData: Record<string, IlkInfo>;
}
