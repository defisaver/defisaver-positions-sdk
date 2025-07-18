import Dec from 'decimal.js';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import {
  AaveMarkets,
  CompoundMarkets, CrvUsdMarkets, EulerV2Markets, LiquityV2Markets, LlamaLendMarkets, MorphoBlueMarkets, SparkMarkets,
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
  LiquityV2MarketData,
  LlamaLendGlobalMarketData,
  MorphoBlueMarketInfo,
  PortfolioPositionsData,
  PortfolioPositionsDataSlower,
  SparkMarketsData,
} from '../types';
import { _getCompoundV3AccountData, _getCompoundV3MarketsData } from '../compoundV3';
import { _getSparkAccountData, _getSparkMarketsData } from '../spark';
import { _getEulerV2AccountData, _getEulerV2MarketsData } from '../eulerV2';
import { _getCurveUsdGlobalData, _getCurveUsdUserData } from '../curveUsd';
import { _getLlamaLendGlobalData, _getLlamaLendUserData } from '../llamaLend';
import { _getAaveV3AccountData, _getAaveV3MarketData } from '../aaveV3';
import { ZERO_ADDRESS } from '../constants';
import { _getMakerCdpData, _getUserCdps } from '../maker';
import { _getAaveV2AccountData, _getAaveV2MarketsData } from '../aaveV2';
import { _getCompoundV2AccountData, _getCompoundV2MarketsData } from '../compoundV2';
import { getViemProvider } from '../services/viem';
import { _getLiquityTroveInfo } from '../liquity';
import { _getLiquityV2MarketData, _getLiquityV2TroveData, _getLiquityV2UserTroveIds } from '../liquityV2';
import { _getUserPositions } from '../fluid';
import { getEulerV2SubAccounts } from '../helpers/eulerHelpers';

export async function getPortfolioData(provider: EthereumProvider, network: NetworkNumber, defaultProvider: EthereumProvider, addresses: EthAddress[], summerFiAddresses: EthAddress[]): Promise<PortfolioPositionsData> {
  const isMainnet = network === NetworkNumber.Eth;

  const morphoMarkets = Object.values(MorphoBlueMarkets(network)).filter((market) => market.chainIds.includes(network));
  const compoundV3Markets = Object.values(CompoundMarkets(network)).filter((market) => market.chainIds.includes(network) && market.value !== CompoundVersions.CompoundV2);
  const sparkMarkets = Object.values(SparkMarkets(network)).filter((market) => market.chainIds.includes(network));
  const eulerV2Markets = Object.values(EulerV2Markets(network)).filter((market) => market.chainIds.includes(network));
  const aaveV3Markets = [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const aaveV2Markets = [AaveVersions.AaveV2].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const compoundV2Markets = [CompoundVersions.CompoundV2].map((version) => CompoundMarkets(network)[version]).filter((market) => market.chainIds.includes(network));

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

  await Promise.all([
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
    ...addresses.map(async (address) => {
      if (!isMainnet) return; // Maker CDPs are only available on mainnet
      const makerCdp = await _getUserCdps(client, network, address);
      makerCdps[address.toLowerCase() as EthAddress] = makerCdp;
    }),
    ...aaveV2Markets.map(async (market) => {
      const marketData = await _getAaveV2MarketsData(client, network, market);
      aaveV2MarketsData[market.value] = marketData;
    }),
    ...compoundV2Markets.map(async (market) => {
      const marketData = await _getCompoundV2MarketsData(client, network);
      compoundV2MarketsData[market.value] = marketData;
    }),
  ]);

  const allAddresses = [...addresses, ...summerFiAddresses];

  const positions: PortfolioPositionsData = {};
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
    };
  }

  await Promise.all([
    ...aaveV3Markets.map((market) => allAddresses.map(async (address) => {
      const accData = await _getAaveV3AccountData(client, network, address, { selectedMarket: market, ...aaveV3MarketsData[market.value] });
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].aaveV3[market.value] = accData;
    })).flat(),
    ...morphoMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getMorphoBlueAccountData(client, network, address, market, morphoMarketsData[market.value]);
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].morphoBlue[market.value] = accData;
    })).flat(),
    ...compoundV3Markets.map((market) => addresses.map(async (address) => {
      const accData = await _getCompoundV3AccountData(client, network, address, ZERO_ADDRESS, { selectedMarket: market, assetsData: compoundV3MarketsData[market.value].assetsData });
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].compoundV3[market.value] = accData;
    })).flat(),
    ...sparkMarkets.map((market) => allAddresses.map(async (address) => {
      const accData = await _getSparkAccountData(client, network, address, { selectedMarket: market, assetsData: sparkMarketsData[market.value].assetsData });
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].spark[market.value] = accData;
    })).flat(),
    ...eulerV2Markets.map((market) => addresses.map((address) => {
      const eulerV2SubAccounts = getEulerV2SubAccounts(address);
      const eulerV2Addresses = [address, ...eulerV2SubAccounts];
      return Promise.all(eulerV2Addresses.map(async (eulerAddress) => {
        const accData = await _getEulerV2AccountData(client, network, eulerAddress, eulerAddress, { selectedMarket: market, ...eulerV2MarketsData[market.value] });
        if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
          if (!positions[address.toLowerCase() as EthAddress].eulerV2[market.value]) {
            positions[address.toLowerCase() as EthAddress].eulerV2[market.value] = {};
          }
          positions[address.toLowerCase() as EthAddress].eulerV2[market.value]![eulerAddress.toLowerCase() as EthAddress] = accData;
        }
      }));
    }).flat()).flat(),
    ...addresses.map(async (address) => makerCdps[address.toLowerCase() as EthAddress]?.map(async (cdpInfo) => {
      const cdpData = await _getMakerCdpData(client, network, cdpInfo);
      if (cdpData) {
        positions[address.toLowerCase() as EthAddress].maker[cdpInfo.id] = cdpData;
      }
    })).flat(),
    ...aaveV2Markets.map((market) => addresses.map(async (address) => {
      const accData = await _getAaveV2AccountData(client, network, address, aaveV2MarketsData[market.value].assetsData, market);
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].aaveV2[market.value] = accData;
    })).flat(),
    ...compoundV2Markets.map((market) => addresses.map(async (address) => {
      const accData = await _getCompoundV2AccountData(client, network, address, compoundV2MarketsData[market.value].assetsData);
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].compoundV2[market.value] = accData;
    })).flat(),
    ...addresses.map(async (address) => {
      if (!isMainnet) return; // Liquity trove info is only available on mainnet
      const troveInfo = await _getLiquityTroveInfo(client, network, address);
      if (new Dec(troveInfo.collateral).gt(0)) positions[address.toLowerCase() as EthAddress].liquity = troveInfo;
    }),
  ]);

  return positions;
}

