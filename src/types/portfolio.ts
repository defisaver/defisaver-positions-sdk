import { AaveV2PositionData, AaveV3PositionData, AaveVersions } from './aave';
import { AaveV4AccountData, AaveV4SpokesType } from './aaveV4';
import { EthAddress } from './common';
import { CompoundV2PositionData, CompoundV3PositionData, CompoundVersions } from './compound';
import { CrvUSDUserData, CrvUSDVersions } from './curveUsd';
import { EulerV2PositionData, EulerV2Versions } from './euler';
import { FluidVaultData } from './fluid';
import { LiquityTroveInfo } from './liquity';
import { LiquityV2TroveData, LiquityV2Versions } from './liquityV2';
import { LlamaLendUserData, LlamaLendVersionsType } from './llamaLend';
import { CdpData } from './maker';
import { MorphoBluePositionData, MorphoBlueVersions } from './morphoBlue';
import { SparkPositionData, SparkVersions } from './spark';

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
  compoundV3: {
    [key in CompoundVersions]?: PortfolioProtocolData<CompoundV3PositionData>;
  };
  spark: {
    [key in SparkVersions]?: PortfolioProtocolData<SparkPositionData>;
  };
  eulerV2: {
    [key in EulerV2Versions]?: Record<EthAddress, PortfolioProtocolData<EulerV2PositionData>>;
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