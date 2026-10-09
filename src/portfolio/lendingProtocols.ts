import Dec from 'decimal.js';
import { Client } from 'viem';
import { EthAddress, NetworkNumber } from '../types/common';
import {
  AaveMarkets,
  AaveV4Spokes,
  CompoundMarkets,
  CrvUsdMarkets,
  LlamaLendMarkets,
  MorphoBlueMarkets,
  MorphoMidnightMarkets,
  SparkMarkets,
} from '../markets';
import {
  AaveMarketInfo,
  AaveV4SpokeInfo,
  AaveVersions,
  CompoundMarketData,
  CompoundVersions,
  CrvUSDMarketData,
  LlamaLendMarketData,
  MorphoBlueMarketData,
  MorphoMidnightMarketData,
  PortfolioMarketsData,
  PortfolioPositionsData,
  PortfolioPositionsDataForAddress,
  PortfolioProtocolData,
  SparkMarketData,
} from '../types';
import { _getAaveV3AccountData, _getAaveV3MarketData } from '../aaveV3';
import { _getAaveV4AccountData, _getAaveV4SpokeData } from '../aaveV4';
import { _getAaveV2AccountData, _getAaveV2MarketsData } from '../aaveV2';
import { _getCompoundV2AccountData, _getCompoundV2MarketsData } from '../compoundV2';
import { _getCompoundV3AccountData, _getCompoundV3MarketsData } from '../compoundV3';
import { _getCurveUsdGlobalData, _getCurveUsdUserData } from '../curveUsd';
import { _getLlamaLendGlobalData, _getLlamaLendUserData } from '../llamaLend';
import { _getMorphoBlueAccountData, _getMorphoBluePortfolioMarketData } from '../morphoBlue';
import { _getMorphoMidnightAccountData, _getMorphoMidnightMarketData } from '../morphoMidnight';
import { _getSparkAccountData, _getSparkMarketsData } from '../spark';
import { ZERO_ADDRESS } from '../constants';

/**
 * The lending protocols the portfolio reads the same way — a market's data, then each address's position on it — one
 * entry each. Adding such a protocol is its types (its key in PortfolioPositionsDataForAddress and in
 * PortfolioMarketsData) and its entry in LENDING_PROTOCOLS; the portfolio reads, errors and options follow. Maker,
 * Liquity, Fluid and Liquity V2 have shapes of their own and are read by their own code in ./index.ts.
 */

/** What a position read gets. */
export interface PortfolioReadContext {
  client: Client;
  network: NetworkNumber;
}

/** What a market read gets: also the default client, on Ethereum (Compound V3 reads its prices there). */
export interface PortfolioMarketsReadContext extends PortfolioReadContext {
  defaultClient: Client;
}

type PositionKey = keyof PortfolioPositionsDataForAddress;
type MarketsKey = keyof PortfolioMarketsData;
type PositionsOf<K extends PositionKey> = NonNullable<PortfolioPositionsDataForAddress[K]>;

/** The data of one of a protocol's positions: what positions[address][K][market] holds as `{ error, data }`. */
export type LendingPositionData<K extends PositionKey> =
  NonNullable<PositionsOf<K>[keyof PositionsOf<K>]> extends PortfolioProtocolData<infer D> ? D : never;

export interface LendingProtocol<K extends PositionKey, M extends MarketsKey, Market extends { value: string }> {
  /** Its key in PortfolioMarketsData. */
  marketsKey: M;
  /** Its name in error messages. */
  label: string;
  /** Its markets on a network; none where it is not deployed. */
  markets: (network: NetworkNumber) => Market[];
  readMarket: (context: PortfolioMarketsReadContext, market: Market) => Promise<PortfolioMarketsData[M][string]>;
  /** An address's position on a market; undefined when the market can hold none. */
  readPosition: (
    context: PortfolioReadContext,
    address: EthAddress,
    market: Market,
    marketData: PortfolioMarketsData[M][string],
  ) => Promise<LendingPositionData<K> | undefined>;
  /** Whether there is a position to list: an address without one gets no entry for that market. */
  holds: (position: LendingPositionData<K>) => boolean;
}

/**
 * A market's data, or a throw that the caller's catch turns into the position's error entry: read against a missing
 * market, a position would otherwise come back empty and read as "no position".
 */
export const requireMarket = <T>(marketsData: Record<string, T>, market: string): T => {
  const marketData = marketsData[market];
  if (!marketData) throw new Error(`Market data for ${market} is not available`);
  return marketData;
};

/** requireMarket for one protocol's key, typed by that key's market data. */
const requireMarketOf = <M extends MarketsKey>(marketsData: PortfolioMarketsData, key: M, market: string): PortfolioMarketsData[M][string] => {
  // TypeScript reads marketsData[key][market] as any protocol's market data; the key's own is what is stored there.
  const marketData = (marketsData[key] as Record<string, PortfolioMarketsData[M][string] | undefined>)[market];
  if (!marketData) throw new Error(`Market data for ${market} is not available`);
  return marketData;
};

