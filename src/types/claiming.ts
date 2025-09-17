import { EthAddress, NetworkNumber } from './common';

export enum ClaimableTokensActionType {
  GET_ALL_CLAIMABLE_TOKENS_REQUEST = 'GET_ALL_CLAIMABLE_TOKENS_REQUEST',
  GET_ALL_CLAIMABLE_TOKENS_SUCCESS = 'GET_ALL_CLAIMABLE_TOKENS_SUCCESS',
  GET_ALL_CLAIMABLE_TOKENS_FAILURE = 'GET_ALL_CLAIMABLE_TOKENS_FAILURE',
  GET_CLAIMABLE_TOKENS_REQUEST_FOR_CLAIM_TYPE = 'GET_CLAIMABLE_TOKENS_REQUEST_FOR_CLAIM_TYPE',
  CLAIM_TOKENS_FOR_CLAIM_TYPE_REQUEST = 'CLAIM_TOKENS_FOR_CLAIM_TYPE_REQUEST',
  CLAIM_TOKENS_FOR_CLAIM_TYPE_SUCCESS = 'CLAIM_TOKENS_FOR_CLAIM_TYPE_SUCCESS',
  CLAIM_TOKENS_FOR_CLAIM_TYPE_FAILURE = 'CLAIM_TOKENS_FOR_CLAIM_TYPE_FAILURE',
  GET_CLAIMABLE_TOKENS_SUCCESS_FOR_CLAIM_TYPE = 'GET_CLAIMABLE_TOKENS_SUCCESS_FOR_CLAIM_TYPE',
  GET_CLAIMABLE_TOKENS_FAILURE_FOR_CLAIM_TYPE = 'GET_CLAIMABLE_TOKENS_FAILURE_FOR_CLAIM_TYPE',
}

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

export type ClaimableToken =
    AaveRewardsClaimableToken
    | AaveMeritRewardsClaimableToken
    | CompoundV3CompClaimableToken
    | MorphoClaimableToken
    | SparkRewardsClaimableToken
    | KingRewardsClaimableToken
    | SparkAirdropClaimableToken
    | SparkWstEthRewardsClaimableToken;

export type AaveRewardsAdditionalClaimFields = {
  market: string;
  underlyingAsset: string;
  aTokenAddresses: string[];
};

export type AaveMeritRewardsAdditionalClaimFields = {
  accumulated: string;
  proof: string[];
  decimals: string;
  unclaimed: string;
};

export type AaveRewardsClaimableTokensAction =
    { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_REQUEST_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.AAVE_REWARDS; } }
    | {
      type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_SUCCESS_FOR_CLAIM_TYPE,
      payload: {
        claimType: ClaimType.AAVE_REWARDS; network: NetworkNumber; walletAddress: EthAddress; claimableTokens: ClaimableToken[]
      }
    }
    | { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_FAILURE_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.AAVE_REWARDS; error: string } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_REQUEST, payload: { claimType: ClaimType.AAVE_REWARDS } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_SUCCESS, payload: { claimType: ClaimType.AAVE_REWARDS } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_FAILURE, payload: { claimType: ClaimType.AAVE_REWARDS; error: string } };

export type AaveMeritRewardsClaimableTokensAction =
    { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_REQUEST_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.AAVE_MERIT_REWARDS; } }
    | {
      type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_SUCCESS_FOR_CLAIM_TYPE,
      payload: {
        claimType: ClaimType.AAVE_MERIT_REWARDS; network: NetworkNumber; walletAddress: EthAddress; claimableTokens: ClaimableToken[]
      }
    }
    | { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_FAILURE_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.AAVE_MERIT_REWARDS; error: string } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_REQUEST, payload: { claimType: ClaimType.AAVE_MERIT_REWARDS } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_SUCCESS, payload: { claimType: ClaimType.AAVE_MERIT_REWARDS } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_FAILURE, payload: { claimType: ClaimType.AAVE_MERIT_REWARDS; error: string } };

