/* global BigInt */
import Dec from 'decimal.js';
import { getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import {
  Abi, custom, parseAbi, parseAbiItem,
} from 'viem';
import {
  AaveMarkets, AaveV4Spokes, CompoundMarkets, compoundV2CollateralAssets, CrvUsdMarkets,
  LiquityV2Markets, LlamaLendMarkets, MorphoBlueMarkets, MorphoMidnightMarkets, SparkMarkets,
} from '../markets';
import { AaveVersions, CompoundVersions } from '../types';
import {
  EthAddress, EthereumProvider, NetworkNumber, PositionBalances, Amount,
} from '../types/common';
import { LendingSummaryOptions, WalletLendingSummaries, WalletLendingSummary } from '../types/lendingSummary';
import { ConfigKey, getConfigContractAbi, getConfigContractAddress } from '../contracts';
import { getViemProvider } from '../services/viem';
import { getWrappedNativeAssetFromUnwrapped } from '../services/utils';
import { getAaveLikeBalances } from '../helpers/aaveBalances';
import { parseFluidBalances } from '../helpers/fluidBalances';
import { _getAaveV4LoanBalances } from '../aaveV4';
import { _getCompoundV2AccountBalances } from '../compoundV2';
import { _getCompoundV3AccountBalances } from '../compoundV3';
import { _getCrvUsdAccountBalances } from '../curveUsd';
import { _getLlamaLendAccountBalances } from '../llamaLend';
import { _getMorphoBlueAccountBalances } from '../morphoBlue';
import { _getMorphoMidnightAccountBalances } from '../morphoMidnight';
import { _getLiquityAccountBalances } from '../liquity';
import { _getUserCdps } from '../maker';
import { nftContractCreationBlockMapping } from '../liquityV2';
import { lendingSummaryTransport } from './lendingSummaryTransport';

const nftAbi = parseAbi([
  'function troveNFT() view returns (address)', 'function balanceOf(address) view returns (uint256)',
  'function ownerOf(uint256) view returns (address)',
]);
const transfer = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');
const units = (value: unknown, decimals = 18) => new Dec(String(value)).div(new Dec(10).pow(decimals)).toString();
const positive = (value: unknown) => new Dec(String(value)).gt(0);
const supported = <T extends { chainIds: NetworkNumber[] }>(list: Record<string, T>, network: NetworkNumber) => Object.values(list).filter(m => m.chainIds.includes(network));

/** Lending-only balances at one snapshot, valued with caller-supplied market prices.
 * One shared client/limiter covers every wallet. Failed reads remain partial; cancellation
 * discards results. Morpho Blue earn deposits, rewards and savings are excluded.
 */
export async function getWalletLendingSummaries(
  provider: EthereumProvider, network: NetworkNumber, walletAddresses: EthAddress[], options: LendingSummaryOptions,
): Promise<WalletLendingSummaries> {
  const addresses = [...new Set(walletAddresses.map(address => {
    if (!/^0x[0-9a-f]{40}$/i.test(address)) throw new Error('Invalid wallet address');
    return address.toLowerCase() as EthAddress;
  }))];
  const summaries: Record<string, WalletLendingSummary> = Object.fromEntries(addresses.map(address => [address, {
    status: 'complete', positions: [], protocols: [], suppliedUsd: '0', valuationComplete: true, errors: [],
  }]));
  if (!addresses.length || options.signal?.aborted) return { summaries: {}, rateLimited: false };
  const maxCalldataBytes = options.isSim ? 2_000 : 32_000;
  const transport = lendingSummaryTransport(provider, options.signal, options.blockNumber, maxCalldataBytes);
  const client = getViemProvider(transport.provider, network, {
    transport: custom(transport.provider, { retryCount: 0 }), batch: { multicall: { batchSize: maxCalldataBytes } },
  });
  let snapshot: bigint;
  try {
    snapshot = options.blockNumber ?? await client.getBlockNumber();
    transport.pinBlock(snapshot);
  } catch (error) {
    if (options.signal?.aborted) return { summaries: {}, rateLimited: transport.isRateLimited() };
    for (const summary of Object.values(summaries)) { summary.status = 'failed'; summary.errors.push(String(error)); }
    return { summaries, rateLimited: transport.isRateLimited() };
  }
  const block = Number(snapshot);
  // Dynamic ABI boundary for user-scoped CDP/NFT reads; money markets use their existing readers.
  const read = (name: ConfigKey, functionName: string, args: readonly unknown[] = []): Promise<any> => client.readContract({
    address: getConfigContractAddress(name, network, block), abi: getConfigContractAbi(name, network, block) as Abi, functionName, args,
  });
  const nftRead = (address: EthAddress, functionName: 'troveNFT' | 'balanceOf' | 'ownerOf', args: readonly any[] = []): Promise<any> => client.readContract({
    address, abi: nftAbi as Abi, functionName, args,
  });
  const cache = new Map<string, Promise<any>>();
  const shared = <T>(key: string, fetch: () => Promise<T>): Promise<T> => {
    if (!cache.has(key)) cache.set(key, fetch());
    return cache.get(key)!;
  };
  const tasks: Promise<void>[] = [];
  const tokens = new Set<EthAddress>();
  const valuations: (() => void)[] = [];
  let prices: Record<string, string> = {};
  const run = async (address: string, protocol: string, key: string, work: () => Promise<void>) => {
    try { if (!options.signal?.aborted) await work(); } catch (error) {
      summaries[address].errors.push(`${protocol}:${key}: ${String(error).split('\n')[0]}`);
    }
  };
  const add = async (address: string, protocol: string, key: string, balances: PositionBalances, human = false) => {
    const supply = Object.entries(balances.collateral || {}).concat(Object.entries(balances.deposited || {}));
    const debt = Object.entries(balances.debt || {});
    if (![...supply, ...debt].some(([, amount]) => positive(amount))) return;
    const entry = {
      id: `${protocol}:${key}`,
      protocol,
      suppliedUsd: (supply.some(([, amount]) => positive(amount)) ? null : '0') as string | null,
      debtUsd: (debt.some(([, amount]) => positive(amount)) ? null : '0') as string | null,
    };
    summaries[address].positions.push(entry);
    const normalize = (amounts: [string, Amount][]) => {
      const result: Record<string, Dec> = {};
      amounts.filter(([, amount]) => positive(amount)).forEach(([symbol, amount]) => {
        const token = symbol.startsWith('0x') ? getAssetInfoByAddress(symbol, network) : getAssetInfo(getWrappedNativeAssetFromUnwrapped(symbol), network);
        if (!token.address || !Number.isFinite(token.decimals)) throw new Error(`Token metadata unavailable: ${symbol}`);
        const id = token.address.toLowerCase() as EthAddress;
        tokens.add(id);
        result[id] = (result[id] || new Dec(0)).add(human ? amount : units(amount, token.decimals));
      });
      return result;
    };
    const amounts = [normalize(supply), normalize(debt)];
    valuations.push(() => {
      (['suppliedUsd', 'debtUsd'] as const).forEach((field, i) => {
        try {
          entry[field] = Object.entries(amounts[i]).reduce((total, [token, amount]) => {
            const price = new Dec(prices[token] || 0);
            if (!price.isFinite() || !price.gt(0)) throw new Error(`Price unavailable: ${token}`);
            return total.add(amount.mul(price));
          }, new Dec(0)).toString();
        } catch (error) { summaries[address].errors.push(`${entry.id}: ${String(error)}`); }
      });
    });
  };
  const balanceTask = (address: string, protocol: string, key: string, fetch: () => Promise<PositionBalances>, human = false) => tasks.push(run(address, protocol, key, async () => add(address, protocol, key, await fetch(), human)));

  for (const address of addresses) {
    const aaveMarkets = supported(AaveMarkets(network), network).filter(m => [AaveVersions.AaveV2, AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].includes(m.value));
    for (const market of [...aaveMarkets, ...supported(SparkMarkets(network), network)]) {
      const v2 = market.value === AaveVersions.AaveV2;
      const spark = !aaveMarkets.some(m => m.value === market.value);
      balanceTask(address, spark ? 'spark' : v2 ? 'aaveV2' : 'aaveV3', market.value, () => getAaveLikeBalances(client, network, block, false, address, market,
        spark ? 'SparkView' : v2 ? 'AaveLoanInfoV2' : 'AaveV3View', market.assets.map(asset => getAssetInfo(getWrappedNativeAssetFromUnwrapped(asset), network).address as EthAddress)));
    }
    for (const spoke of supported(AaveV4Spokes(network), network)) {
      balanceTask(address, 'aaveV4', spoke.value, async () => {
        const { reserves } = await _getAaveV4LoanBalances(client, network, block, address, spoke.address);
        const balances: PositionBalances = { collateral: {}, debt: {} };
        reserves.forEach(r => {
          balances.collateral![r.underlying] = new Dec(balances.collateral![r.underlying] || 0).add(r.supplied.toString()).toString();
          balances.debt![r.underlying] = new Dec(balances.debt![r.underlying] || 0).add(r.totalDebt.toString()).toString();
        });
        return balances;
      });
    }
    for (const market of supported(CompoundMarkets(network), network)) {
      const v2 = market.value === CompoundVersions.CompoundV2;
      balanceTask(address, v2 ? 'compoundV2' : 'compoundV3', market.value, () => (v2
        ? _getCompoundV2AccountBalances(client, network, block, false, address, compoundV2CollateralAssets.map(a => a.address as EthAddress))
        : _getCompoundV3AccountBalances(client, network, block, false, address, market.baseMarketAddress)));
    }
    for (const market of supported(MorphoBlueMarkets(network), network)) balanceTask(address, 'morphoBlue', market.value, () => _getMorphoBlueAccountBalances(client, network, block, false, address, market), true);
    for (const market of supported(MorphoMidnightMarkets(network), network)) balanceTask(address, 'morphoMidnight', market.value, () => _getMorphoMidnightAccountBalances(client, network, block, false, address, market, true), true);
    if (network === NetworkNumber.Eth) for (const market of supported(CrvUsdMarkets(network), network)) balanceTask(address, 'crvUsd', market.value, () => _getCrvUsdAccountBalances(client, network, block, false, address, market.controllerAddress, true));
    if ([NetworkNumber.Eth, NetworkNumber.Arb].includes(network)) for (const market of supported(LlamaLendMarkets(network), network)) balanceTask(address, 'llamaLend', market.value, () => _getLlamaLendAccountBalances(client, network, block, false, address, market.controllerAddress, true));
    if (network === NetworkNumber.Eth) {
      balanceTask(address, 'liquity', 'trove', () => _getLiquityAccountBalances(client, network, block, false, address));
      tasks.push(run(address, 'maker', 'discovery', async () => {
        const cdps = await _getUserCdps(client, network, address);
        await Promise.all(cdps.map(cdp => run(address, 'maker', String(cdp.id), async () => {
          const [collateral, debt] = await read('McdVat', 'urns', [cdp.ilk, cdp.urn]);
          const rate = positive(debt) ? (await shared(`maker:${cdp.ilk}`, () => read('McdVat', 'ilks', [cdp.ilk])))[1] : 0;
          await add(address, 'maker', String(cdp.id), { collateral: { [cdp.asset]: units(collateral) }, debt: { DAI: new Dec(units(debt)).mul(units(rate, 27)).toString() } }, true);
        })));
      }));
      for (const market of supported(LiquityV2Markets(network), network)) {
        tasks.push(run(address, 'liquityV2', market.value, async () => {
          const nft = await shared(`nft:${market.value}`, () => nftRead(market.marketAddress, 'troveNFT'));
          const count = await nftRead(nft, 'balanceOf', [address]);
          if (count === BigInt(0)) return;
          const logs = await client.getLogs({
            address: nft, event: transfer, args: { to: address }, fromBlock: BigInt(nftContractCreationBlockMapping[market.value]), toBlock: snapshot,
          });
          const owned = (await Promise.all([...new Set(logs.map(log => log.args.tokenId!))].map(async id => {
            try { return (await nftRead(nft, 'ownerOf', [id])).toLowerCase() === address ? id : null; } catch { return null; }
          }))).filter((id): id is bigint => id !== null);
          if (BigInt(owned.length) !== count) summaries[address].errors.push(`liquityV2:${market.value}: Not all owned troves could be discovered`);
          await Promise.all(owned.map(id => run(address, 'liquityV2', `${market.value}:${id}`, async () => {
            const data = await read(market.isLegacy ? 'LiquityV2LegacyView' : 'LiquityV2View', 'getTroveInfo', [market.marketAddress, id]);
            if (data.owner.toLowerCase() !== address) throw new Error('Trove ownership changed');
            await add(address, 'liquityV2', `${market.value}:${id}`, { collateral: { [market.collateralToken]: data.collAmount.toString() }, debt: { [market.debtToken]: data.debtAmount.toString() } });
          })));
        }));
      }
    }
    if ([NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Base, NetworkNumber.Plasma].includes(network)) {
      tasks.push(run(address, 'fluid', 'discovery', async () => {
        const [positions, vaults] = await read('FluidView', 'getUserPositions', [address]);
        await Promise.all(positions.map((p: any, i: number) => run(address, 'fluid', String(p.nftId), async () => {
          if (positive(p.supply) || positive(p.borrow)) await add(address, 'fluid', String(p.nftId), parseFluidBalances(p, vaults[i], network), true);
        })));
      }));
    }
  }
  await Promise.all(tasks);
  if (options.signal?.aborted) return { summaries: {}, rateLimited: transport.isRateLimited() };
  if (tokens.size) {
    try { prices = await options.resolvePrices(network, [...tokens], options.signal); } catch (error) {
      for (const summary of Object.values(summaries)) if (summary.positions.length) summary.errors.push(`Prices: ${String(error)}`);
    }
  }
  if (options.signal?.aborted) return { summaries: {}, rateLimited: transport.isRateLimited() };
  valuations.forEach(value => value());
  for (const summary of Object.values(summaries)) {
    summary.positions.sort((a, b) => a.id.localeCompare(b.id));
    summary.protocols = [...new Set(summary.positions.map(p => p.protocol))];
    summary.suppliedUsd = summary.positions.reduce((total, p) => total.add(p.suppliedUsd || 0), new Dec(0)).toString();
    summary.valuationComplete = summary.positions.every(p => p.suppliedUsd !== null && p.debtUsd !== null);
    summary.errors = [...new Set(summary.errors)];
    if (summary.errors.length) summary.status = 'partial';
  }
  return { summaries, rateLimited: transport.isRateLimited() };
}