/** A protocol's entry with its reads, typed by its own market and position types. */
const lendingProtocol = <K extends PositionKey, M extends MarketsKey, Market extends { value: string }>(
  key: K,
  protocol: LendingProtocol<K, M, Market>,
) => {
  /** Every market of the protocol into `markets`; resolves to the ones that failed (left out), with their errors. */
  const readMarkets = async (context: PortfolioMarketsReadContext, markets: PortfolioMarketsData): Promise<Record<string, string>> => {
    const protocolMarkets = markets[protocol.marketsKey];
    const failed: Record<string, string> = {};
    await Promise.all(protocol.markets(context.network).map(async (market) => {
      try {
        protocolMarkets[market.value] = await protocol.readMarket(context, market);
      } catch (error) {
        console.error(`Error fetching ${protocol.marketsKey} for market ${market.value}:`, error);
        failed[market.value] = `Error fetching ${protocol.marketsKey} for market ${market.value}`;
      }
    }));
    return failed;
  };

  /**
   * Every address's position on every market into `positions`, each read once its market is in: an entry with the data
   * where the address holds a position, an entry with an error where the read or its market failed, none otherwise.
   */
  const readPositions = (
    context: PortfolioReadContext,
    addresses: EthAddress[],
    marketsData: Promise<PortfolioMarketsData>,
    positions: PortfolioPositionsData,
  ): Promise<void>[] => protocol.markets(context.network).flatMap((market) => addresses.map(async (address) => {
    // Keyed by the protocol's market type in PortfolioPositionsDataForAddress; written here by market.value.
    const byMarket = positions[address.toLowerCase() as EthAddress][key] as Record<string, PortfolioProtocolData<LendingPositionData<K>>>;
    try {
      const marketData = requireMarketOf(await marketsData, protocol.marketsKey, market.value);
      const position = await protocol.readPosition(context, address, market, marketData);
      if (position && protocol.holds(position)) byMarket[market.value] = { error: '', data: position };
    } catch (error) {
      console.error(`Error fetching ${protocol.label} account data for address ${address} on market ${market.value}:`, error);
      byMarket[market.value] = { error: `Error fetching ${protocol.label} account data for address ${address} on market ${market.value}`, data: null };
    }
  }));

  return {
    key, marketsKey: protocol.marketsKey, markets: protocol.markets, readMarkets, readPositions,
  };
};

const onNetwork = <Market extends { chainIds: NetworkNumber[] }>(network: NetworkNumber, markets: Market[]) => markets.filter((market) => market.chainIds.includes(network));

const suppliesAnything = (position: { suppliedUsd: string }) => new Dec(position.suppliedUsd).gt(0);
const suppliesOrBorrowsAnything = (position: { suppliedUsd: string, borrowedUsd: string }) => new Dec(position.suppliedUsd).gt(0) || new Dec(position.borrowedUsd).gt(0);

export const aaveV3Lending = lendingProtocol('aaveV3', {
  marketsKey: 'aaveV3MarketsData',
  label: 'AaveV3',
  markets: (network): AaveMarketInfo[] => onNetwork(network, [AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].map((version) => AaveMarkets(network)[version])),
  readMarket: ({ client, network }, market) => _getAaveV3MarketData(client, network, market),
  readPosition: ({ client, network }, address, market, marketData) => _getAaveV3AccountData(client, network, address, { selectedMarket: market, ...marketData }),
  holds: suppliesAnything,
});

export const aaveV4Lending = lendingProtocol('aaveV4', {
  marketsKey: 'aaveV4SpokesData',
  label: 'AaveV4',
  markets: (network): AaveV4SpokeInfo[] => onNetwork(network, Object.values(AaveV4Spokes(network))),
  readMarket: ({ client, network }, spoke) => _getAaveV4SpokeData(client, network, spoke),
  readPosition: ({ client, network }, address, _spoke, spokeData) => _getAaveV4AccountData(client, network, spokeData, address),
  holds: suppliesAnything,
});

export const morphoBlueLending = lendingProtocol('morphoBlue', {
  marketsKey: 'morphoMarketsData',
  label: 'MorphoBlue',
  markets: (network): MorphoBlueMarketData[] => onNetwork(network, Object.values(MorphoBlueMarkets(network))),
  readMarket: ({ client, network }, market) => _getMorphoBluePortfolioMarketData(client, network, market),
  readPosition: ({ client, network }, address, market, marketData) => _getMorphoBlueAccountData(client, network, address, market, marketData),
  holds: suppliesAnything,
});

export const morphoMidnightLending = lendingProtocol('morphoMidnight', {
  marketsKey: 'morphoMidnightMarketsData',
  label: 'MorphoMidnight',
  markets: (network): MorphoMidnightMarketData[] => onNetwork(network, Object.values(MorphoMidnightMarkets(network))),
  readMarket: ({ client, network }, market) => _getMorphoMidnightMarketData(client, network, market),
  // Markets are created lazily on the first position, so an uncreated one can hold no position.
  readPosition: async ({ client, network }, address, market, marketData) => (marketData.isCreated
    ? _getMorphoMidnightAccountData(client, network, address, market, marketData)
    : undefined),
  holds: suppliesAnything,
});