export async function getPortfolioDataSlower(provider: EthereumProvider, network: NetworkNumber, addresses: EthAddress[], isFork: boolean = false): Promise<PortfolioPositionsDataSlower> {
  const crvUsdMarkets = Object.values(CrvUsdMarkets(network)).filter((market) => market.chainIds.includes(network));
  const llamaLendMarkets = [NetworkNumber.Eth, NetworkNumber.Arb].includes(network) ? Object.values(LlamaLendMarkets(network)).filter((market) => market.chainIds.includes(network)) : [];
  const liquityV2Markets = Object.values(LiquityV2Markets(network)).filter((market) => market.chainIds.includes(network));

  const client = getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  });

  const crvUsdMarketsData: Record<string, CrvUSDGlobalMarketData> = {};
  const llamaLendMarketsData: Record<string, LlamaLendGlobalMarketData> = {};
  const liquityV2MarketsData: Record<string, LiquityV2MarketData> = {};

  const positions: PortfolioPositionsDataSlower = {};
  for (const address of addresses) {
    positions[address.toLowerCase() as EthAddress] = {
      crvUsd: {},
      llamaLend: {},
      liquityV2: {},
      fluid: {},
    };
  }

  await Promise.all([
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
    ...addresses.map(async (address) => {
      const userPositions = await _getUserPositions(client, network, address);
      for (const position of userPositions) {
        if (new Dec(position.userData.suppliedUsd).gt(0)) {
          positions[address.toLowerCase() as EthAddress].fluid[position.userData.nftId] = position.userData;
        }
      }
    }),
  ]);

  await Promise.all([
    ...crvUsdMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getCurveUsdUserData(client, network, address, market, crvUsdMarketsData[market.value].activeBand);
      if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
        positions[address.toLowerCase() as EthAddress].crvUsd[market.value] = { ...accData, borrowRate: crvUsdMarketsData[market.value].borrowRate };
      }
    })).flat(),
    ...llamaLendMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getLlamaLendUserData(client, network, address, market, llamaLendMarketsData[market.value]);
      if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
        positions[address.toLowerCase() as EthAddress].llamaLend[market.value] = { ...accData, borrowRate: llamaLendMarketsData[market.value].borrowRate };
      }
    })).flat(),
    ...liquityV2Markets.map((market) => addresses.map(async (address) => {
      const troveIds = await _getLiquityV2UserTroveIds(client, network, market, liquityV2MarketsData[market.value].marketData.troveNFTAddress, isFork, address);
      return Promise.all(troveIds.troves.map(async (troveId) => {
        const troveData = await _getLiquityV2TroveData(client, network, {
          selectedMarket: market,
          assetsData: liquityV2MarketsData[market.value].assetsData,
          troveId: troveId.troveId,
          allMarketsData: liquityV2MarketsData,
        }, false);
        if (new Dec(troveData.suppliedUsd).gt(0)) {
          if (positions[address.toLowerCase() as EthAddress].liquityV2[market.value]) {
            positions[address.toLowerCase() as EthAddress].liquityV2[market.value]![troveId.troveId] = troveData;
          } else {
            positions[address.toLowerCase() as EthAddress].liquityV2[market.value] = {
              [troveId.troveId]: troveData,
            };
          }
        }
      }));
    })).flat(),
  ]);

  return positions;
}