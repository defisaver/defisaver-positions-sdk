import { AaveV2PositionData, AaveV3PositionData, AaveVersions } from './aave';
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

export interface PortfolioPositionsDataForAddress {
  aaveV3: {
    [key in AaveVersions]?: AaveV3PositionData;
  };
  morphoBlue: {
    [key in MorphoBlueVersions]?: MorphoBluePositionData;
  };
  compoundV3: {
    [key in CompoundVersions]?: CompoundV3PositionData;
  };
  spark: {
    [key in SparkVersions]?: SparkPositionData;
  }
  eulerV2: {
    [key in EulerV2Versions]?: Record<EthAddress, EulerV2PositionData>;
  };
  maker: {
    [key: string]: CdpData;
  };
  aaveV2: {
    [key in AaveVersions]?: AaveV2PositionData;
  };
  compoundV2: {
    [key in CompoundVersions]?: CompoundV2PositionData;
  };
  liquity: LiquityTroveInfo | {};
}

export interface PortfolioPositionsData {
  [key: EthAddress]: PortfolioPositionsDataForAddress;
}

export interface PortfolioPositionsDataSlowerForAddress {
  crvUsd: {
    [key in CrvUSDVersions]?: CrvUSDUserData;
  };
  llamaLend: {
    [key in LlamaLendVersionsType]?: LlamaLendUserData;
  };
  liquityV2: {
    [key in LiquityV2Versions]?: Record<string, LiquityV2TroveData>;
  };
  fluid: {
    [key: string]: FluidVaultData;
  }
}

export interface PortfolioPositionsDataSlower {
  [key: EthAddress]: PortfolioPositionsDataSlowerForAddress;
}