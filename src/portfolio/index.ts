import Dec from 'decimal.js';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import {
  AaveMarkets,
  AaveV4Spokes,
  CompoundMarkets,
  CrvUsdMarkets,
  LiquityV2Markets,
  LlamaLendMarkets,
  MakerActiveIlks,
  MorphoBlueMarkets,
  SparkMarkets,
} from '../markets';
import { _getMorphoBlueAccountData, _getMorphoBluePortfolioMarketData, getMorphoEarn } from '../morphoBlue';
import {
  AaveVersions,
  CdpInfo,
  CompoundVersions,
  LiquityV2MarketData,
  LiquityV2Versions,
  PortfolioData,
  PortfolioDataOptions,
  PortfolioLiquityV2Troves,
  PortfolioMarketsData,
  PortfolioMarketsErrors,
  PortfolioMarketsResult,
  PortfolioPositionsData,
  PortfolioPositionsDataForAddress,
  PortfolioRewardsData,
  PortfolioStakingPositionsData,
  PortfolioUserData,
  ShifterPortfolioMarketsData,
} from '../types';
import { _getCompoundV3AccountData, _getCompoundV3MarketsData } from '../compoundV3';
import { _getSparkAccountData, _getSparkMarketsData } from '../spark';
import { _getCurveUsdGlobalData, _getCurveUsdUserData } from '../curveUsd';
import { _getLlamaLendGlobalData, _getLlamaLendUserData } from '../llamaLend';
import { _getAaveV3AccountData, _getAaveV3MarketData, getStakeAaveData } from '../aaveV3';
import { _getAaveV4AccountData, _getAaveV4SpokeData } from '../aaveV4';
import { ZERO_ADDRESS } from '../constants';
import { _getMakerCdpData, _getMakerIlksData, _getUserCdps } from '../maker';
import { _getAaveV2AccountData, _getAaveV2MarketsData } from '../aaveV2';
import { _getCompoundV2AccountData, _getCompoundV2MarketsData } from '../compoundV2';
import { getViemProvider } from '../services/viem';
import { _getLiquityTroveInfo, getLiquityStakingData } from '../liquity';
import {
  _getLiquityV2MarketData, _getLiquityV2TroveData, _getLiquityV2UsersTroveIds, getLiquitySAndYBold, getLiquityV2Staking,
} from '../liquityV2';
import { _getAllFluidMarketDataPortfolio, _getAllUserEarnPositionsWithFTokens, _getUserPositionsPortfolio } from '../fluid';
import { getUmbrellaData } from '../umbrella';
import { getMerklUnclaimedRewards, getUnclaimedRewardsForAllMarkets } from '../claiming/aaveV3';
import { fetchSparkAirdropRewards, fetchSparkRewards } from '../claiming/spark';
import { getKingRewards } from '../claiming/king';
import { fetchEthenaAirdropRewards } from '../claiming/ethena';
import { getUniswapRewards } from '../claiming/uniswap';
import {
  aaveV3Lending, LENDING_PROTOCOLS, LendingKey, morphoBlueLending, requireMarket, sparkLending,
} from './lendingProtocols';

type PortfolioClient = ReturnType<typeof getViemProvider>;

/** The markets of the protocols read by their own code below; LENDING_PROTOCOLS has the others'. */
const getPortfolioMarkets = (network: NetworkNumber) => ({
  liquityV2Markets: [NetworkNumber.Eth].includes(network) ? Object.values(LiquityV2Markets(network)) : [],
  liquityV2MarketsStaking: [NetworkNumber.Eth].includes(network) ? Object.values(LiquityV2Markets(network)).filter(market => !market.isLegacy) : [],
});

const getPortfolioClients = (provider: EthereumProvider, defaultProvider: EthereumProvider, network: NetworkNumber, isSim: boolean) => {
  // batchSize is viem's cap on a batch's raw subcall calldata (bytes); the JSON-RPC body ends up
  // ~4x larger (hex + aggregate3 ABI + JSON overhead) and RPC providers reject bodies over
  // ~2.5MB with HTTP 413, so keep this small enough that no single body gets near that.
  // 250k gives the largest body of around 1.26MB - if we bump, we can save maybe 2-3 rpc calls but scaling takes a hit
  // (e.g. adding new markets may result in body size going over alchemy body size limit)
  const args: [NetworkNumber, any?] = [network, { batch: { multicall: { batchSize: isSim ? 2_000 : 250_000 } } }];
  return {
    client: getViemProvider(provider, ...args),
    defaultClient: getViemProvider(defaultProvider, ...args),
  };
};

