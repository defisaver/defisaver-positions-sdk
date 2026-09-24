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
  MorphoMidnightMarkets,
  SparkMarkets,
} from '../markets';
import { _getMorphoBlueAccountData, _getMorphoBluePortfolioMarketData, getMorphoEarn } from '../morphoBlue';
import { _getMorphoMidnightAccountData, _getMorphoMidnightMarketData } from '../morphoMidnight';
import {
  AaveV2MarketData,
  AaveV3MarketData,
  AaveV4SpokeData,
  AaveVersions,
  CdpInfo,
  CompoundV2MarketsData,
  CompoundV3MarketsData,
  CompoundVersions,
  CrvUSDGlobalMarketData,
  LiquityV2MarketData,
  LlamaLendGlobalMarketData,
  MorphoBlueMarketInfo,
  MorphoMidnightMarketInfo,
  PortfolioMarketsData,
  PortfolioPositionsData,
  SparkMarketsData,
} from '../types';
import { _getCompoundV3AccountData, _getCompoundV3MarketsData } from '../compoundV3';
import { _getSparkAccountData, _getSparkMarketsData } from '../spark';
import { _getCurveUsdGlobalData, _getCurveUsdUserData } from '../curveUsd';
import { _getLlamaLendGlobalData, _getLlamaLendUserData } from '../llamaLend';
import { _getAaveV3AccountData, _getAaveV3MarketData, getStakeAaveData } from '../aaveV3';
import { ZERO_ADDRESS } from '../constants';
import { _getMakerCdpData, _getMakerIlksData, _getUserCdps } from '../maker';
import { _getAaveV2AccountData, _getAaveV2MarketsData } from '../aaveV2';
import { _getCompoundV2AccountData, _getCompoundV2MarketsData } from '../compoundV2';
import { getViemProvider } from '../services/viem';
import { _getLiquityTroveInfo, getLiquityStakingData } from '../liquity';
import { _getLiquityV2MarketData, getLiquitySAndYBold, getLiquityV2Staking } from '../liquityV2';
import { _getAllFluidMarketDataPortfolio, _getAllUserEarnPositionsWithFTokens, _getUserPositionsPortfolio } from '../fluid';
import { getUmbrellaData } from '../umbrella';
import { getMerklUnclaimedRewards, getUnclaimedRewardsForAllMarkets } from '../claiming/aaveV3';
import { fetchSparkAirdropRewards, fetchSparkRewards } from '../claiming/spark';
import { getKingRewards } from '../claiming/king';
import { fetchEthenaAirdropRewards } from '../claiming/ethena';
import { _getAaveV4AccountData, _getAaveV4SpokeData } from '../aaveV4';
import { getUniswapRewards } from '../claiming/uniswap';

