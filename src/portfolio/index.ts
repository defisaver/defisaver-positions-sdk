import Dec from 'decimal.js';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import {
  AaveMarkets,
  CompoundMarkets,
  CrvUsdMarkets,
  EulerV2Markets,
  LiquityV2Markets,
  LlamaLendMarkets,
  MorphoBlueMarkets,
  SparkMarkets,
} from '../markets';
import { _getMorphoBlueAccountData, _getMorphoBlueMarketData } from '../morphoBlue';
import {
  AaveV2MarketData,
  AaveV3MarketData,
  AaveVersions,
  CdpInfo,
  CompoundV2MarketsData,
  CompoundV3MarketsData,
  CompoundVersions,
  CrvUSDGlobalMarketData,
  EulerV2FullMarketData,
  LiquityV2Versions,
  LlamaLendGlobalMarketData,
  MorphoBlueMarketInfo,
  PortfolioPositionsData,
  SparkMarketsData,
} from '../types';
import { _getCompoundV3AccountData, _getCompoundV3MarketsData } from '../compoundV3';
import { _getSparkAccountData, _getSparkMarketsData } from '../spark';
import { _getEulerV2AccountData, _getEulerV2MarketsData } from '../eulerV2';
import { _getCurveUsdGlobalData, _getCurveUsdUserData } from '../curveUsd';
import { _getLlamaLendGlobalData, _getLlamaLendUserData } from '../llamaLend';
import { _getAaveV3AccountData, _getAaveV3MarketData, getStakeAaveData } from '../aaveV3';
import { ZERO_ADDRESS } from '../constants';
import { _getMakerCdpData, _getUserCdps } from '../maker';
import { _getAaveV2AccountData, _getAaveV2MarketsData } from '../aaveV2';
import { _getCompoundV2AccountData, _getCompoundV2MarketsData } from '../compoundV2';
import { getViemProvider } from '../services/viem';
import { _getLiquityTroveInfo, getLiquityStakingData } from '../liquity';
import { _getAllUserEarnPositionsWithFTokens, _getUserPositionsPortfolio } from '../fluid';
import { getEulerV2SubAccounts } from '../helpers/eulerHelpers';
import { getUmbrellaData } from '../umbrella';
import { getMeritUnclaimedRewards, getUnclaimedRewardsForAllMarkets } from '../claiming/aaveV3';
import { getCompoundV3Rewards } from '../claiming/compV3';
import { fetchSparkRewards, fetchSparkAirdropRewardsBatched } from '../claiming/spark';
import { fetchMorphoBlueRewardsBatched } from '../claiming/morphoBlue';
import { getKingRewardsBatched } from '../claiming/king';