const _getPortfolioMarketsData = async (client: PortfolioClient, defaultClient: PortfolioClient, network: NetworkNumber): Promise<PortfolioMarketsResult> => {
  const { liquityV2Markets } = getPortfolioMarkets(network);

  const markets: PortfolioMarketsData = {
    morphoMarketsData: {},
    morphoMidnightMarketsData: {},
    compoundV3MarketsData: {},
    sparkMarketsData: {},
    aaveV3MarketsData: {},
    aaveV2MarketsData: {},
    compoundV2MarketsData: {},
    crvUsdMarketsData: {},
    llamaLendMarketsData: {},
    liquityV2MarketsData: {},
    aaveV4SpokesData: {},
  };
  const liquityV2Failed: Record<string, string> = {};

  const [lendingFailed] = await Promise.all([
    Promise.all(LENDING_PROTOCOLS.map(async (protocol) => [protocol.marketsKey, await protocol.readMarkets({ client, defaultClient, network }, markets)] as const)),
    // Liquity V2's markets: its troves are read by their own code below.
    ...liquityV2Markets.map(async (market) => {
      try {
        markets.liquityV2MarketsData[market.value] = await _getLiquityV2MarketData(client, network, market);
      } catch (error) {
        console.error(`Error fetching liquityV2MarketsData for market ${market.value}:`, error);
        liquityV2Failed[market.value] = `Error fetching liquityV2MarketsData for market ${market.value}`;
      }
    }),
  ]);

  // A market that failed is left out of markets and named here, under its protocol's key.
  const errors: PortfolioMarketsErrors = {};
  for (const [key, failed] of [...lendingFailed, ['liquityV2MarketsData', liquityV2Failed] as const]) {
    if (Object.keys(failed).length) errors[key] = failed;
  }
  return { markets, errors };
};