export type MorphoClaimableTokensAction =
    { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_REQUEST_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.MORPHO; } }
    | {
      type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_SUCCESS_FOR_CLAIM_TYPE,
      payload: {
        claimType: ClaimType.MORPHO; network: NetworkNumber; walletAddress: EthAddress; claimableTokens: ClaimableToken[]
      }
    }
    | { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_FAILURE_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.MORPHO; error: string } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_REQUEST, payload: { claimType: ClaimType.MORPHO } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_SUCCESS, payload: { claimType: ClaimType.MORPHO } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_FAILURE, payload: { claimType: ClaimType.MORPHO; error: string } };

export type SparkRewardsClaimableTokensAction =
    { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_REQUEST_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.SPARK_REWARDS | ClaimType.SPARK_AIRDROP; } }
    | {
      type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_SUCCESS_FOR_CLAIM_TYPE,
      payload: {
        claimType: ClaimType.SPARK_REWARDS | ClaimType.SPARK_AIRDROP; network: NetworkNumber; walletAddress: EthAddress; claimableTokens: ClaimableToken[]
      }
    }
    | { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_FAILURE_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.SPARK_REWARDS | ClaimType.SPARK_AIRDROP; error: string } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_REQUEST, payload: { claimType: ClaimType.SPARK_REWARDS | ClaimType.SPARK_AIRDROP } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_SUCCESS, payload: { claimType: ClaimType.SPARK_REWARDS | ClaimType.SPARK_AIRDROP } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_FAILURE, payload: { claimType: ClaimType.SPARK_REWARDS | ClaimType.SPARK_AIRDROP; error: string } };

export type KingRewardsClaimableTokensAction =
    { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_REQUEST_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.KING_REWARDS; } }
    | {
      type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_SUCCESS_FOR_CLAIM_TYPE,
      payload: {
        claimType: ClaimType.KING_REWARDS; network: NetworkNumber; walletAddress: EthAddress; claimableTokens: ClaimableToken[]
      }
    }
    | { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_FAILURE_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.KING_REWARDS; error: string } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_REQUEST, payload: { claimType: ClaimType.KING_REWARDS } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_SUCCESS, payload: { claimType: ClaimType.KING_REWARDS } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_FAILURE, payload: { claimType: ClaimType.KING_REWARDS; error: string } };

export type CompoundV3RewardsClaimableTokensAction =
    { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_REQUEST_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.COMPOUND_V3_COMP; } }
    | {
      type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_SUCCESS_FOR_CLAIM_TYPE,
      payload: {
        claimType: ClaimType.COMPOUND_V3_COMP; network: NetworkNumber; walletAddress: EthAddress; claimableTokens: ClaimableToken[]
      }
    }
    | { type: ClaimableTokensActionType.GET_CLAIMABLE_TOKENS_FAILURE_FOR_CLAIM_TYPE, payload: { claimType: ClaimType.COMPOUND_V3_COMP; error: string } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_REQUEST, payload: { claimType: ClaimType.COMPOUND_V3_COMP } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_SUCCESS, payload: { claimType: ClaimType.COMPOUND_V3_COMP } }
    | { type: ClaimableTokensActionType.CLAIM_TOKENS_FOR_CLAIM_TYPE_FAILURE, payload: { claimType: ClaimType.COMPOUND_V3_COMP; error: string } };


export type ClaimableTokensAction =
    | { type: ClaimableTokensActionType.GET_ALL_CLAIMABLE_TOKENS_REQUEST }
    | { type: ClaimableTokensActionType.GET_ALL_CLAIMABLE_TOKENS_SUCCESS }
    | { type: ClaimableTokensActionType.GET_ALL_CLAIMABLE_TOKENS_FAILURE, payload: string }
    | AaveRewardsClaimableTokensAction
    | AaveMeritRewardsClaimableTokensAction;