export async function getPortfolioData(provider: EthereumProvider, network: NetworkNumber, defaultProvider: EthereumProvider, addresses: EthAddress[], summerFiAddresses: EthAddress[]): Promise<{
  positions: PortfolioPositionsData;
  stakingPositions: any;
  rewardsData: any;
}> {
  const isMainnet = network === NetworkNumber.Eth;
  const isFluidSupported = [NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Base].includes(network);

  const morphoMarkets = Object.values(MorphoBlueMarkets(network)).filter((market) => market.chainIds.includes(network));
  const compoundV3Markets = Object.values(CompoundMarkets(network)).filter((market) => market.chainIds.includes(network) && market.value !== CompoundVersions.CompoundV2);
  const sparkMarkets = Object.values(SparkMarkets(network)).filter((market) => market.chainIds.includes(network));
  const eulerV2Markets = Object.values(EulerV2Markets(network)).filter((market) => market.chainIds.includes(network));
  const aaveV3Markets = [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const aaveV2Markets = [AaveVersions.AaveV2].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const compoundV2Markets = [CompoundVersions.CompoundV2].map((version) => CompoundMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const crvUsdMarkets = Object.values(CrvUsdMarkets(network)).filter((market) => market.chainIds.includes(network));
  const llamaLendMarkets = [NetworkNumber.Eth, NetworkNumber.Arb].includes(network) ? Object.values(LlamaLendMarkets(network)).filter((market) => market.chainIds.includes(network)) : [];

  const client = getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  });
  const defaultClient = getViemProvider(defaultProvider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  });

  const morphoMarketsData: Record<string, MorphoBlueMarketInfo> = {};
  const compoundV3MarketsData: Record<string, CompoundV3MarketsData> = {};
  const sparkMarketsData: Record<string, SparkMarketsData> = {};
  const eulerV2MarketsData: Record<string, EulerV2FullMarketData> = {};
  const aaveV3MarketsData: Record<string, AaveV3MarketData> = {};
  const makerCdps: Record<string, CdpInfo[]> = {};
  const aaveV2MarketsData: Record<string, AaveV2MarketData> = {};
  const compoundV2MarketsData: Record<string, CompoundV2MarketsData> = {};
  const crvUsdMarketsData: Record<string, CrvUSDGlobalMarketData> = {};
  const llamaLendMarketsData: Record<string, LlamaLendGlobalMarketData> = {};

  const positions: PortfolioPositionsData = {};
  const stakingPositions: any = {};
  const rewardsData: any = {};
  const allAddresses = [...addresses, ...summerFiAddresses];

  for (const address of allAddresses) {
    positions[address.toLowerCase() as EthAddress] = {
      aaveV3: {},
      morphoBlue: {},
      compoundV3: {},
      spark: {},
      eulerV2: {},
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

  for (const address of addresses) {
    stakingPositions[address.toLowerCase() as EthAddress] = {
      aaveV3: {},
      morphoBlue: {},
      compoundV3: {},
      spark: {},
      eulerV2: {},
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

    rewardsData[address.toLowerCase() as EthAddress] = {
      aaveV3merit: {},
      aaveV3: {},
      compV3: {},
      spark: {},
      spk: {},
      king: {},
      morpho: {},
    };
  }

  await Promise.allSettled([
    // === MARKET DATA (needs to be fetched first) ===
    ...morphoMarkets.map(async (market) => {
      const marketData = await _getMorphoBlueMarketData(client, network, market);
      morphoMarketsData[market.value] = marketData;
    }),
    ...compoundV3Markets.map(async (market) => {
      const marketData = await _getCompoundV3MarketsData(client, network, market, defaultClient);
      compoundV3MarketsData[market.value] = marketData;
    }),
    ...sparkMarkets.map(async (market) => {
      const marketData = await _getSparkMarketsData(client, network, market);
      sparkMarketsData[market.value] = marketData;
    }),
    ...eulerV2Markets.map(async (market) => {
      const marketData = await _getEulerV2MarketsData(client, network, market);
      eulerV2MarketsData[market.value] = marketData;
    }),
    ...aaveV3Markets.map(async (market) => {
      const marketData = await _getAaveV3MarketData(client, network, market);
      aaveV3MarketsData[market.value] = marketData;
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

    // === INDEPENDENT USER DATA (doesn't depend on market data) ===
    ...addresses.map(async (address) => {
      if (!isMainnet) return; // Maker CDPs are only available on mainnet
      const makerCdp = await _getUserCdps(client, network, address);
      makerCdps[address.toLowerCase() as EthAddress] = makerCdp;
    }),
    ...addresses.map(async (address) => {
      try {
        if (!isFluidSupported) return; // Fluid is not available on Optimism
        const userPositions = await _getUserPositionsPortfolio(client, network, address);
        for (const position of userPositions) {
          if (new Dec(position.userData.suppliedUsd).gt(0)) {
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
        const fluidLendData = await _getAllUserEarnPositionsWithFTokens(client, network, address);
        stakingPositions[address.toLowerCase()].fluid = fluidLendData;
      } catch (error) {
        console.error(`Error fetching Fluid lend data for address ${address}:`, error);
        stakingPositions[address.toLowerCase()].fluid = { error: `Error fetching Fluid lend data for address ${address}`, data: null };
      }
    }),
    ...addresses.map(async (address) => {
      try {
        const liquityStakingData = await getLiquityStakingData(client, network, address);
        stakingPositions[address.toLowerCase()].liquity = liquityStakingData;
      } catch (error) {
        console.error(`Error fetching Liquity staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase()].liquity = { error: `Error fetching Liquity staking data for address ${address}`, data: null };
      }
    }),
    ...addresses.map(async (address) => {
      try {
        stakingPositions[address.toLowerCase()].aaveV3 = await getStakeAaveData(client, network, address);
      } catch (error) {
        console.error(`Error fetching Aave V3 staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase()].aaveV3 = { error: `Error fetching Aave V3 staking data for address ${address}`, data: null };
      }
    }),
    ...addresses.map(async (address) => {
      try {
        const umbrellaStakingData = await getUmbrellaData(client, network, address);
        stakingPositions[address.toLowerCase()].umbrella = umbrellaStakingData;
      } catch (error) {
        console.error(`Error fetching Umbrella staking data for address ${address}:`, error);
        stakingPositions[address.toLowerCase()].umbrella = { error: `Error fetching Umbrella staking data for address ${address}`, data: null };
      }
    }),

    // === REWARDS DATA (independent of market data) ===
    // Batch King rewards
    (async () => {
      try {
        const kingRewardsBatched = await getKingRewardsBatched(client, network, addresses);
        for (const address of addresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].king = {
            error: '',
            data: kingRewardsBatched[lowerAddress] || [],
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
    ...sparkMarkets.map((market) => addresses.map(async address => {
      try {
        console.log(`Fetching Spark rewards for address ${address}, market ${market.value}, providerAddress: ${market.providerAddress}`);
        const sparkData = await fetchSparkRewards(client, network, address, market.providerAddress);
        rewardsData[address.toLowerCase() as EthAddress].spark[market.value] = { error: '', data: sparkData };
      } catch (error) {
        console.error(`Error fetching Spark rewards data for address ${address}, market ${market.value}:`, error);
        rewardsData[address.toLowerCase() as EthAddress].spark[market.value] = { error: `Error fetching Spark rewards data for address ${address}`, data: null };
      }
    })).flat(),
    // CompV3 rewards
    ...compoundV3Markets.map(market => addresses.map(async (address) => {
      try {
        const compV3Rewards = await getCompoundV3Rewards(client, network, address, market.baseMarketAddress);
        rewardsData[address.toLowerCase() as EthAddress].compV3[market.value] = { error: '', data: compV3Rewards };
      } catch (error) {
        console.error(`Error fetching Compound V3 rewards data for address ${address}:`, error);
        rewardsData[address.toLowerCase() as EthAddress].compV3[market.value] = { error: `Error fetching Compound V3 rewards data for address ${address}`, data: null };
      }
    })).flat(),
    ...addresses.map(async (address) => {
      try {
        const aaveMeritData = await getMeritUnclaimedRewards(address, network);
        rewardsData[address.toLowerCase() as EthAddress].aaveV3merit = { error: '', data: aaveMeritData };
      } catch (error) {
        console.error(`Error fetching Aave V3 Merit rewards data for address ${address}:`, error);
        rewardsData[address.toLowerCase() as EthAddress].aaveV3merit = { error: `Error fetching Aave V3 Merit rewards data for address ${address}`, data: null };
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
    // Batch Morpho Blue rewards
    (async () => {
      try {
        const morphoRewardsBatched = await fetchMorphoBlueRewardsBatched(client, network, addresses);
        for (const address of addresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].morpho = {
            error: '',
            data: morphoRewardsBatched[lowerAddress] || [],
          };
        }
      } catch (error) {
        console.error('Error fetching Morpho Blue rewards data in batch:', error);
        for (const address of addresses) {
          rewardsData[address.toLowerCase() as EthAddress].morpho = {
            error: 'Error fetching Morpho Blue rewards data in batch',
            data: null,
          };
        }
      }
    })(),
    // Batch Spark Airdrop rewards
    (async () => {
      try {
        const sparkAirdropRewardsBatched = await fetchSparkAirdropRewardsBatched(client, network, addresses);
        for (const address of addresses) {
          const lowerAddress = address.toLowerCase() as EthAddress;
          rewardsData[lowerAddress].spk = {
            error: '',
            data: sparkAirdropRewardsBatched[lowerAddress] || [],
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
    ...morphoMarkets.map((market) => addresses.map(async (address) => {
      try {
        const accData = await _getMorphoBlueAccountData(client, network, address, market, morphoMarketsData[market.value]);
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching MorphoBlue account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = { error: `Error fetching MorphoBlue account data for address ${address} on market ${market.value}`, data: null };
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
        const accData = await _getSparkAccountData(client, network, address, { selectedMarket: market, assetsData: sparkMarketsData[market.value].assetsData });
        if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].spark[market.value] = { error: '', data: accData };
      } catch (error) {
        console.error(`Error fetching Spark account data for address ${address} on market ${market.value}:`, error);
        positions[address.toLowerCase() as EthAddress].spark[market.value] = { error: `Error fetching Spark account data for address ${address} on market ${market.value}`, data: null };
      }
    })).flat(),
    ...eulerV2Markets.map((market) => addresses.map((address) => {
      const eulerV2SubAccounts = getEulerV2SubAccounts(address);
      const eulerV2Addresses = [address, ...eulerV2SubAccounts];
      return Promise.all(eulerV2Addresses.map(async (eulerAddress) => {
        try {
          const accData = await _getEulerV2AccountData(client, network, eulerAddress, eulerAddress, { selectedMarket: market, ...eulerV2MarketsData[market.value] });
          if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
            if (!positions[address.toLowerCase() as EthAddress].eulerV2[market.value]) {
              positions[address.toLowerCase() as EthAddress].eulerV2[market.value] = {};
            }
            positions[address.toLowerCase() as EthAddress].eulerV2[market.value]![eulerAddress.toLowerCase() as EthAddress] = { error: '', data: accData };
          }
        } catch (error) {
          console.error(`Error fetching EulerV2 account data for address ${eulerAddress} on market ${market.value}:`, error);
          if (!positions[address.toLowerCase() as EthAddress].eulerV2[market.value]) {
            positions[address.toLowerCase() as EthAddress].eulerV2[market.value] = {};
          }
          positions[address.toLowerCase() as EthAddress].eulerV2[market.value]![eulerAddress.toLowerCase() as EthAddress] = { error: `Error fetching EulerV2 account data for address ${eulerAddress} on market ${market.value}`, data: null };
        }
      }));
    }).flat()).flat(),
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
  ]);

  return {
    positions,
    stakingPositions,
    rewardsData,
  };
}

// Legacy functions for backward compatibility
export const getPortfolioStakeData = async (provider: EthereumProvider, network: NetworkNumber, addresses: EthAddress[]) => {
  const { stakingPositions } = await getPortfolioData(provider, network, provider, addresses, []);
  return stakingPositions;
};

export const getRewardsData = async (provider: EthereumProvider, network: NetworkNumber, addresses: EthAddress[]) => {
  const { rewardsData } = await getPortfolioData(provider, network, provider, addresses, []);
  return rewardsData;
};

export const getPortfolioStakeAndRewardsData = async (provider: EthereumProvider, network: NetworkNumber, addresses: EthAddress[]) => {
  const { stakingPositions, rewardsData } = await getPortfolioData(provider, network, provider, addresses, []);
  return { stakingPositions, rewardsData };
};