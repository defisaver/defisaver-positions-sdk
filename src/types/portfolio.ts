import { AaveV3PositionData, AaveVersions } from './aave';
import { EthAddress } from './common';
import { CompoundV3PositionData, CompoundVersions } from './compound';
import { CrvUSDUserData, CrvUSDVersions } from './curveUsd';
import { EulerV2PositionData, EulerV2Versions } from './euler';
import { LlamaLendUserData, LlamaLendVersionsType } from './llamaLend';
import { MorphoBluePositionData, MorphoBlueVersions } from './morphoBlue';
import { SparkPositionData, SparkVersions } from './spark';

export interface PortfolioPositionsData {
  [key: EthAddress]: {
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
      [key in EulerV2Versions]?: EulerV2PositionData;
    };
    crvUsd: {
      [key in CrvUSDVersions]?: CrvUSDUserData;
    };
    llamaLend: {
      [key in LlamaLendVersionsType]?: LlamaLendUserData;
    };
  };
}