export async function getPortfolioData(provider: EthereumProvider, network: NetworkNumber, defaultProvider: EthereumProvider, addresses: EthAddress[], isSim = false): Promise<{
  positions: PortfolioPositionsData;
  stakingPositions: any;
  rewardsData: any;
  markets: any;
}> {
  const isMainnet = network === NetworkNumber.Eth;
  const isFluidSupported = [NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Base, NetworkNumber.Plasma].includes(network);

  const morphoMarkets = Object.values(MorphoBlueMarkets(network)).filter((market) => market.chainIds.includes(network));
  const morphoMidnightMarkets = Object.values(MorphoMidnightMarkets(network)).filter((market) => market.chainIds.includes(network));
  const compoundV3Markets = Object.values(CompoundMarkets(network)).filter((market) => market.chainIds.includes(network) && market.value !== CompoundVersions.CompoundV2);
  const sparkMarkets = Object.values(SparkMarkets(network)).filter((market) => market.chainIds.includes(network));
  const aaveV3Markets = [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const aaveV2Markets = [AaveVersions.AaveV2].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const compoundV2Markets = [CompoundVersions.CompoundV2].map((version) => CompoundMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const crvUsdMarkets = Object.values(CrvUsdMarkets(network)).filter((market) => market.chainIds.includes(network));
  const llamaLendMarkets = [NetworkNumber.Eth, NetworkNumber.Arb].includes(network) ? Object.values(LlamaLendMarkets(network)).filter((market) => market.chainIds.includes(network)) : [];
  const liquityV2Markets = [NetworkNumber.Eth].includes(network) ? Object.values(LiquityV2Markets(network)) : [];
  const liquityV2MarketsStaking = [NetworkNumber.Eth].includes(network) ? Object.values(LiquityV2Markets(network)).filter(market => !market.isLegacy) : [];
  const aaveV4Spokes = Object.values(AaveV4Spokes(network)).filter((market) => market.chainIds.includes(network));


  // batchSize is viem's cap on a batch's raw subcall calldata (bytes); the JSON-RPC body ends up
  // ~4x larger (hex + aggregate3 ABI + JSON overhead) and RPC providers reject bodies over
  // ~2.5MB with HTTP 413, so keep this small enough that no single body gets near that.
  // 250k gives the largest body of around 1.26MB - if we bump, we can save maybe 2-3 rpc calls but scaling takes a hit
  // (e.g. adding new markets may result in body size going over alchemy body size limit)
  const args: [NetworkNumber, any?] = [network, { batch: { multicall: { batchSize: isSim ? 2_000 : 250_000 } } }];
  const client = getViemProvider(provider, ...args);
  const defaultClient = getViemProvider(defaultProvider, ...args);

  const morphoMarketsData: Record<string, MorphoBlueMarketInfo> = {};
  const morphoMidnightMarketsData: Record<string, MorphoMidnightMarketInfo> = {};
  const compoundV3MarketsData: Record<string, CompoundV3MarketsData> = {};
  const sparkMarketsData: Record<string, SparkMarketsData> = {};
  const aaveV3MarketsData: Record<string, AaveV3MarketData> = {};
  const makerCdps: Record<string, CdpInfo[]> = {};
  const aaveV2MarketsData: Record<string, AaveV2MarketData> = {};
  const compoundV2MarketsData: Record<string, CompoundV2MarketsData> = {};
  const crvUsdMarketsData: Record<string, CrvUSDGlobalMarketData> = {};
  const llamaLendMarketsData: Record<string, LlamaLendGlobalMarketData> = {};
  const liquityV2MarketsData: Record<string, LiquityV2MarketData> = {};
  const aaveV4SpokesData: Record<string, AaveV4SpokeData> = {};

  const markets = {
    morphoMarketsData,
    morphoMidnightMarketsData,
    compoundV3MarketsData,
    sparkMarketsData,
    aaveV3MarketsData,
    aaveV2MarketsData,
    compoundV2MarketsData,
    crvUsdMarketsData,
    llamaLendMarketsData,
    liquityV2MarketsData,
    aaveV4SpokesData,
  };

  const positions: PortfolioPositionsData = {};
  const stakingPositions: any = {};
  const rewardsData: any = {};
  const allAddresses = [...addresses];

  for (const address of allAddresses) {
    positions[address.toLowerCase() as EthAddress] = {
      aaveV3: {},
      aaveV4: {},
      morphoBlue: {},
      morphoMidnight: {},
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

  // TODO: check default values, probably needed when fetching portfolio on unsupported networks
  for (const address of addresses) {
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
    };

    rewardsData[address.toLowerCase() as EthAddress] = {
      merkl: {},
      aaveV3: {},
      spark: {},
      spk: {},
      king: {},
      ethena: {},
    };
  }

  await Promise.allSettled([
    // === MARKET DATA (needs to be fetched first) ===
    ...morphoMarkets.map(async (market) => {
      const marketData = await _getMorphoBluePortfolioMarketData(client, network, market);
      morphoMarketsData[market.value] = marketData;
    }),
    ...morphoMidnightMarkets.map(async (market) => {
      const marketData = await _getMorphoMidnightMarketData(client, network, market);
      morphoMidnightMarketsData[market.value] = marketData;
    }),
    ...compoundV3Markets.map(async (market) => {
      const marketData = await _getCompoundV3MarketsData(client, network, market, defaultClient);
      compoundV3MarketsData[market.value] = marketData;
    }),
    ...sparkMarkets.map(async (market) => {
      const marketData = await _getSparkMarketsData(client, network, market);
      sparkMarketsData[market.value] = marketData;
    }),
    ...aaveV3Markets.map(async (market) => {
      const marketData = await _getAaveV3MarketData(client, network, market);
      aaveV3MarketsData[market.value] = marketData;
    }),
    ...aaveV4Spokes.map(async (spoke) => {
      const spokeData = await _getAaveV4SpokeData(client, network, spoke);
      aaveV4SpokesData[spoke.value] = spokeData;
    }),
    ...aaveV2Markets.map(async (market) => {
      const marketData = await _getAaveV2MarketsData(client, network, market);
      aaveV2MarketsData[market.value] = marketData;
    }),
    ...compoundV2Markets.map(async (market) => {
      const marketData = await _getCompoundV2MarketsData(client, network);
      compoundV2MarketsData[market.value] = marketData;
    }),
    ...crvUsdMarkets.map(async (market) => {
      const marketData = await _getCurveUsdGlobalData(client, network, market);
      crvUsdMarketsData[market.value] = marketData;
    }),
    ...llamaLendMarkets.map(async (market) => {
      const marketData = await _getLlamaLendGlobalData(client, network, market);
      llamaLendMarketsData[market.value] = marketData;
    }),
    ...liquityV2Markets.map(async (market) => {
      const marketData = await _getLiquityV2MarketData(client, network, market);
      liquityV2MarketsData[market.value] = marketData;
    }),

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

    // === STAKING DATA (independent of market data) ===
    ...addresses.map(async (address) => {
      try {
        if (!isFluidSupported) return;
        stakingPositions[address.toLowerCase()].fluid = await _getAllUserEarnPositionsWithFTokens(client, network, address);
      } catch (error) {
        console.error(`Error fetching Fluid lend data for address ${address}:`, error);
        stakingPositions[address.toLowerCase()].fluid = { error: `Error fetching Fluid lend data for address ${address}`, data: null };
      }
    }),
    ...addresses.map(async (address) => {
      try {
        if (!isMainnet) return;
        stakingPositions[address.toLowerCase()].liquity = await getLiquityStakingData(client, network, address);
      } catch (error) {
        console.error(`Error fetching Liquity staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase()].liquity = { error: `Error fetching Liquity staking data for address ${address}`, data: null };
      }
    }),
    ...addresses.map(async (address) => {
      try {
        if (!isMainnet) return;
        stakingPositions[address.toLowerCase()].aaveV3 = await getStakeAaveData(client, network, address);
      } catch (error) {
        console.error(`Error fetching Aave V3 staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase()].aaveV3 = { error: `Error fetching Aave V3 staking data for address ${address}`, data: null };
      }
    }),
    ...addresses.map(async (address) => {
      try {
        if (!isMainnet) return;
        stakingPositions[address.toLowerCase()].umbrella = await getUmbrellaData(client, network, address);
      } catch (error) {
        console.error(`Error fetching Umbrella staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase()].umbrella = { error: `Error fetching Umbrella staking data for address ${address}`, data: null };
      }
    }),
    // Liquity V2 staking
    ...liquityV2MarketsStaking.map(market => addresses.map(async (address) => {
      try {
        if (!isMainnet) {
          stakingPositions[address.toLowerCase()].liquityV2[market.value] = { error: '', data: null };
          return;
        }
        const liquityV2StakingData = await getLiquityV2Staking(client, network, market.value, address);
        stakingPositions[address.toLowerCase()].liquityV2[market.value] = { error: '', data: liquityV2StakingData };
      } catch (error) {
        console.error(`Error fetching Liquity V2 staking data for address ${address}, market ${market.value}:`, error);
        stakingPositions[address.toLowerCase()].liquityV2[market.value] = { error: `Error fetching Liquity V2 staking data for address ${address}`, data: null };
      }
    })).flat(),

    // === REWARDS DATA (independent of market data) ===
    // Batch King rewards
    (async () => {
      try {
        if (!isMainnet) {
          for (const address of addresses) {
            rewardsData[address.toLowerCase()].king = { error: '', data: [] };
          }
          return;
        }
        const kingRewards = await getKingRewards(client, network, addresses);
        for (const address of addresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].king = {
            error: '',
            data: kingRewards[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching King rewards data in batch:', error);
        for (const address of addresses) {
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
          for (const address of addresses) {
            rewardsData[address.toLowerCase()].uniswap = { error: '', data: [] };
          }
          return;
        }
        const uniswapRewards = await getUniswapRewards(client, network, addresses);
        for (const address of addresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].uniswap = {
            error: '',
            data: uniswapRewards[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching Uniswap rewards data in batch:', error);
        for (const address of addresses) {
          rewardsData[address.toLowerCase() as EthAddress].uniswap = {
            error: 'Error fetching Uniswap rewards data in batch',
            data: null,
          };
        }
      }
    })(),
    ...sparkMarkets.map((market) => addresses.map(async address => {
      try {
        if (!isMainnet) {
          rewardsData[address.toLowerCase()].spark[market.value] = { error: '', data: [] };
          return;
        }
        const sparkData = await fetchSparkRewards(client, network, address, market.providerAddress);
        rewardsData[address.toLowerCase() as EthAddress].spark[market.value] = { error: '', data: sparkData };
      } catch (error) {
        console.error(`Error fetching Spark rewards data for address ${address}, market ${market.value}:`, error);
        rewardsData[address.toLowerCase() as EthAddress].spark[market.value] = { error: `Error fetching Spark rewards data for address ${address}`, data: null };
      }
    })).flat(),
    ...addresses.map(async (address) => {
      try {
        const merklData = await getMerklUnclaimedRewards(address, network);
        rewardsData[address.toLowerCase() as EthAddress].merkl = { error: '', data: merklData };
      } catch (error) {
        console.error(`Error fetching Merkl rewards data for address ${address}:`, error);
        rewardsData[address.toLowerCase() as EthAddress].merkl = { error: `Error fetching Merkl rewards data for address ${address}`, data: null };
      }
    }),
    ...aaveV3Markets.map(market => addresses.map(async (address) => {
      try {
        const aaveData = await getUnclaimedRewardsForAllMarkets(client, network, address, market.providerAddress);
        rewardsData[address.toLowerCase() as EthAddress].aaveV3[market.value] = { error: '', data: aaveData };
      } catch (error) {
        console.error(`Error fetching Aave V3 Merit rewards data for address ${address}:`, error);
        rewardsData[address.toLowerCase() as EthAddress].aaveV3 = { error: `Error fetching Aave V3 rewards data for address ${address}`, data: null };
      }
    })).flat(),
    // Batch Spark Airdrop rewards
    (async () => {
      try {
        if (!isMainnet) {
          for (const address of addresses) {
            rewardsData[address.toLowerCase()].spk = { error: '', data: [] };
          }
          return;
        }

        const sparkAirdropRewards = await fetchSparkAirdropRewards(client, network, addresses);
        for (const address of addresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].spk = {
            error: '',
            data: sparkAirdropRewards[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching Spark Airdrop rewards data in batch:', error);
        for (const address of addresses) {
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

        const ethenaAirdropRewards = await fetchEthenaAirdropRewards(addresses);
        for (const address of addresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].ethena = {
            error: '',
            data: ethenaAirdropRewards[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching Ethena Airdrop rewards data:', error);
        for (const address of addresses) {
          rewardsData[address.toLowerCase() as EthAddress].ethena = {
            error: 'Error fetching Ethena Airdrop rewards data in batch',
            data: null,
          };
        }
      }
    })(),
  ]);

  await Promise.all([
    ...aaveV3Markets.map((market) => allAddresses.map(async (address) => {
      try {
        const accData = await _getAaveV3AccountData(client, network, address, { selectedMarket: market, ...aaveV3MarketsData[market.value] });
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].aaveV3[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching AaveV3 account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].aaveV3[market.value] = { error: `Error fetching AaveV3 account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...aaveV4Spokes.map((spoke) => allAddresses.map(async (address) => {
      try {
        const accData = await _getAaveV4AccountData(client, network, aaveV4SpokesData[spoke.value], address);
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].aaveV4[spoke.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching AaveV4 account data for address ${address} on spoke ${spoke.value}:`, error);
        positions[address.toLowerCase() as EthAddress].aaveV4[spoke.value] = { error: `Error fetching AaveV4 account data for address ${address} on spoke ${spoke.value}`, data: null };
      }
    })).flat(),
    ...morphoMarkets.map((market) => addresses.map(async (address) => {
      try {
        const [accDataPromise, earnDataPromise] = await Promise.allSettled([
          _getMorphoBlueAccountData(client, network, address, market, morphoMarketsData[market.value]),
          getMorphoEarn(client, network, address, market, morphoMarketsData[market.value]),
        ]);
        if (accDataPromise.status === 'rejected') {
          console.error(`Error fetching MorphoBlue account data for address ${address} on market ${market.value}:`, accDataPromise.reason);
          positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: `Error fetching MorphoBlue account data for address ${address} on market ${market.value}`, data: null };
        }
        if (earnDataPromise.status === 'rejected') {
          console.error(`Error fetching MorphoBlue account data for address ${address} on market ${market.value}:`, earnDataPromise.reason);
          positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: `Error fetching MorphoBlue account data for address ${address} on market ${market.value}`, data: null };
        }
        if (accDataPromise.status !== 'rejected') {
          const accData = accDataPromise.value;
          if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: '', data: accData };
        }
        if (earnDataPromise.status !== 'rejected') {
          const earnData = earnDataPromise.value;
          if (earnData && new Dec(earnData.amount).gt(0)) {
            stakingPositions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = {
              error: '',
              data: earnData,
            };
          }
        }
      } catch (error) {
        console.error(`Error fetching MorphoBlue account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: `Error fetching MorphoBlue account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...morphoMidnightMarkets.map((market) => addresses.map(async (address) => {
      try {
        // Markets are created lazily on the first position, so an uncreated one can hold no position.
        if (!morphoMidnightMarketsData[market.value]?.isCreated) return;
        const accData = await _getMorphoMidnightAccountData(client, network, address, market, morphoMidnightMarketsData[market.value]);
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].morphoMidnight[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching MorphoMidnight account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].morphoMidnight[market.value] = { error: `Error fetching MorphoMidnight account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...compoundV3Markets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getCompoundV3AccountData(client, network, address, ZERO_ADDRESS, { selectedMarket: market, assetsData: compoundV3MarketsData[market.value].assetsData });
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].compoundV3[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching CompoundV3 account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].compoundV3[market.value] = { error: `Error fetching CompoundV3 account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...sparkMarkets.map((market) => allAddresses.map(async (address) => {
      try {
        const accData = await _getSparkAccountData(client, network, address, { selectedMarket: market, assetsData: sparkMarketsData[market.value].assetsData, eModeCategoriesData: sparkMarketsData[market.value].eModeCategoriesData });
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].spark[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching Spark account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].spark[market.value] = { error: `Error fetching Spark account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...addresses.map(async (address) => makerCdps[address.toLowerCase() as EthAddress]?.map(async (cdpInfo) => {
      try {
        const cdpData = await _getMakerCdpData(client, network, cdpInfo);
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
        const accData = await _getAaveV2AccountData(client, network, address, aaveV2MarketsData[market.value].assetsData, market);
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].aaveV2[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching AaveV2 account data for address ${address}:`, error);
        positions[address.toLowerCase() as EthAddress].aaveV2[market.value] = { error: `Error fetching AaveV2 account data for address ${address}`, data: null };
      }
    })).flat(),
    ...compoundV2Markets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getCompoundV2AccountData(client, network, address, compoundV2MarketsData[market.value].assetsData);
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
        const accData = await _getCurveUsdUserData(client, network, address, market, crvUsdMarketsData[market.value].activeBand);
        if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
          positions[address.toLowerCase() as EthAddress].crvUsd[market.value] = { error: '', data: { ...accData, borrowRate: crvUsdMarketsData[market.value].borrowRate } };
        }
      } catch (error) {
        console.error(`Error fetching Curve USD account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].crvUsd[market.value] = { error: `Error fetching Curve USD account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...llamaLendMarkets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getLlamaLendUserData(client, network, address, market, llamaLendMarketsData[market.value]);
        if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
          positions[address.toLowerCase() as EthAddress].llamaLend[market.value] = { error: '', data: { ...accData, borrowRate: llamaLendMarketsData[market.value].borrowRate } };
        }
      } catch (error) {
        console.error(`Error fetching LlamaLend account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].llamaLend[market.value] = { error: `Error fetching LlamaLend account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    // liquity sBold/yBold and staking options
    ...addresses.map(async (address) => {
      try {
        if (!isMainnet) {
          stakingPositions[address.toLowerCase() as EthAddress].liquityV2SBoldYBold = { error: '', data: null };
          return;
        }
        const data = await getLiquitySAndYBold(client, network, stakingPositions[address.toLowerCase()].liquityV2, address);
        stakingPositions[address.toLowerCase() as EthAddress].liquityV2SBoldYBold = { error: '', data };
      } catch (error) {
        console.error(`Error fetching SBold/YBold data for address ${address}:`, error);
        stakingPositions[address.toLowerCase() as EthAddress].liquityV2SBoldYBold = { error: `Error fetching sBold/yBold data for address ${address}`, data: null };
      }
    }),
  ]);

  return {
    positions,
    stakingPositions,
    rewardsData,
    markets,
  };
}


export async function getShifterPortfolioData(provider: EthereumProvider, network: NetworkNumber, defaultProvider: EthereumProvider, addresses: EthAddress[], isSim = false): Promise<{
  positions: PortfolioPositionsData;
  markets: PortfolioMarketsData;
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

  const markets: PortfolioMarketsData = {
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
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].aaveV3[market.value] = { error: '', data: accData };
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
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].spark[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching Spark account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].spark[market.value] = { error: `Error fetching Spark account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...addresses.map(async (address) => makerCdps[address.toLowerCase() as EthAddress]?.map(async (cdpInfo) => {
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
        const accData = await _getCurveUsdUserData(client, network, address, market, markets.crvUsdMarketsData[market.value].activeBand);
        if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
          positions[address.toLowerCase() as EthAddress].crvUsd[market.value] = { error: '', data: { ...accData, borrowRate: markets.crvUsdMarketsData[market.value].borrowRate } };
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