export const compoundV3Lending = lendingProtocol('compoundV3', {
  marketsKey: 'compoundV3MarketsData',
  label: 'CompoundV3',
  markets: (network): CompoundMarketData[] => onNetwork(network, Object.values(CompoundMarkets(network)).filter((market) => market.value !== CompoundVersions.CompoundV2)),
  readMarket: ({ client, defaultClient, network }, market) => _getCompoundV3MarketsData(client, network, market, defaultClient),
  readPosition: ({ client, network }, address, market, marketData) => _getCompoundV3AccountData(client, network, address, ZERO_ADDRESS, { selectedMarket: market, assetsData: marketData.assetsData }),
  holds: suppliesAnything,
});

export const sparkLending = lendingProtocol('spark', {
  marketsKey: 'sparkMarketsData',
  label: 'Spark',
  markets: (network): SparkMarketData[] => onNetwork(network, Object.values(SparkMarkets(network))),
  readMarket: ({ client, network }, market) => _getSparkMarketsData(client, network, market),
  readPosition: ({ client, network }, address, market, marketData) => _getSparkAccountData(client, network, address, {
    selectedMarket: market, assetsData: marketData.assetsData, eModeCategoriesData: marketData.eModeCategoriesData,
  }),
  holds: suppliesAnything,
});

export const aaveV2Lending = lendingProtocol('aaveV2', {
  marketsKey: 'aaveV2MarketsData',
  label: 'AaveV2',
  markets: (network): AaveMarketInfo[] => onNetwork(network, [AaveMarkets(network)[AaveVersions.AaveV2]]),
  readMarket: ({ client, network }, market) => _getAaveV2MarketsData(client, network, market),
  readPosition: ({ client, network }, address, market, marketData) => _getAaveV2AccountData(client, network, address, marketData.assetsData, market),
  holds: suppliesAnything,
});

export const compoundV2Lending = lendingProtocol('compoundV2', {
  marketsKey: 'compoundV2MarketsData',
  label: 'CompoundV2',
  markets: (network): CompoundMarketData[] => onNetwork(network, [CompoundMarkets(network)[CompoundVersions.CompoundV2]]),
  readMarket: ({ client, network }) => _getCompoundV2MarketsData(client, network),
  readPosition: ({ client, network }, address, _market, marketData) => _getCompoundV2AccountData(client, network, address, marketData.assetsData),
  holds: suppliesAnything,
});

export const crvUsdLending = lendingProtocol('crvUsd', {
  marketsKey: 'crvUsdMarketsData',
  label: 'Curve USD',
  markets: (network): CrvUSDMarketData[] => onNetwork(network, Object.values(CrvUsdMarkets(network))),
  readMarket: ({ client, network }, market) => _getCurveUsdGlobalData(client, network, market),
  readPosition: async ({ client, network }, address, market, marketData) => ({
    ...await _getCurveUsdUserData(client, network, address, market, marketData.activeBand),
    borrowRate: marketData.borrowRate,
  }),
  holds: suppliesOrBorrowsAnything,
});

export const llamaLendLending = lendingProtocol('llamaLend', {
  marketsKey: 'llamaLendMarketsData',
  label: 'LlamaLend',
  markets: (network): LlamaLendMarketData[] => ([NetworkNumber.Eth, NetworkNumber.Arb].includes(network) ? onNetwork(network, Object.values(LlamaLendMarkets(network))) : []),
  readMarket: ({ client, network }, market) => _getLlamaLendGlobalData(client, network, market),
  readPosition: async ({ client, network }, address, market, marketData) => ({
    ...await _getLlamaLendUserData(client, network, address, market, marketData),
    borrowRate: marketData.borrowRate,
  }),
  holds: suppliesOrBorrowsAnything,
});

/** Every lending protocol read through its entry, in the order positions list them. */
export const LENDING_PROTOCOLS = [
  aaveV3Lending,
  aaveV4Lending,
  morphoBlueLending,
  morphoMidnightLending,
  compoundV3Lending,
  sparkLending,
  aaveV2Lending,
  compoundV2Lending,
  crvUsdLending,
  llamaLendLending,
] as const;

export type LendingKey = typeof LENDING_PROTOCOLS[number]['key'];

/** The keys ./index.ts reads with code of its own. */
export type SpecialPositionKey = 'maker' | 'liquity' | 'fluid' | 'liquityV2';
type SpecialMarketsKey = 'liquityV2MarketsData';

// Every position key and every markets key is read by an entry here or by its own code in ./index.ts: one added to
// PortfolioPositionsDataForAddress or PortfolioMarketsData with neither is a compile error on these lines, naming it.
type UnreadPositionKey = Exclude<PositionKey, LendingKey | SpecialPositionKey>;
type UnreadMarketsKey = Exclude<MarketsKey, typeof LENDING_PROTOCOLS[number]['marketsKey'] | SpecialMarketsKey>;
export const EVERY_POSITION_KEY_IS_READ: [UnreadPositionKey] extends [never] ? true : UnreadPositionKey = true;
export const EVERY_MARKETS_KEY_IS_READ: [UnreadMarketsKey] extends [never] ? true : UnreadMarketsKey = true;
