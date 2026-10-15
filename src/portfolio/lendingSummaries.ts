/* global BigInt */
import Dec from 'decimal.js';
import { getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import {
  Abi, custom, parseAbi, parseAbiItem,
} from 'viem';
import {
  AaveMarkets, AaveV4Spokes, CompoundMarkets, compoundV2CollateralAssets, CrvUsdMarkets, LiquityV2Markets,
  LlamaLendMarkets, MorphoBlueMarkets, MorphoMidnightMarkets, SparkMarkets,
} from '../markets';
import { AaveVersions, CompoundVersions } from '../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../types/common';
import { LendingSummaryOptions, WalletLendingSummaries, WalletLendingSummary } from '../types/lendingSummary';
import { ConfigKey, getConfigContractAbi, getConfigContractAddress } from '../contracts';
import { getViemProvider } from '../services/viem';
import { getChainlinkAssetAddress } from '../services/priceService';
import { getWrappedNativeAssetFromUnwrapped } from '../services/utils';
import { USD_QUOTE } from '../constants';
import { _getUserCdps } from '../maker';
import { nftContractCreationBlockMapping } from '../liquityV2';
import { _getFluidSummaryPrices, _parseFluidPositionSummary } from '../fluid';
import { lendingSummaryTransport } from './lendingSummaryTransport';

const minimalAbi = parseAbi([
  'function getEntireDebtAndColl(address) view returns (uint256,uint256,uint256,uint256)',
  'function ORACLE() view returns (address)',
  'function troveNFT() view returns (address)',
  'function balanceOf(address) view returns (uint256)',
  'function ownerOf(uint256) view returns (address)',
  'function price() view returns (uint256)',
  'function decimals() view returns (uint8)',
]);
const transfer = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');
const number = (value: unknown) => new Dec(String(value));
const units = (value: unknown, decimals = 18) => number(value).div(new Dec(10).pow(decimals));
const sum = (values: unknown[]) => values.reduce<Dec>((total, value) => total.add(number(value)), new Dec(0));
const positive = (value: unknown) => number(value).gt(0);
const empty = (): WalletLendingSummary => ({
  status: 'complete', positions: [], protocols: [], suppliedUsd: '0', valuationComplete: true, errors: [],
});
const usd = (amount: unknown, price: unknown): Dec => {
  if (!positive(amount)) return new Dec(0);
  const p = number(price);
  if (!p.isFinite() || !p.gt(0)) throw new Error('Position price unavailable');
  return number(amount).mul(p);
};

/**
 * Discover lending balances and value only funded positions at one block snapshot.
 * Results are keyed by lowercase wallet address; unavailable valuations stay null,
 * and failed checks remain partial even when no positions were found. Morpho Blue
 * earn deposits, rewards and savings are excluded, matching portfolio lending previews.
 * Each invocation shares prices/metadata and limits RPC concurrency to four.
 * Cancellation discards the results; rate limiting returns completed work plus a flag.
 * Existing portfolio/existence APIs retain their original behavior.
 */
export async function getWalletLendingSummaries(
  provider: EthereumProvider, network: NetworkNumber, walletAddresses: EthAddress[], options: LendingSummaryOptions = {},
): Promise<WalletLendingSummaries> {
  const addresses = [...new Set(walletAddresses.map(address => {
    if (!/^0x[0-9a-f]{40}$/i.test(address)) throw new Error('Invalid wallet address');
    return address.toLowerCase() as EthAddress;
  }))];
  const summaries = Object.fromEntries(addresses.map(address => [address, empty()]));
  if (!addresses.length || options.signal?.aborted) return { summaries: {}, rateLimited: false };
  const maxCalldataBytes = options.isSim ? 2_000 : 32_000;
  const transport = lendingSummaryTransport(provider, options.signal, options.blockNumber, maxCalldataBytes);
  const client = getViemProvider(transport.provider, network, {
    transport: custom(transport.provider, { retryCount: 0 }),
    batch: { multicall: { batchSize: maxCalldataBytes } },
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
  const fluidPrices = new Map();
  const cache = new Map<string, Promise<any>>();
  const shared = <T>(key: string, fetch: () => Promise<T>): Promise<T> => {
    if (!cache.has(key)) cache.set(key, fetch());
    return cache.get(key)!;
  };
  // The dynamic ABI boundary is kept here; protocol readers below retain the actual raw fields.
  const read = (name: ConfigKey, functionName: string, args: readonly unknown[] = [], address?: EthAddress): Promise<any> => client.readContract({
    address: address || getConfigContractAddress(name, network, block),
    abi: getConfigContractAbi(name, network, block) as Abi,
    functionName,
    args,
  });
  const simple = (address: EthAddress, functionName: string, args: readonly unknown[] = []): Promise<any> => client.readContract({
    address, abi: minimalAbi as Abi, functionName, args,
  });
  const decimals = (address: EthAddress) => shared(`decimals:${address}`, async () => {
    const known = getAssetInfoByAddress(address, network).decimals;
    return Number.isFinite(known) ? known : Number(await simple(address, 'decimals'));
  });
  const loanPrice = (token: EthAddress) => shared(`usd:${token}`, async () => {
    const info = getAssetInfoByAddress(token, network);
    if (['USDA', 'RLUSD'].includes(info.symbol)) return '1';
    const feed = getChainlinkAssetAddress(info.symbol, network);
    // Optimism has no DFS feed registry; reuse its configured Aave USD oracle.
    if (network === NetworkNumber.Opt) {
      const market = AaveMarkets(network)[AaveVersions.AaveV3];
      return units((await shared(`AaveV3View:${market.value}:${token}`, () => read('AaveV3View', 'getPrices', [market.providerAddress, [token]])))[0], 8).toString();
    }
    if (network === NetworkNumber.Eth) return units(await read('FeedRegistry', 'latestAnswer', [feed, USD_QUOTE]), 8).toString();
    return units((await read('DFSFeedRegistry', 'latestRoundData', [feed, USD_QUOTE]))[1], 8).toString();
  });
  const compoundV2Tokens = compoundV2CollateralAssets.map(asset => asset.address as EthAddress);
  const tasks: Promise<void>[] = [];
  const run = async (address: string, protocol: string, key: string, work: () => Promise<void>) => {
    try {
      if (options.signal?.aborted) return;
      await work();
    } catch (error) {
      summaries[address].errors.push(`${protocol}:${key}: ${String(error).split('\n')[0]}`);
    }
  };
  const addTask = (address: string, protocol: string, key: string, work: () => Promise<void>) => tasks.push(run(address, protocol, key, work));
  const position = async (
    address: string, protocol: string, key: string, supply: unknown, debt: unknown,
    value: () => Promise<[Dec.Value, Dec.Value]>,
  ) => {
    if (!positive(supply) && !positive(debt)) return;
    const entry = {
      id: `${protocol}:${key}`, protocol, suppliedUsd: positive(supply) ? null : '0', debtUsd: positive(debt) ? null : '0',
    };
    summaries[address].positions.push(entry);
    const [s, d] = (await value()).map(v => new Dec(v));
    if (![s, d].every(v => v.isFinite() && v.gte(0)) || (positive(supply) && !s.gt(0)) || (positive(debt) && !d.gt(0))) throw new Error('Position valuation unavailable');
    entry.suppliedUsd = s.toString();
    entry.debtUsd = d.toString();
  };
  const supported = <T extends { chainIds: NetworkNumber[] }>(list: Record<string, T>) => Object.values(list).filter(market => market.chainIds.includes(network));

  for (const address of addresses) {
    for (const market of [...supported(AaveMarkets(network)), ...supported(SparkMarkets(network))]) {
      if (![AaveVersions.AaveV2, AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi].includes(market.value as AaveVersions) && !supported(SparkMarkets(network)).some(m => m.value === market.value)) continue;
      const v2 = market.value === AaveVersions.AaveV2;
      const spark = supported(SparkMarkets(network)).some(m => m.value === market.value);
      const protocol = spark ? 'spark' : v2 ? 'aaveV2' : 'aaveV3';
      const view = spark ? 'SparkView' : v2 ? 'AaveLoanInfoV2' : 'AaveV3View';
      addTask(address, protocol, market.value, async () => {
        const tokens = market.assets.map(asset => getAssetInfo(getWrappedNativeAssetFromUnwrapped(asset), network));
        // Keep individual view calls within the gas bounds used by the existing SDK.
        const middle = Math.ceil(tokens.length / 2);
        const balances = (await Promise.all([tokens.slice(0, middle), tokens.slice(middle)].filter(part => part.length).map(part => read(view, 'getTokenBalances', [market.providerAddress, address, part.map(token => token.address)])))).flat();
        // These views leave the returned token field unset; match balances to the input tokens.
        const used = balances.map((b, i) => ({ ...b, token: tokens[i].address, decimals: tokens[i].decimals })).filter(b => positive(b.balance) || positive(b.borrowsStable) || positive(b.borrowsVariable));
        await position(address, protocol, market.value, sum(used.map(b => b.balance)), sum(used.map(b => number(b.borrowsStable).add(b.borrowsVariable))), async () => {
          const ethUsd = v2 ? units(await shared('ethUsd', () => read('ETHPriceFeed', 'latestAnswer')), 8) : new Dec(1);
          const values = await Promise.all(used.map(async b => {
            const price = units((await shared(`${view}:${market.value}:${b.token}`, () => read(view, 'getPrices', [market.providerAddress, [b.token]])))[0], v2 ? 18 : 8).mul(ethUsd);
            return [usd(units(b.balance, b.decimals), price), usd(units(number(b.borrowsStable).add(b.borrowsVariable), b.decimals), price)];
          }));
          return [sum(values.map(v => v[0])), sum(values.map(v => v[1]))];
        });
      });
    }
    for (const spoke of supported(AaveV4Spokes(network))) {
      addTask(address, 'aaveV4', spoke.value, async () => {
        const { reserves } = await read('AaveV4View', 'getLoanData', [spoke.address, address]);
        const used = reserves.filter((r: any) => positive(r.supplied) || positive(r.totalDebt));
        await position(address, 'aaveV4', spoke.value, sum(used.map((r: any) => r.supplied)), sum(used.map((r: any) => r.totalDebt)), async () => {
          const values = await Promise.all(used.map(async (r: any) => {
            const [prices, scale] = await Promise.all([shared(`aaveV4:${spoke.address}:${r.reserveId}`, () => read('AaveV4View', 'getReservePrices', [spoke.address, [r.reserveId]])), decimals(r.underlying)]);
            const oracleDecimals = await shared(`aaveV4:oracle:${spoke.address}`, async () => Number(await simple(await simple(spoke.address, 'ORACLE'), 'decimals')));
            const price = units(prices[0], oracleDecimals);
            return [usd(units(r.supplied, scale), price), usd(units(r.totalDebt, scale), price)];
          }));
          return [sum(values.map(v => v[0])), sum(values.map(v => v[1]))];
        });
      });
    }
    for (const market of supported(CompoundMarkets(network))) {
      const v2 = market.value === CompoundVersions.CompoundV2;
      addTask(address, v2 ? 'compoundV2' : 'compoundV3', market.value, async () => {
        if (v2) {
          const tokens = compoundV2Tokens;
          const [supply, debt] = await read('CompoundLoanInfo', 'getTokenBalances', [address, tokens]);
          await position(address, 'compoundV2', market.value, sum(supply), sum(debt), async () => {
            const used = tokens.map((token: string, i: number) => ({ token, supply: supply[i], debt: debt[i] })).filter((b: any) => positive(b.supply) || positive(b.debt));
            const values = await Promise.all(used.map(async (b: any) => {
              const [price] = await shared(`compoundV2:${b.token}`, () => read('CompoundLoanInfo', 'getPrices', [[b.token]]));
              // Compound prices have 36 - underlyingDecimals precision; raw amount * price is 1e36 USD.
              return [usd(b.supply, price).div('1e36'), usd(b.debt, price).div('1e36')];
            }));
            return [sum(values.map((v: Dec[]) => v[0])), sum(values.map((v: Dec[]) => v[1]))];
          });
        } else {
          const data = await read('CompV3View', 'getLoanData', [market.baseMarketAddress, address]);
          await position(address, 'compoundV3', market.value, sum([data.depositAmount, ...data.collAmounts]), data.borrowAmount, async () => {
            const scale = getAssetInfo(market.baseAsset, network).decimals;
            const baseToken = getAssetInfo(getWrappedNativeAssetFromUnwrapped(market.baseAsset), network).address as EthAddress;
            const price = await loanPrice(baseToken);
            return [usd(units(data.depositValue, scale).add(units(data.collValue, 8)), price), usd(units(data.borrowValue, scale), price)];
          });
        }
      });
    }
    for (const market of supported(MorphoBlueMarkets(network))) {
      addTask(address, 'morphoBlue', market.value, async () => {
        const params = {
          loanToken: market.loanToken, collateralToken: market.collateralToken, oracle: market.oracle, irm: market.irm, lltv: BigInt(number(market.lltv).mul('1e18').toFixed(0)),
        };
        const data = await read('MorphoBlueView', 'getUserInfo', [params, address]);
        await position(address, 'morphoBlue', market.value, data.collateral, data.borrowedInAssets, async () => {
          const price = await loanPrice(market.loanToken);
          const oracle = positive(data.collateral) ? await shared(`oracle:${market.oracle}`, () => simple(market.oracle, 'price')) : '0';
          const scale = getAssetInfoByAddress(market.loanToken, network).decimals;
          return [usd(units(usd(data.collateral, oracle).div('1e36'), scale), price), usd(units(data.borrowedInAssets, scale), price)];
        });
      });
    }
    for (const market of supported(MorphoMidnightMarkets(network))) {
      addTask(address, 'morphoMidnight', market.value, async () => {
        const data = await read('MidnightView', 'getPositionInfo', [market.marketId, address]);
        const used = market.collaterals.map((coll, i) => ({ ...coll, amount: data.collateral[i] || BigInt(0), index: i })).filter(coll => !coll.hidden && positive(coll.amount));
        await position(address, 'morphoMidnight', market.value, sum([data.credit, ...used.map(coll => coll.amount)]), data.debt, async () => {
          const price = await loanPrice(market.loanToken);
          const info = used.length ? await shared(`midnight:${market.marketId}`, () => read('MidnightView', 'getMarketInfo', [market.marketId])) : null;
          const scale = getAssetInfoByAddress(market.loanToken, network).decimals;
          return [usd(units(sum([data.credit, ...used.map(coll => usd(coll.amount, info.prices[coll.index]).div('1e36'))]), scale), price), usd(units(data.debt, scale), price)];
        });
      });
    }
    const curveMarkets = network === NetworkNumber.Eth ? supported(CrvUsdMarkets(network)) : [];
    const llamaMarkets = [NetworkNumber.Eth, NetworkNumber.Arb].includes(network) ? supported(LlamaLendMarkets(network)) : [];
    for (const market of [...curveMarkets, ...llamaMarkets]) {
      const llama = llamaMarkets.some(m => m.value === market.value);
      const protocol = llama ? 'llamaLend' : 'crvUsd';
      addTask(address, protocol, market.value, async () => {
        const data = await read(llama ? 'LlamaLendView' : 'crvUSDView', 'userData', [market.controllerAddress, address]);
        const baseSupply = llama ? data.debtTokenCollateralAmount : data.curveUsdCollateralAmount;
        await position(address, protocol, market.value, sum([data.marketCollateralAmount, baseSupply]), data.debtAmount, async () => {
          const oracle = units(data.collateralPrice);
          const collPrice = llama && market.collAsset === 'crvUSD' ? new Dec(1) : oracle;
          const debtPrice = market.baseAsset === 'crvUSD' ? new Dec(1) : new Dec(1).div(oracle);
          const coll = units(data.marketCollateralAmount, getAssetInfo(market.collAsset, network).decimals);
          const baseDecimals = getAssetInfo(market.baseAsset, network).decimals;
          return [usd(coll, collPrice).add(usd(units(baseSupply, baseDecimals), debtPrice)), usd(units(data.debtAmount, baseDecimals), debtPrice)];
        });
      });
    }
    if (network === NetworkNumber.Eth) {
      addTask(address, 'maker', 'discovery', async () => {
        const cdps = await _getUserCdps(client, network, address);
        await Promise.all(cdps.map(cdp => run(address, 'maker', String(cdp.id), async () => {
          const [collateral, debt] = await read('McdVat', 'urns', [cdp.ilk, cdp.urn]);
          await position(address, 'maker', String(cdp.id), collateral, debt, async () => {
            const [price, ilk] = await Promise.all([shared(`maker:price:${cdp.ilk}`, () => read('McdView', 'getPrice', [cdp.ilk])), shared(`maker:rate:${cdp.ilk}`, () => read('McdVat', 'ilks', [cdp.ilk]))]);
            return [usd(units(collateral), units(price, 27)), units(debt).mul(units(ilk[1], 27))];
          });
        })));
      });
      addTask(address, 'liquity', 'trove', async () => {
        const [debt, collateral] = await simple(getConfigContractAddress('TroveManager', network, block), 'getEntireDebtAndColl', [address]);
        await position(address, 'liquity', 'trove', collateral, debt, async () => [usd(units(collateral), units(await shared('liquity:price', () => read('PriceFeed', 'fetchPrice')))), units(debt)]);
      });
      for (const market of supported(LiquityV2Markets(network))) {
        addTask(address, 'liquityV2', market.value, async () => {
          const nft = await shared(`troveNFT:${market.value}`, () => simple(market.marketAddress, 'troveNFT'));
          const count = await simple(nft, 'balanceOf', [address]);
          if (count === BigInt(0)) return;
          const toBlock = snapshot;
          const logs = await client.getLogs({
            address: nft, event: transfer, args: { to: address }, fromBlock: BigInt(nftContractCreationBlockMapping[market.value]), toBlock,
          });
          const ids = [...new Set(logs.map(log => log.args.tokenId!))];
          const owned = (await Promise.all(ids.map(async id => {
            try { return (await simple(nft, 'ownerOf', [id])).toLowerCase() === address ? id : null; } catch { return null; }
          }))).filter((id): id is bigint => id !== null);
          if (BigInt(owned.length) !== count) summaries[address].errors.push(`liquityV2:${market.value}: Not all owned troves could be discovered`);
          await Promise.all(owned.map(id => run(address, 'liquityV2', `${market.value}:${id}`, async () => {
            const data = await read(market.isLegacy ? 'LiquityV2LegacyView' : 'LiquityV2View', 'getTroveInfo', [market.marketAddress, id]);
            if (data.owner.toLowerCase() !== address) throw new Error('Trove ownership changed');
            await position(address, 'liquityV2', `${market.value}:${id}`, data.collAmount, data.debtAmount, async () => [usd(units(data.collAmount), units(data.collPrice)), units(data.debtAmount)]);
          })));
        });
      }
    }
    if ([NetworkNumber.Eth, NetworkNumber.Arb, NetworkNumber.Base, NetworkNumber.Plasma].includes(network)) {
      addTask(address, 'fluid', 'discovery', async () => {
        const [positions, vaults] = await read('FluidView', 'getUserPositions', [address]);
        await Promise.all(positions.map((p: any, i: number) => run(address, 'fluid', String(p.nftId), () => position(address, 'fluid', String(p.nftId), p.supply, p.borrow, async () => {
          const vault = vaults[i];
          const tokens = [...new Set([vault.supplyToken0, vault.supplyToken1, vault.borrowToken0, vault.borrowToken1].filter(token => token && !/^0x0{40}$/i.test(token)).map(token => getAssetInfoByAddress(token, network).symbol))];
          const prices = Object.assign({}, ...await Promise.all(tokens.map(token => shared(`fluid:price:${token}`, () => _getFluidSummaryPrices([...new Set([token, 'ETH', 'WBTC', 'wstETH'])], client, network, fluidPrices)))));
          const data = await _parseFluidPositionSummary(client, network, p, vault, prices);
          for (const asset of Object.values(data.usedAssets)) {
            if (positive(asset.supplied) && !positive(asset.suppliedUsd)) throw new Error('Fluid supply price unavailable');
            if (positive(asset.borrowed) && !positive(asset.borrowedUsd)) throw new Error('Fluid debt price unavailable');
          }
          return [data.suppliedUsd, data.borrowedUsd];
        }))));
      });
    }
  }
  await Promise.all(tasks);
  if (options.signal?.aborted) return { summaries: {}, rateLimited: transport.isRateLimited() };
  for (const summary of Object.values(summaries)) {
    summary.positions.sort((a, b) => a.id.localeCompare(b.id));
    summary.protocols = [...new Set(summary.positions.map(p => p.protocol))];
    summary.suppliedUsd = sum(summary.positions.map(p => p.suppliedUsd || '0')).toString();
    summary.valuationComplete = summary.positions.every(p => p.suppliedUsd !== null && p.debtUsd !== null);
    summary.errors = [...new Set(summary.errors)];
    if (summary.errors.length) summary.status = 'partial';
  }
  return { summaries, rateLimited: transport.isRateLimited() };
}
