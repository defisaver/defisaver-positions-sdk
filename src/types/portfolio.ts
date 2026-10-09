import {
  AaveV2MarketData, AaveV2PositionData, AaveV3MarketData, AaveV3PositionData, AaveVersions, StakeAaveData, UmbrellaStakingData,
} from './aave';
import { AaveV4AccountData, AaveV4SpokeData, AaveV4SpokesType } from './aaveV4';
import {
  AaveRewardsClaimableToken,
  EthenaAirdropClaimableToken,
  KingRewardsClaimableToken,
  MerklRewardsClaimableToken,
  SparkAirdropClaimableToken,
  SparkRewardsClaimableToken,
  UniswapAirdropClaimableToken,
} from './claiming';
import { EthAddress } from './common';
import {
  CompoundV2MarketsData, CompoundV2PositionData, CompoundV3MarketsData, CompoundV3PositionData, CompoundVersions,
} from './compound';
import { CrvUSDGlobalMarketData, CrvUSDUserData, CrvUSDVersions } from './curveUsd';
import { FluidEarnPositionData, FluidVaultData } from './fluid';
import { LiquityStakingData, LiquityTroveInfo } from './liquity';
import {
  LiquityV2MarketData, LiquityV2SBoldYBoldData, LiquityV2StakingData, LiquityV2TroveData, LiquityV2Versions,
} from './liquityV2';
import { LlamaLendGlobalMarketData, LlamaLendUserData, LlamaLendVersionsType } from './llamaLend';
import { CdpData } from './maker';
import {
  MorphoBlueEarnData, MorphoBlueMarketInfo, MorphoBluePositionData, MorphoBlueVersions,
} from './morphoBlue';
import { MorphoMidnightMarketInfo, MorphoMidnightPositionData, MorphoMidnightVersions } from './morphoMidnight';
import { SparkMarketsData, SparkPositionData, SparkVersions } from './spark';

export interface PortfolioProtocolData<T> {
  error: string,
  data: T | null,
}

/** A failed fetch of a protocol that, when it succeeds, getPortfolioData returns unwrapped rather than as `{ error, data }`. */
export interface PortfolioProtocolError {
  error: string,
  data: null,
}

/** What getPortfolioData reads besides markets. */
export interface PortfolioDataOptions {
  /** positions (lending); default true. With false it comes back as {} and no lending position is read. */
  positions?: boolean,
  /** stakingPositions; default true. With false it comes back as {} and no staking source is read. */
  staking?: boolean,
  /** rewardsData; default true. With false it comes back as {} and no rewards source is read. */
  rewards?: boolean,
  /**
   * Liquity V2 troves in positions[address].liquityV2; default false, as the DeFi Saver app reads them on its own.
   * Mainnet only: elsewhere liquityV2 is {}. Needs positions.
   */
  liquityV2?: boolean,
}

/** One Liquity V2 market's troves of an address, by trove id — with an error when the ids or any trove failed to load. */
export interface PortfolioLiquityV2Troves {
  error: string,
  data: {
    [troveId: string]: LiquityV2TroveData;
  },
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
  /** Only with the liquityV2 option. Every trove the address holds, by market. */
  liquityV2?: {
    [key in LiquityV2Versions]?: PortfolioLiquityV2Troves;
  };
}

export interface PortfolioPositionsData {
  [key: EthAddress]: PortfolioPositionsDataForAddress;
}

/**
 * The staking positions getPortfolioData returns for an address. The shapes are uneven, and the DeFi Saver app
 * parses them as they are: a protocol read once per address comes back unwrapped on success, as
 * `{ error, data: null }` on failure, and as {} (or Fluid's `{ error: '', data: {} }`) on a network it is not read on.
 */