const _getPortfolioUserData = async (
  client: PortfolioClient,
  network: NetworkNumber,
  addresses: EthAddress[],
  marketsData: Promise<PortfolioMarketsData>,
  isSim: boolean,
  options: PortfolioDataOptions,
): Promise<PortfolioUserData> => {
  const isMainnet = network === NetworkNumber.Eth;
  const includePositions = options.positions !== false;
  const includeStaking = options.staking !== false;
  const includeRewards = options.rewards !== false;
  const includeLiquityV2 = includePositions && options.liquityV2 === true;
  // The addresses positions, staking, rewards and Liquity V2 troves are read for: none when left out, so their fetches
  // below make no calls.
  const positionsAddresses = includePositions ? addresses : [];
  const stakingAddresses = includeStaking ? addresses : [];
  const rewardsAddresses = includeRewards ? addresses : [];
  const liquityV2Addresses = includeLiquityV2 ? addresses : [];
  const isFluidSupported = [NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Base, NetworkNumber.Plasma].includes(network);

  const { liquityV2Markets, liquityV2MarketsStaking } = getPortfolioMarkets(network);

  const positions: PortfolioPositionsData = {};
  const stakingPositions: PortfolioStakingPositionsData = {};
  const rewardsData: PortfolioRewardsData = {};
  const makerCdpsErrors: Record<EthAddress, string> = {};

  for (const address of positionsAddresses) {
    positions[address.toLowerCase() as EthAddress] = {
      // Every registry protocol, keyed by market as its reads fill it in.
      ...Object.fromEntries(LENDING_PROTOCOLS.map((protocol) => [protocol.key, {}])) as Pick<PortfolioPositionsDataForAddress, LendingKey>,
      maker: {},
      liquity: {},
      fluid: {
        error: '',
        data: {},
      },
      ...(includeLiquityV2 ? { liquityV2: {} } : {}),
    };
  }

  // TODO: check default values, probably needed when fetching portfolio on unsupported networks
  for (const address of stakingAddresses) {
    stakingPositions[address.toLowerCase() as EthAddress] = {
      aaveV3: {},
      morphoBlue: {},
      compoundV3: {},
      spark: {},
      aaveV2: {},
      compoundV2: {},
      liquity: {},
      liquityV2: {},
      fluid: {
        error: '',
        data: {},
      },
      // Set by the sBOLD/yBOLD fetch below, whether it succeeds or fails.
      liquityV2SBoldYBold: { error: '', data: null },
    };
  }

  for (const address of rewardsAddresses) {
    // merkl, spk, king and uniswap are set by their fetches below, whether they succeed or fail.
    rewardsData[address.toLowerCase() as EthAddress] = {
      merkl: { error: '', data: null },
      aaveV3: {},
      spark: {},
      spk: { error: '', data: null },
      king: { error: '', data: null },
      ethena: {},
      uniswap: { error: '', data: null },
    };
  }

  // Everything starts at once; a read that needs a market's data waits for marketsData.
  await Promise.all([
    // === POSITIONS THAT DO NOT NEED MARKET DATA ===
    // Maker: the address's vault list, then each vault. A failed list is reported in errors.makerCdps: maker stays {},
    // which would otherwise read as "no vaults".
    ...positionsAddresses.map(async (address) => {
      if (!isMainnet) return; // Maker CDPs are only available on mainnet
      let cdps: CdpInfo[];
      try {
        cdps = await _getUserCdps(client, network, address);
      } catch (error) {
        console.error(`Error fetching Maker CDPs for address ${address}:`, error);
        makerCdpsErrors[address.toLowerCase() as EthAddress] = `Error fetching Maker CDPs for address ${address}`;
        return;
      }
      await Promise.all(cdps.map(async (cdpInfo) => {
        try {
          const cdpData = await _getMakerCdpData(client, network, cdpInfo);
          if (cdpData) {
            positions[address.toLowerCase() as EthAddress].maker[cdpInfo.id] = { error: '', data: cdpData };
          }
        } catch (error) {
          console.error(`Error fetching Maker CDP data for address ${address} with ID ${cdpInfo.id}:`, error);
          positions[address.toLowerCase() as EthAddress].maker[cdpInfo.id] = { error: `Error fetching Maker CDP data for address ${address} with ID ${cdpInfo.id}`, data: null };
        }
      }));
    }),
    ...positionsAddresses.map(async (address) => {
      try {
        if (!isFluidSupported) return; // Fluid is not available on Optimism
        const userPositions = (await _getUserPositionsPortfolio(client, network, address));
        for (const position of userPositions) {
          if (position.userData && new Dec(position.userData.suppliedUsd).gt(0)) {
            positions[address.toLowerCase() as EthAddress].fluid.data[position.userData.nftId] = position.userData;
          }
        }
      } catch (error) {
        console.error(`Error fetching Fluid positions for address ${address}:`, error);
        positions[address.toLowerCase() as EthAddress].fluid = {
          error: `Error fetching Fluid positions for address ${address}`,
          data: {},
        };
      }
    }),
    ...positionsAddresses.map(async (address) => {
      try {
        if (!isMainnet) return; // Liquity trove info is only available on mainnet
        const troveInfo = await _getLiquityTroveInfo(client, network, address);
        if (new Dec(troveInfo.collateral).gt(0)) positions[address.toLowerCase() as EthAddress].liquity = { error: '', data: troveInfo };
      } catch (error) {
        console.error(`Error fetching Liquity trove info for address ${address}:`, error);
        positions[address.toLowerCase() as EthAddress].liquity = { error: `Error fetching Liquity trove info for address ${address}`, data: null };
      }
    }),

    // === STAKING DATA (independent of market data; Morpho Earn is with the positions below) ===
    ...stakingAddresses.map(async (address) => {
      try {
        if (!isFluidSupported) return;
        stakingPositions[address.toLowerCase() as EthAddress].fluid = await _getAllUserEarnPositionsWithFTokens(client, network, address);
      } catch (error) {
        console.error(`Error fetching Fluid lend data for address ${address}:`, error);
        stakingPositions[address.toLowerCase() as EthAddress].fluid = { error: `Error fetching Fluid lend data for address ${address}`, data: null };
      }
    }),
    ...stakingAddresses.map(async (address) => {
      try {
        if (!isMainnet) return;
        stakingPositions[address.toLowerCase() as EthAddress].liquity = await getLiquityStakingData(client, network, address);
      } catch (error) {
        console.error(`Error fetching Liquity staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase() as EthAddress].liquity = { error: `Error fetching Liquity staking data for address ${address}`, data: null };
      }
    }),
    ...stakingAddresses.map(async (address) => {
      try {
        if (!isMainnet) return;
        stakingPositions[address.toLowerCase() as EthAddress].aaveV3 = await getStakeAaveData(client, network, address);
      } catch (error) {
        console.error(`Error fetching Aave V3 staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase() as EthAddress].aaveV3 = { error: `Error fetching Aave V3 staking data for address ${address}`, data: null };
      }
    }),
    ...stakingAddresses.map(async (address) => {
      try {
        if (!isMainnet) return;
        stakingPositions[address.toLowerCase() as EthAddress].umbrella = await getUmbrellaData(client, network, address);
      } catch (error) {
        console.error(`Error fetching Umbrella staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase() as EthAddress].umbrella = { error: `Error fetching Umbrella staking data for address ${address}`, data: null };
      }
    }),
    // Liquity V2 stability pools, then sBOLD/yBOLD, which reads them.
    ...stakingAddresses.map(async (address) => {
      await Promise.all(liquityV2MarketsStaking.map(async (market) => {
        try {
          if (!isMainnet) {
            stakingPositions[address.toLowerCase() as EthAddress].liquityV2[market.value] = { error: '', data: null };
            return;
          }
          const liquityV2StakingData = await getLiquityV2Staking(client, network, market.value, address);
          stakingPositions[address.toLowerCase() as EthAddress].liquityV2[market.value] = { error: '', data: liquityV2StakingData };
        } catch (error) {
          console.error(`Error fetching Liquity V2 staking data for address ${address}, market ${market.value}:`, error);
          stakingPositions[address.toLowerCase() as EthAddress].liquityV2[market.value] = { error: `Error fetching Liquity V2 staking data for address ${address}`, data: null };
        }
      }));
      try {
        if (!isMainnet) {
          stakingPositions[address.toLowerCase() as EthAddress].liquityV2SBoldYBold = { error: '', data: null };
          return;
        }
        const data = await getLiquitySAndYBold(client, network, stakingPositions[address.toLowerCase() as EthAddress].liquityV2, address);
        stakingPositions[address.toLowerCase() as EthAddress].liquityV2SBoldYBold = { error: '', data };
      } catch (error) {
        console.error(`Error fetching SBold/YBold data for address ${address}:`, error);
        stakingPositions[address.toLowerCase() as EthAddress].liquityV2SBoldYBold = { error: `Error fetching sBold/yBold data for address ${address}`, data: null };
      }
    }),

    // === REWARDS DATA (independent of market data) ===
    // Batch King rewards
    (async () => {
      try {
        if (!isMainnet) {
          for (const address of rewardsAddresses) {
            rewardsData[address.toLowerCase() as EthAddress].king = { error: '', data: [] };
          }
          return;
        }
        const kingRewards = await getKingRewards(client, network, rewardsAddresses);
        for (const address of rewardsAddresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].king = {
            error: '',
            data: kingRewards[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching King rewards data in batch:', error);
        for (const address of rewardsAddresses) {
          rewardsData[address.toLowerCase() as EthAddress].king = {
            error: 'Error fetching King rewards data in batch',
            data: null,
          };
        }
      }
    })(),
    // Batch UNI rewards
    (async () => {
      try {
        if (!isMainnet) {
          for (const address of rewardsAddresses) {
            rewardsData[address.toLowerCase() as EthAddress].uniswap = { error: '', data: [] };
          }
          return;
        }
        const uniswapRewards = await getUniswapRewards(client, network, rewardsAddresses);
        for (const address of rewardsAddresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].uniswap = {
            error: '',
            data: uniswapRewards[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching Uniswap rewards data in batch:', error);
        for (const address of rewardsAddresses) {
          rewardsData[address.toLowerCase() as EthAddress].uniswap = {
            error: 'Error fetching Uniswap rewards data in batch',
            data: null,
          };
        }
      }
    })(),
    ...sparkLending.markets(network).map((market) => rewardsAddresses.map(async address => {
      try {
        if (!isMainnet) {
          rewardsData[address.toLowerCase() as EthAddress].spark[market.value] = { error: '', data: [] };
          return;
        }
        const sparkData = await fetchSparkRewards(client, network, address, market.providerAddress);
        rewardsData[address.toLowerCase() as EthAddress].spark[market.value] = { error: '', data: sparkData };
      } catch (error) {
        console.error(`Error fetching Spark rewards data for address ${address}, market ${market.value}:`, error);
        rewardsData[address.toLowerCase() as EthAddress].spark[market.value] = { error: `Error fetching Spark rewards data for address ${address}`, data: null };
      }
    })).flat(),
    ...rewardsAddresses.map(async (address) => {
      try {
        const merklData = await getMerklUnclaimedRewards(address, network);
        rewardsData[address.toLowerCase() as EthAddress].merkl = { error: '', data: merklData };
      } catch (error) {
        console.error(`Error fetching Merkl rewards data for address ${address}:`, error);
        rewardsData[address.toLowerCase() as EthAddress].merkl = { error: `Error fetching Merkl rewards data for address ${address}`, data: null };
      }
    }),
    ...aaveV3Lending.markets(network).map(market => rewardsAddresses.map(async (address) => {
      try {
        const aaveData = await getUnclaimedRewardsForAllMarkets(client, network, address, market.providerAddress);
        rewardsData[address.toLowerCase() as EthAddress].aaveV3[market.value] = { error: '', data: aaveData };
      } catch (error) {
        console.error(`Error fetching Aave V3 Merit rewards data for address ${address}:`, error);
        // This market only: the other markets keep their rewards.
        rewardsData[address.toLowerCase() as EthAddress].aaveV3[market.value] = { error: `Error fetching Aave V3 rewards data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    // Batch Spark Airdrop rewards
    (async () => {
      try {
        if (!isMainnet) {
          for (const address of rewardsAddresses) {
            rewardsData[address.toLowerCase() as EthAddress].spk = { error: '', data: [] };
          }
          return;
        }

        const sparkAirdropRewards = await fetchSparkAirdropRewards(client, network, rewardsAddresses);
        for (const address of rewardsAddresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].spk = {
            error: '',
            data: sparkAirdropRewards[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching Spark Airdrop rewards data in batch:', error);
        for (const address of rewardsAddresses) {
          rewardsData[address.toLowerCase() as EthAddress].spk = {
            error: 'Error fetching Spark Airdrop rewards data in batch',
            data: null,
          };
        }
      }
    })(),
    (async () => {
      try {
        if (!isMainnet) {
          return;
        }

        const ethenaAirdropRewards = await fetchEthenaAirdropRewards(rewardsAddresses);
        for (const address of rewardsAddresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].ethena = {
            error: '',
            data: ethenaAirdropRewards[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching Ethena Airdrop rewards data:', error);
        for (const address of rewardsAddresses) {
          rewardsData[address.toLowerCase() as EthAddress].ethena = {
            error: 'Error fetching Ethena Airdrop rewards data in batch',
            data: null,
          };
        }
      }
    })(),

    // === POSITIONS ON MARKETS (each waits for its market's data) ===
    ...LENDING_PROTOCOLS.flatMap((protocol) => protocol.readPositions({ client, network }, positionsAddresses, marketsData, positions)),
    // Morpho Blue Earn: a supply without a borrow, kept as staking, read on the same markets as Morpho Blue's positions.
    ...morphoBlueLending.markets(network).flatMap((market) => stakingAddresses.map(async (address) => {
      try {
        const marketData = requireMarket((await marketsData).morphoMarketsData, market.value);
        const earnData = await getMorphoEarn(client, network, address, market, marketData);
        if (earnData && new Dec(earnData.amount).gt(0)) {
          stakingPositions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: '', data: earnData };
        }
      } catch (error) {
        console.error(`Error fetching MorphoBlue earn data for address ${address} on market ${market.value}:`, error);
        stakingPositions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: `Error fetching MorphoBlue earn data for address ${address} on market ${market.value}`, data: null };
      }
    })),
    // Liquity V2 troves: one market's trove ids for every address at once, then each trove's data. A failure is the
    // market's error; the troves that did load stay in its data.
    ...(liquityV2Addresses.length ? liquityV2Markets : []).map(async (market) => {
      const setEntry = (address: EthAddress, entry: PortfolioLiquityV2Troves) => {
        positions[address.toLowerCase() as EthAddress].liquityV2![market.value] = entry;
      };
      const failAll = (error: string) => liquityV2Addresses.forEach((address) => setEntry(address, { error, data: {} }));

      const allMarketsData = (await marketsData).liquityV2MarketsData;
      const marketData = allMarketsData[market.value];
      if (!marketData) {
        failAll(`Error fetching Liquity V2 market data for market ${market.value}`);
        return;
      }
      let troveIds: Record<EthAddress, string[]>;
      try {
        troveIds = await _getLiquityV2UsersTroveIds(client, network, market, marketData.marketData.troveNFTAddress, isSim, liquityV2Addresses);
      } catch (error) {
        console.error(`Error fetching Liquity V2 trove ids on market ${market.value}:`, error);
        failAll(`Error fetching Liquity V2 troves on market ${market.value}`);
        return;
      }
      await Promise.all(liquityV2Addresses.map(async (address) => {
        const entry: PortfolioLiquityV2Troves = { error: '', data: {} };
        const failed: string[] = [];
        await Promise.all((troveIds[address] ?? []).map(async (troveId) => {
          try {
            entry.data[troveId] = await _getLiquityV2TroveData(client, network, {
              selectedMarket: market,
              assetsData: marketData.assetsData,
              troveId,
              allMarketsData: allMarketsData as Record<LiquityV2Versions, LiquityV2MarketData>,
            });
          } catch (error) {
            console.error(`Error fetching Liquity V2 trove ${troveId} for address ${address} on market ${market.value}:`, error);
            failed.push(troveId);
          }
        }));
        if (failed.length) entry.error = `Error fetching Liquity V2 troves ${failed.join(', ')} for address ${address} on market ${market.value}`;
        setEntry(address, entry);
      }));
    }),
  ]);

  return {
    positions,
    stakingPositions,
    rewardsData,
    errors: Object.keys(makerCdpsErrors).length ? { makerCdps: makerCdpsErrors } : {},
  };
};

/**
 * Every market the portfolio reads on a network — the markets half of getPortfolioData, for a caller that keeps
 * markets apart from what it reads per address (a cache shared by many addresses). A market that fails is left out
 * of `markets` and named in `errors`.
 */
export async function getPortfolioMarketsData(provider: EthereumProvider, network: NetworkNumber, defaultProvider: EthereumProvider, isSim = false): Promise<PortfolioMarketsResult> {
  const { client, defaultClient } = getPortfolioClients(provider, defaultProvider, network, isSim);
  return _getPortfolioMarketsData(client, defaultClient, network);
}

/**
 * What the portfolio reads per address — the other half of getPortfolioData — against `markets` from
 * getPortfolioMarketsData. `markets` can be a promise: reads that do not need a market (Maker, Fluid, Liquity, staking,
 * rewards) start at once, and each read on a market waits for it. A position on a market missing from `markets` is an
 * entry with an error.
 */
export async function getPortfolioUserData(
  provider: EthereumProvider,
  network: NetworkNumber,
  addresses: EthAddress[],
  markets: PortfolioMarketsData | Promise<PortfolioMarketsData>,
  isSim = false,
  options: PortfolioDataOptions = {},
): Promise<PortfolioUserData> {
  const { client } = getPortfolioClients(provider, provider, network, isSim);
  return _getPortfolioUserData(client, network, addresses, Promise.resolve(markets), isSim, options);
}

export async function getPortfolioData(provider: EthereumProvider, network: NetworkNumber, defaultProvider: EthereumProvider, addresses: EthAddress[], isSim = false, options: PortfolioDataOptions = {}): Promise<PortfolioData> {
  // One pair of clients for both halves, so their calls batch together.
  const { client, defaultClient } = getPortfolioClients(provider, defaultProvider, network, isSim);
  const marketsResult = _getPortfolioMarketsData(client, defaultClient, network);
  const [{ markets, errors: marketsErrors }, userData] = await Promise.all([
    marketsResult,
    _getPortfolioUserData(client, network, addresses, marketsResult.then((result) => result.markets), isSim, options),
  ]);

  return {
    positions: userData.positions,
    stakingPositions: userData.stakingPositions,
    rewardsData: userData.rewardsData,
    markets,
    errors: {
      ...(Object.keys(marketsErrors).length ? { markets: marketsErrors } : {}),
      ...userData.errors,
    },
  };
}


export async function getShifterPortfolioData(provider: EthereumProvider, network: NetworkNumber, defaultProvider: EthereumProvider, addresses: EthAddress[], isSim = false): Promise<{
  positions: PortfolioPositionsData;
  markets: ShifterPortfolioMarketsData;
}> {
  const isMainnet = network === NetworkNumber.Eth;
  const isFluidSupported = [NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Base, NetworkNumber.Plasma].includes(network);

  const morphoMarkets = Object.values(MorphoBlueMarkets(network)).filter((market) => market.chainIds.includes(network));
  const compoundV3Markets = Object.values(CompoundMarkets(network)).filter((market) => market.chainIds.includes(network) && market.value !== CompoundVersions.CompoundV2);
  const sparkMarkets = Object.values(SparkMarkets(network)).filter((market) => market.chainIds.includes(network));
  const aaveV3Markets = [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const aaveV2Markets = [AaveVersions.AaveV2].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const compoundV2Markets = [CompoundVersions.CompoundV2].map((version) => CompoundMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const crvUsdMarkets = Object.values(CrvUsdMarkets(network)).filter((market) => market.chainIds.includes(network));
  const llamaLendMarkets = [NetworkNumber.Eth, NetworkNumber.Arb].includes(network) ? Object.values(LlamaLendMarkets(network)).filter((market) => market.chainIds.includes(network)) : [];
  const liquityV2Markets = [NetworkNumber.Eth].includes(network) ? Object.values(LiquityV2Markets(network)) : [];
  const aaveV4Spokes = Object.values(AaveV4Spokes(network)).filter((market) => market.chainIds.includes(network));

  const args: [NetworkNumber, any?] = [network, { batch: { multicall: { batchSize: isSim ? 2_000 : 2_500_000 } } }];
  const client = getViemProvider(provider, ...args);
  const defaultClient = getViemProvider(defaultProvider, ...args);

  const markets: ShifterPortfolioMarketsData = {
    morphoMarketsData: {},
    morphoMidnightMarketsData: {}, // Morpho Midnight is not fetched for the shifter; key kept so the payload shape is stable
    compoundV3MarketsData: {},
    sparkMarketsData: {},
    aaveV3MarketsData: {},
    aaveV2MarketsData: {},
    compoundV2MarketsData: {},
    crvUsdMarketsData: {},
    llamaLendMarketsData: {},
    liquityV2MarketsData: {},
    aaveV4SpokesData: {},
    fluidMarketsData: {},
    makerMarketsData: {},
  };
  const makerCdps: Record<string, CdpInfo[]> = {};

  const positions: PortfolioPositionsData = {};

  for (const address of addresses) {
    positions[address.toLowerCase() as EthAddress] = {
      aaveV3: {},
      aaveV4: {},
      morphoBlue: {},
      morphoMidnight: {}, // not fetched for the shifter (see markets above)
      compoundV3: {},
      spark: {},
      maker: {},
      aaveV2: {},
      compoundV2: {},
      liquity: {},
      crvUsd: {},
      llamaLend: {},
      fluid: {
        error: '',
        data: {},
      },
    };
  }

  await Promise.allSettled([
    // === MARKET DATA (needs to be fetched first) ===
    ...morphoMarkets.map(async (market) => {
      markets.morphoMarketsData[market.value] = await _getMorphoBluePortfolioMarketData(client, network, market);
    }),
    ...compoundV3Markets.map(async (market) => {
      markets.compoundV3MarketsData[market.value] = await _getCompoundV3MarketsData(client, network, market, defaultClient);
    }),
    ...sparkMarkets.map(async (market) => {
      markets.sparkMarketsData[market.value] = await _getSparkMarketsData(client, network, market);
    }),
    ...aaveV3Markets.map(async (market) => {
      markets.aaveV3MarketsData[market.value] = await _getAaveV3MarketData(client, network, market);
    }),
    ...aaveV4Spokes.map(async (spoke) => {
      markets.aaveV4SpokesData[spoke.value] = await _getAaveV4SpokeData(client, network, spoke);
    }),
    ...aaveV2Markets.map(async (market) => {
      markets.aaveV2MarketsData[market.value] = await _getAaveV2MarketsData(client, network, market);
    }),
    ...compoundV2Markets.map(async (market) => {
      markets.compoundV2MarketsData[market.value] = await _getCompoundV2MarketsData(client, network);
    }),
    ...crvUsdMarkets.map(async (market) => {
      markets.crvUsdMarketsData[market.value] = await _getCurveUsdGlobalData(client, network, market);
    }),
    ...llamaLendMarkets.map(async (market) => {
      markets.llamaLendMarketsData[market.value] = await _getLlamaLendGlobalData(client, network, market);
    }),
    ...liquityV2Markets.map(async (market) => {
      markets.liquityV2MarketsData[market.value] = await _getLiquityV2MarketData(client, network, market);
    }),
    (async () => {
      if (!isFluidSupported) return;
      try {
        markets.fluidMarketsData = await _getAllFluidMarketDataPortfolio(client, network);
      } catch (error) {
        console.error('Error fetching Fluid markets data:', error);
      }
    })(),
    (async () => {
      if (!isMainnet) return; // Maker CDPs are only available on mainnet
      try {
        markets.makerMarketsData = await _getMakerIlksData(client, network, MakerActiveIlks);
      } catch (error) {
        console.error('Error fetching Maker ilks data:', error);
      }
    })(),

    // === INDEPENDENT USER DATA (doesn't depend on market data) ===
    ...addresses.map(async (address) => {
      if (!isMainnet) return; // Maker CDPs are only available on mainnet
      const makerCdp = await _getUserCdps(client, network, address);
      makerCdps[address.toLowerCase() as EthAddress] = makerCdp;
    }),
    ...addresses.map(async (address) => {
      try {
        if (!isFluidSupported) return; // Fluid is not available on Optimism
        const userPositions = (await _getUserPositionsPortfolio(client, network, address));
        for (const position of userPositions) {
          if (position.userData && new Dec(position.userData.suppliedUsd).gt(0)) {
            positions[address.toLowerCase() as EthAddress].fluid.data[position.userData.nftId] = position.userData;
          }
        }
      } catch (error) {
        console.error(`Error fetching Fluid positions for address ${address}:`, error);
        positions[address.toLowerCase() as EthAddress].fluid = {
          error: `Error fetching Fluid positions for address ${address}`,
          data: {},
        };
      }
    }),
  ]);

  await Promise.all([
    ...aaveV3Markets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getAaveV3AccountData(client, network, address, { selectedMarket: market, ...markets.aaveV3MarketsData[market.value] });
        // Always store the position (even with no supply) so the eMode category is available to the shifter
        positions[address.toLowerCase() as EthAddress].aaveV3[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching AaveV3 account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].aaveV3[market.value] = { error: `Error fetching AaveV3 account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...aaveV4Spokes.map((spoke) => addresses.map(async (address) => {
      try {
        const accData = await _getAaveV4AccountData(client, network, markets.aaveV4SpokesData[spoke.value], address);
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].aaveV4[spoke.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching AaveV4 account data for address ${address} on spoke ${spoke.value}:`, error);
        positions[address.toLowerCase() as EthAddress].aaveV4[spoke.value] = { error: `Error fetching AaveV4 account data for address ${address} on spoke ${spoke.value}`, data: null };
      }
    })).flat(),
    ...morphoMarkets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getMorphoBlueAccountData(client, network, address, market, markets.morphoMarketsData[market.value]);
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching MorphoBlue account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: `Error fetching MorphoBlue account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...compoundV3Markets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getCompoundV3AccountData(client, network, address, ZERO_ADDRESS, { selectedMarket: market, assetsData: markets.compoundV3MarketsData[market.value].assetsData });
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].compoundV3[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching CompoundV3 account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].compoundV3[market.value] = { error: `Error fetching CompoundV3 account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...sparkMarkets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getSparkAccountData(client, network, address, { selectedMarket: market, assetsData: markets.sparkMarketsData[market.value].assetsData, eModeCategoriesData: markets.sparkMarketsData[market.value].eModeCategoriesData });
        // Always store the position (even with no supply) so the eMode category is available to the shifter
        positions[address.toLowerCase() as EthAddress].spark[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching Spark account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].spark[market.value] = { error: `Error fetching Spark account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...addresses.map((address) => (makerCdps[address.toLowerCase() as EthAddress] || []).map(async (cdpInfo) => {
      try {
        // reuse ilk data fetched for the markets payload; ilks outside the active set are fetched on demand
        const cdpData = await _getMakerCdpData(client, network, cdpInfo, markets.makerMarketsData[cdpInfo.ilkLabel]);
        if (cdpData) {
          positions[address.toLowerCase() as EthAddress].maker[cdpInfo.id] = { error: '', data: cdpData };
        }
      } catch (error) {
        console.error(`Error fetching Maker CDP data for address ${address} with ID ${cdpInfo.id}:`, error);
        positions[address.toLowerCase() as EthAddress].maker[cdpInfo.id] = { error: `Error fetching Maker CDP data for address ${address} with ID ${cdpInfo.id}`, data: null };
      }
    })).flat(),
    ...aaveV2Markets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getAaveV2AccountData(client, network, address, markets.aaveV2MarketsData[market.value].assetsData, market);
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].aaveV2[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching AaveV2 account data for address ${address}:`, error);
        positions[address.toLowerCase() as EthAddress].aaveV2[market.value] = { error: `Error fetching AaveV2 account data for address ${address}`, data: null };
      }
    })).flat(),
    ...compoundV2Markets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getCompoundV2AccountData(client, network, address, markets.compoundV2MarketsData[market.value].assetsData);
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].compoundV2[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching CompoundV2 account data for address ${address}:`, error);
        positions[address.toLowerCase() as EthAddress].compoundV2[market.value] = { error: `Error fetching CompoundV2 account data for address ${address}`, data: null };
      }
    })).flat(),
    ...addresses.map(async (address) => {
      try {
        if (!isMainnet) return; // Liquity trove info is only available on mainnet
        const troveInfo = await _getLiquityTroveInfo(client, network, address);
        if (new Dec(troveInfo.collateral).gt(0)) positions[address.toLowerCase() as EthAddress].liquity = { error: '', data: troveInfo };
      } catch (error) {
        console.error(`Error fetching Liquity trove info for address ${address}:`, error);
        positions[address.toLowerCase() as EthAddress].liquity = { error: `Error fetching Liquity trove info for address ${address}`, data: null };
      }
    }),
    ...crvUsdMarkets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getCurveUsdUserData(client, network, address, market, markets.crvUsdMarketsData[market.value].activeBand, markets.crvUsdMarketsData[market.value].borrowRate);
        if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
          positions[address.toLowerCase() as EthAddress].crvUsd[market.value] = { error: '', data: accData };
        }
      } catch (error) {
        console.error(`Error fetching Curve USD account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].crvUsd[market.value] = { error: `Error fetching Curve USD account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...llamaLendMarkets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getLlamaLendUserData(client, network, address, market, markets.llamaLendMarketsData[market.value]);
        if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
          positions[address.toLowerCase() as EthAddress].llamaLend[market.value] = { error: '', data: { ...accData, borrowRate: markets.llamaLendMarketsData[market.value].borrowRate } };
        }
      } catch (error) {
        console.error(`Error fetching LlamaLend account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].llamaLend[market.value] = { error: `Error fetching LlamaLend account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
  ]);

  return {
    positions,
    markets,
  };
}

export * from './discovery';
