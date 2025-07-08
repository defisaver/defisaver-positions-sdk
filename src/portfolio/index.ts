import Dec from 'decimal.js';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import {
  AaveMarkets,
  CompoundMarkets, CrvUsdMarkets, EulerV2Markets, LlamaLendMarkets, MorphoBlueMarkets, SparkMarkets,
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
import { _getAaveV3AccountData, _getAaveV3MarketData } from '../aaveV3';
import { ZERO_ADDRESS } from '../constants';
import { _getMakerCdpData, _getUserCdps } from '../maker';
import { _getAaveV2AccountData, _getAaveV2MarketsData } from '../aaveV2';
import { _getCompoundV2AccountData, _getCompoundV2MarketsData } from '../compoundV2';
import { getViemProvider } from '../services/viem';

export async function getPortfolioData(provider: EthereumProvider, network: NetworkNumber, defaultProvider: EthereumProvider, addresses: EthAddress[]): Promise<PortfolioPositionsData> {
  const isMainnet = network === NetworkNumber.Eth;

  const morphoMarkets = Object.values(MorphoBlueMarkets(network)).filter((market) => market.chainIds.includes(network));
  const compoundV3Markets = Object.values(CompoundMarkets(network)).filter((market) => market.chainIds.includes(network) && market.value !== CompoundVersions.CompoundV2);
  const sparkMarkets = Object.values(SparkMarkets(network)).filter((market) => market.chainIds.includes(network));
  const eulerV2Markets = Object.values(EulerV2Markets(network)).filter((market) => market.chainIds.includes(network));
  const crvUsdMarkets = Object.values(CrvUsdMarkets(network)).filter((market) => market.chainIds.includes(network));
  const llamaLendMarkets = [NetworkNumber.Eth, NetworkNumber.Arb].includes(network) ? Object.values(LlamaLendMarkets(network)).filter((market) => market.chainIds.includes(network)) : [];
  const aaveV3Markets = [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const aaveV2Markets = [AaveVersions.AaveV2].map((version) => AaveMarkets(network)[version]).filter((market) => market.chainIds.includes(network));
  const compoundV2Markets = [CompoundVersions.CompoundV2].map((version) => CompoundMarkets(network)[version]).filter((market) => market.chainIds.includes(network));

  const client = getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 16384,
      },
    },
  });
  const defaultClient = getViemProvider(defaultProvider, network, {
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
    ...crvUsdMarkets.map(async (market) => {
      const marketData = await _getCurveUsdGlobalData(client, network, market);
      crvUsdMarketsData[market.value] = marketData;
    }),
    ...llamaLendMarkets.map(async (market) => {
      const marketData = await _getLlamaLendGlobalData(client, network, market);
      llamaLendMarketsData[market.value] = marketData;
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

  const positions: PortfolioPositionsData = {};
  for (const address of addresses) {
    positions[address.toLowerCase() as EthAddress] = {
      aaveV3: {},
      morphoBlue: {},
      compoundV3: {},
      spark: {},
      eulerV2: {},
      crvUsd: {},
      llamaLend: {},
      maker: {},
      aaveV2: {},
      compoundV2: {},
    };
  }

  await Promise.all([
    ...aaveV3Markets.map((market) => addresses.map(async (address) => {
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
    ...sparkMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getSparkAccountData(client, network, address, { selectedMarket: market, assetsData: sparkMarketsData[market.value].assetsData });
      if (new Dec(accData.suppliedUsd).gt(0)) positions[address.toLowerCase() as EthAddress].spark[market.value] = accData;
    })).flat(),
    ...eulerV2Markets.map((market) => addresses.map(async (address) => {
      const accData = await _getEulerV2AccountData(client, network, address, address, { selectedMarket: market, ...eulerV2MarketsData[market.value] });
      if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
        positions[address.toLowerCase() as EthAddress].eulerV2[market.value] = accData;
      }
    })).flat(),
    ...crvUsdMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getCurveUsdUserData(client, network, address, market, crvUsdMarketsData[market.value].activeBand);
      if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
        positions[address.toLowerCase() as EthAddress].crvUsd[market.value] = accData;
      }
    })).flat(),
    ...llamaLendMarkets.map((market) => addresses.map(async (address) => {
      const accData = await _getLlamaLendUserData(client, network, address, market, llamaLendMarketsData[market.value]);
      if (new Dec(accData.suppliedUsd).gt(0) || new Dec(accData.borrowedUsd).gt(0)) {
        positions[address.toLowerCase() as EthAddress].llamaLend[market.value] = accData;
      }
    })).flat(),
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
  ]);

  console.log(positions);
  return positions;
}