export interface PortfolioStakingPositionsDataForAddress {
  /** stkAAVE, stkGHO and sGHO; mainnet only. */
  aaveV3: StakeAaveData | PortfolioProtocolError | {};
  /** Morpho Blue supply without a borrow (Earn), by market; only markets with a deposit or an error. */
  morphoBlue: {
    [key in MorphoBlueVersions]?: PortfolioProtocolData<MorphoBlueEarnData>;
  };
  // Never filled; kept so the shape does not change under the app.
  compoundV3: Record<string, never>;
  spark: Record<string, never>;
  aaveV2: Record<string, never>;
  compoundV2: Record<string, never>;
  /** LQTY staking and the LUSD stability pool; mainnet only. */
  liquity: LiquityStakingData | PortfolioProtocolError | {};
  /** Stability pool deposits, by market; mainnet only, legacy markets left out. */
  liquityV2: {
    [key in LiquityV2Versions]?: PortfolioProtocolData<LiquityV2StakingData>;
  };
  /** Fluid lending (fToken) deposits; `{ error: '', data: {} }` on a network without Fluid. */
  fluid: FluidEarnPositionData[] | PortfolioProtocolError | { error: string, data: Record<string, never> };
  /** Umbrella stakes; absent off mainnet. */
  umbrella?: UmbrellaStakingData | PortfolioProtocolError;
  /** sBOLD, yBOLD and stYBOLD; data is null off mainnet. */
  liquityV2SBoldYBold: PortfolioProtocolData<LiquityV2SBoldYBoldData>;
}

// A Record rather than an interface: the app casts getPortfolioData's result to its own Record<string, …> type, and an
// interface with an address index signature is not comparable to one.
export type PortfolioStakingPositionsData = Record<EthAddress, PortfolioStakingPositionsDataForAddress>;

/** The claimable rewards getPortfolioData returns for an address. Off mainnet only Merkl and Aave V3 are read. */
export interface PortfolioRewardsDataForAddress {
  merkl: PortfolioProtocolData<MerklRewardsClaimableToken[]>;
  aaveV3: {
    [key in AaveVersions]?: PortfolioProtocolData<AaveRewardsClaimableToken[]>;
  };
  spark: {
    [key in SparkVersions]?: PortfolioProtocolData<SparkRewardsClaimableToken[]>;
  };
  /** The SPK airdrop. */
  spk: PortfolioProtocolData<SparkAirdropClaimableToken[]>;
  king: PortfolioProtocolData<KingRewardsClaimableToken[]>;
  /** {} off mainnet. */
  ethena: PortfolioProtocolData<EthenaAirdropClaimableToken[]> | {};
  uniswap: PortfolioProtocolData<UniswapAirdropClaimableToken[]>;
}

export type PortfolioRewardsData = Record<EthAddress, PortfolioRewardsDataForAddress>;

/** The `markets` getPortfolioData returns: every market it read, by protocol, keyed by market or spoke. */
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
}

/** The markets that could not be read, by their key in PortfolioMarketsData, then by market or spoke: the error. */
export type PortfolioMarketsErrors = {
  [key in keyof PortfolioMarketsData]?: Record<string, string>;
};

/**
 * What the portfolio fetch could not read and has no `{ error, data }` entry of its own to report it in. A key is
 * present only when something under it failed; {} when everything was read.
 */
export interface PortfolioErrors {
  /** Markets missing from `markets`; every position on such a market is an entry with an error. */
  markets?: PortfolioMarketsErrors;
  /** Addresses whose Maker vault list could not be read: their `maker` is {}, which would otherwise read as "no vaults". */
  makerCdps?: Record<EthAddress, string>;
}

/** getPortfolioMarketsData's result. */
export interface PortfolioMarketsResult {
  /** Every market read; one that failed is missing and named in `errors`. */
  markets: PortfolioMarketsData;
  errors: PortfolioMarketsErrors;
}

/** getPortfolioUserData's result: what is read per address. */
export interface PortfolioUserData {
  positions: PortfolioPositionsData;
  stakingPositions: PortfolioStakingPositionsData;
  rewardsData: PortfolioRewardsData;
  errors: Pick<PortfolioErrors, 'makerCdps'>;
}

/** getPortfolioData's result. */
export interface PortfolioData extends Omit<PortfolioUserData, 'errors'> {
  markets: PortfolioMarketsData;
  errors: PortfolioErrors;
}