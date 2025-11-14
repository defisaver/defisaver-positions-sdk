import { EthAddress } from './common';

export enum ClaimType {
  /** Rewards from AAVE - various tokens & aTokens (supplied to protocol) */
  AAVE_REWARDS = 'AAVE_REWARDS',
  /** Merit rewards from AAVE (various tokens) */
  AAVE_MERIT_REWARDS = 'AAVE_MERIT_REWARDS',
  /** Rewards from Compound V3 (only in COMP) */
  COMPOUND_V3_COMP = 'COMPOUND_V3_COMP',
  /** Rewards from Spark (wstETH only for now) */
  SPARK_REWARDS = 'SPARK_REWARDS',
  /** Rewards from Morpho */
  MORPHO = 'MORPHO',
  /** Rewards from King (prev LTR^2 - received for weETH holding) */
  KING_REWARDS = 'KING_REWARDS',
  /** Spark Airdrop */
  SPARK_AIRDROP = 'SPARK_AIRDROP',
  /** Spark Airdrop */
  SPARK_WST_ETH_REWARDS = 'SPARK_WST_ETH_REWARDS', // TODO: This will be removed once we fully refactor spark rewards

  ETHENA_AIRDROP = 'ETHENA_AIRDROP',
}

type _ClaimableTokenPartial = {
  symbol: string;
  underlyingSymbol: string;
  tokenAddress: EthAddress;
  amount: string;
  walletAddress: EthAddress;
  label: string;
};
export type AaveRewardsClaimableToken = _ClaimableTokenPartial & {
  claimType: ClaimType.AAVE_REWARDS;
  additionalClaimFields: {
    marketAddress: EthAddress;
    aTokenAddresses: string[];
    isAaveToken: boolean;
  };
};
export type AaveMeritRewardsClaimableToken = _ClaimableTokenPartial & {
  claimType: ClaimType.AAVE_MERIT_REWARDS;
  additionalClaimFields: {
    accumulated: string;
    proof: string[];
    decimals: string;
    unclaimed: string;
  };
};

export type SparkRewardsClaimableToken = _ClaimableTokenPartial & {
  claimType: ClaimType.SPARK_REWARDS;
  additionalClaimFields: {
    sparkAssetAddresses: string[];
  };
};

export type KingRewardsClaimableToken = _ClaimableTokenPartial & {
  claimType: ClaimType.KING_REWARDS;
  additionalClaimFields: {
    allRewardsAmount: string;
    merkleRoot: string;
    merkleProofs: string[];
  };
};

export type MorphoClaimableToken = _ClaimableTokenPartial & {
  claimType: ClaimType.MORPHO,
  additionalClaimFields: {
    originalAmount: string,
    merkleProofs: string[];
    distributor: EthAddress;
    isLegacy: boolean;
    txData: string;
  }
};


export type CompoundV3CompClaimableToken = _ClaimableTokenPartial & {
  claimType: ClaimType.COMPOUND_V3_COMP,
  additionalClaimFields: {
    marketAddress: EthAddress;
  }
};

export enum SparkAirdropType {
  SPARK_IGNITION = 'spark-ignition',
  PRE_FARMING_AND_SOCIAL = 'pre-farming-and-social',
}

export type SparkAirdropClaimableToken = _ClaimableTokenPartial & {
  claimType: ClaimType.SPARK_AIRDROP,
  additionalClaimFields: {
    merkleRoot: string;
    merkleProofs: string[];
    epoch: number;
    rewardType: SparkAirdropType;
    allRewardsAmount: string;
  };
};

export type SparkWstEthRewardsClaimableToken = _ClaimableTokenPartial & { claimType: ClaimType.SPARK_WST_ETH_REWARDS };

export type EthenaAirdropClaimableToken = _ClaimableTokenPartial & { claimType: ClaimType.ETHENA_AIRDROP };

export type ClaimableToken =
    AaveRewardsClaimableToken
    | AaveMeritRewardsClaimableToken
    | CompoundV3CompClaimableToken
    | MorphoClaimableToken
    | SparkRewardsClaimableToken
    | KingRewardsClaimableToken
    | SparkAirdropClaimableToken
    | SparkWstEthRewardsClaimableToken
    | EthenaAirdropClaimableToken;
