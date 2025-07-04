import Web3 from 'web3';
import Dec from 'decimal.js';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { EthAddress, NetworkNumber } from '../types/common';
import {
  AaveMarkets,
  CompoundMarkets, CrvUsdMarkets, EulerV2Markets, LlamaLendMarkets, MorphoBlueMarkets, SparkMarkets,
} from '../markets';
import { _getMorphoBlueAccountData, _getMorphoBlueMarketData } from '../morphoBlue';
import {
  AaveV3MarketData,
  AaveVersions,
  CompoundV3MarketsData, CompoundVersions, CrvUSDGlobalMarketData, EulerV2FullMarketData, LlamaLendGlobalMarketData, MorphoBlueMarketInfo, PortfolioPositionsData, SparkMarketsData,
} from '../types';
import { _getCompoundV3AccountData, _getCompoundV3MarketsData } from '../compoundV3';
import { _getSparkAccountData, _getSparkMarketsData } from '../spark';
import { _getEulerV2AccountData, _getEulerV2MarketsData } from '../eulerV2';
import { _getCurveUsdGlobalData, _getCurveUsdUserData } from '../curveUsd';
import { _getLlamaLendGlobalData, _getLlamaLendUserData } from '../llamaLend';
import { _getAaveV3AccountData, _getAaveV3MarketData } from '../aaveV3';

export async function getPortfolioData(provider: Web3, network: NetworkNumber, defaultProvider: Web3, addresses: EthAddress[]): Promise<PortfolioPositionsData> {
  const morphoMarkets = Object.values(MorphoBlueMarkets(network)).filter((market) => market.chainIds.includes(network));
  const compoundV3Markets = Object.values(CompoundMarkets(network)).filter((market) => market.chainIds.includes(network) && market.value !== CompoundVersions.CompoundV2);
  const sparkMarkets = Object.values(SparkMarkets(network)).filter((market) => market.chainIds.includes(network));
  const eulerV2Markets = Object.values(EulerV2Markets(network)).filter((market) => market.chainIds.includes(network));
  const crvUsdMarkets = Object.values(CrvUsdMarkets(network)).filter((market) => market.chainIds.includes(network));
  const llamaLendMarkets = Object.values(LlamaLendMarkets(network)).filter((market) => market.chainIds.includes(network));
  const aaveV3Markets = [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));

  const client = createPublicClient({
    // @ts-ignore
    transport: http(provider._provider.host),
    chain: mainnet,
    batch: {
      multicall: {
        batchSize: 16384,
      },
    },
  });
  const defaultClient = createPublicClient({
    // @ts-ignore
    transport: http(defaultProvider._provider.host),
    chain: mainnet,
    batch: {
      multicall: {
        batchSize: 16384,
      },
    },
  });

  const morphoMarketsData: Record<string, MorphoBlueMarketInfo> = {};
  const compoundV3MarketsData: Record<string, CompoundV3MarketsData> = {};
  const sparkMarketsData: Record<string, SparkMarketsData> = {};
  const eulerV2MarketsData: Record<string, EulerV2FullMarketData> = {};
  const crvUsdMarketsData: Record<string, CrvUSDGlobalMarketData> = {};
  const llamaLendMarketsData: Record<string, LlamaLendGlobalMarketData> = {};
  const aaveV3MarketsData: Record<string, AaveV3MarketData> = {};

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
    ...crvUsdMarkets.map(async (market) => {
      const marketData = await _getCurveUsdGlobalData(client, network, market);
      crvUsdMarketsData[market.value] = marketData;
    }),
    ...llamaLendMarkets.map(async (market) => {
      const marketData = await _getLlamaLendGlobalData(client, network, market);
      llamaLendMarketsData[market.value] = marketData;
    }),
    ...aaveV3Markets.map(async (market) => {
      // @ts-ignore
      const marketData = await _getAaveV3MarketData(client, network, market);
      aaveV3MarketsData[market.value] = marketData;
    }),
  ]);

  const positions: PortfolioPositionsData = {};
  for (const address of addresses) {
    positions[address.toLowerCase()] = {
      aaveV3: {},
      morphoBlue: {},
      compoundV3: {},
      spark: {},
      eulerV2: {},
      crvUsd: {},
      llamaLend: {},
    };
  }

  await Promise.all([
    ...aaveV3Markets.map((market) => addresses.map(async (address) => {
      const accData = await _getAaveV3AccountData(client, network, address, { selectedMarket: market, ...aaveV3MarketsData[market.value] });
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase()].aaveV3[market.value] = accData;
    })).flat(),
    ...morphoMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getMorphoBlueAccountData(client, network, address, market, morphoMarketsData[market.value]);
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase()].morphoBlue[market.value] = accData;
    })).flat(),
    ...compoundV3Markets.map((market) => addresses.map(async (address) => {
      const accData = await _getCompoundV3AccountData(client, network, address, '', { selectedMarket: market, assetsData: compoundV3MarketsData[market.value].assetsData });
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase()].compoundV3[market.value] = accData;
    })).flat(),
    ...sparkMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getSparkAccountData(client, network, address, { selectedMarket: market, assetsData: sparkMarketsData[market.value].assetsData });
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase()].spark[market.value] = accData;
    })).flat(),
    ...eulerV2Markets.map((market) => addresses.map(async (address) => {
      const accData = await _getEulerV2AccountData(client, network, address, address, { selectedMarket: market, ...eulerV2MarketsData[market.value] });
      if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
        positions[address.toLowerCase()].eulerV2[market.value] = accData;
      }
    })).flat(),
    ...crvUsdMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getCurveUsdUserData(client, network, address, market, crvUsdMarketsData[market.value].activeBand);
      if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
        positions[address.toLowerCase()].crvUsd[market.value] = accData;
      }
    })).flat(),
    ...llamaLendMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getLlamaLendUserData(client, network, address, market, llamaLendMarketsData[market.value]);
      if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
        positions[address.toLowerCase()].llamaLend[market.value] = accData;
      }
    })).flat(),
  ]);

  return positions;
}