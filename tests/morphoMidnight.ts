import 'dotenv/config';
import Dec from 'decimal.js';

import * as sdk from '../src';

import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { MorphoMidnightMarketData, MorphoMidnightMarketInfo } from '../src/types';
import { getProvider } from './utils/getProvider';
import { getViemProvider } from '../src/services/viem';
import { MorphoMidnightViewContractViem } from '../src/contracts';
import {
  getMorphoMidnightBorrowQuote, getMorphoMidnightMarketBook, getMorphoMidnightPaybackQuote,
  getMorphoMidnightPaybackUnitsQuote, getMorphoMidnightUserBorrowInfo, midnightApyFromPrice,
  midnightPriceFromApy, midnightSlippageParam, midnightTimeToMaturityDays,
} from '../src/helpers/morphoMidnightHelpers';

const { assert } = require('chai');

// Known Base positions in the cbBTC/USDC market (0x168e31...), used to validate the getters against
// live on-chain state. Assertions are written to stay green even if these positions later change.
const BORROWER = '0x37A87cA1ef98Ea3Fc6bDa550538d9aEd38D77E99';
const LENDER = '0xD1373084D7c99d8C20C11371e2eA968a7B90e5d6';
// Borrower documented by the Solidity team in the cbBTC/USDC 2026-08-28 market (0x059597...); used to
// validate the off-chain borrow-rate/debt math. Position may change, so assertions stay tolerant.
const DOC_BORROWER = '0x2e3Cc8Cd22812eaa229CbE85f3de7c9a39A8f4f7';

const isPositive = (value: bigint): boolean => new Dec(value.toString()).gt(0);

// Rebuild the on-chain Market struct from the hardcoded config so we can recompute its id. Collaterals
// come from the shared getter rather than `market.collaterals`, for the same reason the app's tx builder
// uses it: the hidden ones are part of the hash.
const marketToStruct = (market: MorphoMidnightMarketData, network: NetworkNumber) => ({
  chainId: BigInt(network),
  midnight: market.midnight as `0x${string}`,
  loanToken: market.loanToken as `0x${string}`,
  collateralParams: sdk.markets.morphoMidnightMarketCollateralParams(market).map((c) => ({
    token: c.token as `0x${string}`,
    lltv: BigInt(new Dec(c.lltv).mul(1e18).toFixed(0)),
    liquidationCursor: BigInt(c.liquidationCursor),
    oracle: c.oracle as `0x${string}`,
  })),
  maturity: BigInt(market.maturity),
  rcfThreshold: BigInt(market.rcfThreshold),
  enterGate: market.enterGate as `0x${string}`,
  liquidatorGate: market.liquidatorGate as `0x${string}`,
});

describe('Morpho Midnight', function midnightSuite() {
  this.timeout(60000);
  const network = NetworkNumber.Base;
  let provider: EthereumProvider;

  before(() => {
    provider = getProvider('RPCBASE');
  });

  const markets = () => Object.values(sdk.markets.MorphoMidnightMarkets(network)) as MorphoMidnightMarketData[];

  const fetchMarketData = async (selectedMarket: MorphoMidnightMarketData): Promise<MorphoMidnightMarketInfo> => {
    const marketData = await sdk.morphoMidnight.getMorphoMidnightMarketData(provider, network, selectedMarket);

    assert.containsAllKeys(marketData, ['assetsData', 'maturity', 'isMatured', 'totalDebt', 'withdrawable', 'tickSpacing']);
    assert.isAbove(marketData.maturity, 0);
    assert.isNumber(marketData.tickSpacing);

    // loan token + every collateral must be present in assetsData with the standard fields
    const expectedSymbols = [marketData.loanToken, ...marketData.collaterals];
    assert.containsAllKeys(marketData.assetsData, expectedSymbols);
    for (const symbol of expectedSymbols) {
      const tokenData = marketData.assetsData[symbol];
      for (const key of ['symbol', 'price', 'supplyRate', 'borrowRate'] as const) {
        assert.isDefined(tokenData[key], `${key} is undefined for ${symbol}`);
      }
    }
    // collateral prices come from the market oracle (prices[]) and should be positive
    for (const collSymbol of marketData.collaterals) {
      assert.isTrue(new Dec(marketData.assetsData[collSymbol].price).gt(0), `collateral ${collSymbol} price should be > 0`);
    }
    return marketData;
  };

  it('fetches market data for every curated market', async () => {
    for (const market of markets()) {
      await fetchMarketData(market);
    }
  });

  /**
   * Every configured market must describe the market its `marketId` actually resolves to on-chain, and
   * hash back to it. The `toId` half is the one that matters for writes: a struct missing a collateral is
   * still a perfectly valid market to the core, so a call built from it lands in a market of its own
   * making instead of reverting. Tenor's markets carry a collateral the app never surfaces (the curator's
   * ERC-4626 vault) — `hiddenCollaterals` keeps it out of the UI without dropping it from the hash.
   *
   * The listed collaterals are additionally asserted to be the on-chain *prefix*: the SDK reads
   * `prices[i]` and `collateral[i]` positionally against `collaterals`, so a hidden entry that sorted
   * ahead of a listed one would price the wrong asset.
   */
  it('has marketIds that resolve to the configured market on-chain', async () => {
    const client = getViemProvider(provider, network);
    const view = MorphoMidnightViewContractViem(client, network);
    for (const market of markets()) {
      const onChain = await view.read.toMarket([market.marketId as `0x${string}`]);
      const struct = marketToStruct(market, network);

      assert.strictEqual(onChain.midnight.toLowerCase(), struct.midnight.toLowerCase(), `midnight mismatch for ${market.value}`);
      assert.strictEqual(onChain.loanToken.toLowerCase(), struct.loanToken.toLowerCase(), `loanToken mismatch for ${market.value}`);
      assert.strictEqual(onChain.maturity, struct.maturity, `maturity mismatch for ${market.value}`);
      assert.strictEqual(onChain.rcfThreshold, struct.rcfThreshold, `rcfThreshold mismatch for ${market.value}`);
      assert.strictEqual(onChain.enterGate.toLowerCase(), struct.enterGate.toLowerCase(), `enterGate mismatch for ${market.value}`);
      assert.strictEqual(onChain.liquidatorGate.toLowerCase(), struct.liquidatorGate.toLowerCase(), `liquidatorGate mismatch for ${market.value}`);

      assert.strictEqual(struct.collateralParams.length, onChain.collateralParams.length, `collateral count mismatch for ${market.value}`);
      struct.collateralParams.forEach((coll, i) => {
        assert.strictEqual(onChain.collateralParams[i].token.toLowerCase(), coll.token.toLowerCase(), `collateral[${i}] token mismatch for ${market.value}`);
        assert.strictEqual(onChain.collateralParams[i].lltv, coll.lltv, `collateral[${i}] lltv mismatch for ${market.value}`);
        assert.strictEqual(onChain.collateralParams[i].liquidationCursor, coll.liquidationCursor, `collateral[${i}] cursor mismatch for ${market.value}`);
        assert.strictEqual(onChain.collateralParams[i].oracle.toLowerCase(), coll.oracle.toLowerCase(), `collateral[${i}] oracle mismatch for ${market.value}`);
      });
      market.collaterals.forEach((coll, i) => {
        assert.strictEqual(onChain.collateralParams[i].token.toLowerCase(), coll.token.toLowerCase(), `listed collateral[${i}] is not the on-chain one for ${market.value}`);
      });

      const id = await view.read.toId([struct]);
      assert.strictEqual(id.toLowerCase(), market.marketId.toLowerCase(), `toId mismatch for ${market.value}`);
    }
  });

  it('reads a borrower position consistently with on-chain state', async () => {
    const market = sdk.markets.MorphoMidnightMarkets(network)[sdk.MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base];
    const marketInfo = await fetchMarketData(market);

    const client = getViemProvider(provider, network);
    const view = MorphoMidnightViewContractViem(client, network);
    const onChain = await view.read.getPositionInfo([market.marketId as `0x${string}`, BORROWER as `0x${string}`]);

    const accData = await sdk.morphoMidnight.getMorphoMidnightAccountData(provider, network, BORROWER as any, market, marketInfo);

    assert.isTrue(new Dec(accData.debt).gte(0));
    assert.strictEqual(new Dec(accData.borrowedUsd).gt(0), isPositive(onChain.debt));

    if (isPositive(onChain.debt)) {
      // computed ratio (%) must match the on-chain ratio (1e18-scaled) to within rounding
      const onChainRatioPct = new Dec(onChain.ratio.toString()).div(1e18).mul(100);
      assert.approximately(+accData.ratio, onChainRatioPct.toNumber(), 0.5, 'computed ratio should match on-chain ratio');
      assert.isTrue(new Dec(accData.usedAssets.cbBTC.supplied).gt(0), 'borrower should have cbBTC collateral');
      assert.isFalse(accData.usedAssets.USDC.isSupplied);
      assert.isTrue(accData.usedAssets.USDC.isBorrowed);
    }
  });

  it('reads a lender (credit) earn position', async () => {
    const market = sdk.markets.MorphoMidnightMarkets(network)[sdk.MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base];
    const marketInfo = await fetchMarketData(market);

    const client = getViemProvider(provider, network);
    const view = MorphoMidnightViewContractViem(client, network);
    const onChain = await view.read.getPositionInfo([market.marketId as `0x${string}`, LENDER as `0x${string}`]);

    const earn = await sdk.morphoMidnight.getMorphoMidnightEarn(client, network, LENDER as any, market, marketInfo);
    assert.containsAllKeys(earn, ['apy', 'amount', 'amountUsd']);
    assert.strictEqual(new Dec(earn.amount).gt(0), isPositive(onChain.credit));

    if (isPositive(onChain.credit)) {
      assert.isTrue(new Dec(earn.amountUsd).gt(0));
      const accData = await sdk.morphoMidnight.getMorphoMidnightAccountData(provider, network, LENDER as any, market, marketInfo);
      assert.isTrue(accData.usedAssets.USDC.isSupplied, 'lender should have supplied USDC (credit)');
      assert.isFalse(accData.usedAssets.USDC.isBorrowed);
    }
  });

  const market20260828 = () => sdk.markets.MorphoMidnightMarkets(network)[sdk.MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base];

  it('quotes a borrow from the orderbook and derives the estimated rate + slippage cap', async function quoteTest() {
    const market = market20260828();
    const assetsRaw = '2000000'; // 2 USDC (6 decimals)
    const slippage = 0.5;

    let quote;
    try {
      quote = await getMorphoMidnightBorrowQuote(market.marketId, assetsRaw, slippage, market.maturity);
    } catch (err) {
      // Orderbook may be unable to fill (empty book / matured) — skip rather than fail on live liquidity.
      this.skip();
      return;
    }

    assert.containsAllKeys(quote, ['bestPrice', 'worstPrice', 'estBorrowRate', 'maxRate', 'newUnits', 'maxUnits', 'takeableOffers']);
    // Discount price: 0 < worst <= best < 1 for a fixed-term borrow.
    assert.isTrue(new Dec(quote.bestPrice).gt(0) && new Dec(quote.bestPrice).lt(1), 'bestPrice in (0,1)');
    assert.isTrue(new Dec(quote.worstPrice).lte(quote.bestPrice), 'worstPrice <= bestPrice');
    assert.isTrue(new Dec(quote.estBorrowRate).gt(0), 'estimated borrow rate should be positive');
    // maxRate is the APY the cap permits (the annualized worst price), NOT estimate + slippage — the
    // API's `slippage` is a price-level knob, so adding it to an APY mixes units.
    const ttmDays = midnightTimeToMaturityDays(market.maturity);
    assert.approximately(+quote.maxRate, +midnightApyFromPrice(quote.worstPrice, ttmDays), 1e-6);
    assert.isTrue(new Dec(quote.maxRate).gte(quote.estBorrowRate), 'maxRate >= estBorrowRate');
    // Units follow assets / price; worse price yields more (or equal) debt units → the cap.
    assert.approximately(+quote.newUnits, +assetsRaw / +quote.bestPrice, 1);
    assert.isTrue(new Dec(quote.maxUnits).gte(quote.newUnits), 'maxUnits >= newUnits');
    // estBorrowRate is exactly the annualized best price.
    assert.approximately(+quote.estBorrowRate, +midnightApyFromPrice(quote.bestPrice, ttmDays), 1e-6);
  });

  it('honours an absolute max borrow rate exactly', async function rateCapTest() {
    const market = market20260828();
    const assetsRaw = '2000000'; // 2 USDC (6 decimals)

    let base;
    try {
      base = await getMorphoMidnightBorrowQuote(market.marketId, assetsRaw, 0.5, market.maturity);
    } catch (err) {
      this.skip();
      return;
    }

    // A ceiling above the estimate caps at exactly that rate, and loosens as it rises.
    const cap = new Dec(base.estBorrowRate).add(2);
    const quote = await getMorphoMidnightBorrowQuote(market.marketId, assetsRaw, 0.5, market.maturity, cap);
    assert.approximately(+quote.maxRate, cap.toNumber(), 1e-6, 'maxRate should be the requested ceiling');
    assert.approximately(+quote.maxUnits, +assetsRaw / +midnightPriceFromApy(cap, midnightTimeToMaturityDays(market.maturity)), 1);
    assert.isTrue(new Dec(quote.maxUnits).gt(quote.newUnits), 'a ceiling above the estimate leaves headroom');
    // The estimate and the offers to fill against are unaffected by the cap. Compared with a tolerance:
    // the two quotes are taken seconds apart and the rate is annualized against a live time-to-maturity.
    assert.approximately(+quote.estBorrowRate, +base.estBorrowRate, 1e-3);
    assert.strictEqual(quote.takeableOffers.length, base.takeableOffers.length);

    // A ceiling below the estimate leaves no headroom — the borrow would revert on-chain, by design.
    const tight = await getMorphoMidnightBorrowQuote(market.marketId, assetsRaw, 0.5, market.maturity, new Dec(base.estBorrowRate).div(2));
    assert.isTrue(new Dec(tight.maxUnits).lt(tight.newUnits), 'maxUnits < newUnits when the ceiling is under the market rate');
  });

  it('quotes a payback from the orderbook as the mirror image of a borrow', async function paybackQuoteTest() {
    const market = market20260828();
    const assetsRaw = '2000000'; // 2 USDC (6 decimals) SPENT

    let quote;
    try {
      quote = await getMorphoMidnightPaybackQuote(market.marketId, assetsRaw, 0.5, market.maturity);
    } catch (err) {
      // Ask side may be unable to fill (empty book / matured) — skip rather than fail on live liquidity.
      this.skip();
      return;
    }

    assert.containsAllKeys(quote, ['bestPrice', 'worstPrice', 'estPaybackRate', 'minRate', 'newUnits', 'minUnits', 'takeableOffers']);
    assert.isTrue(new Dec(quote.bestPrice).gt(0) && new Dec(quote.bestPrice).lt(1), 'bestPrice in (0,1)');
    // Opposite of the borrow side: slippage makes a unit DEARER, so the worst price is the higher one.
    assert.isTrue(new Dec(quote.worstPrice).gte(quote.bestPrice), 'worstPrice >= bestPrice');
    assert.isTrue(new Dec(quote.estPaybackRate).gt(0), 'estimated payback rate should be positive');

    const ttmDays = midnightTimeToMaturityDays(market.maturity);
    assert.approximately(+quote.estPaybackRate, +midnightApyFromPrice(quote.bestPrice, ttmDays), 1e-6);
    assert.approximately(+quote.minRate, +midnightApyFromPrice(quote.worstPrice, ttmDays), 1e-6);
    assert.isTrue(new Dec(quote.minRate).lte(quote.estPaybackRate), 'minRate <= estPaybackRate');
    // Spending less than a whole loan token per unit means the debt retired exceeds what is spent.
    assert.approximately(+quote.newUnits, +assetsRaw / +quote.bestPrice, 1);
    assert.isTrue(new Dec(quote.newUnits).gt(assetsRaw), 'units bought exceed the assets spent');
    assert.isTrue(new Dec(quote.minUnits).lte(quote.newUnits), 'minUnits <= newUnits');
  });

  it('honours an absolute min payback rate exactly', async function rateFloorTest() {
    const market = market20260828();
    const assetsRaw = '2000000'; // 2 USDC (6 decimals)

    let base;
    try {
      base = await getMorphoMidnightPaybackQuote(market.marketId, assetsRaw, 0.5, market.maturity);
    } catch (err) {
      this.skip();
      return;
    }

    // A floor below the estimate pins at exactly that rate, and loosens as it drops.
    const floor = Dec.max(new Dec(base.estPaybackRate).sub(2), 0.01);
    const quote = await getMorphoMidnightPaybackQuote(market.marketId, assetsRaw, 0.5, market.maturity, floor);
    assert.approximately(+quote.minRate, floor.toNumber(), 1e-6, 'minRate should be the requested floor');
    assert.approximately(+quote.minUnits, +assetsRaw / +midnightPriceFromApy(floor, midnightTimeToMaturityDays(market.maturity)), 1);
    assert.isTrue(new Dec(quote.minUnits).lt(quote.newUnits), 'a floor below the estimate leaves headroom');
    assert.strictEqual(quote.estPaybackRate, base.estPaybackRate);
    assert.strictEqual(quote.takeableOffers.length, base.takeableOffers.length);

    // A floor above the estimate leaves no headroom — the payback would revert on-chain, by design.
    const tight = await getMorphoMidnightPaybackQuote(market.marketId, assetsRaw, 0.5, market.maturity, new Dec(base.estPaybackRate).add(2));
    assert.isTrue(new Dec(tight.minUnits).gt(tight.newUnits), 'minUnits > newUnits when the floor is over the market rate');
  });

  it('quotes a payback against a units target, pricing what the close costs', async function paybackUnitsQuoteTest() {
    const market = market20260828();
    const unitsRaw = '2000000'; // 2 USDC (6 decimals) of debt RETIRED

    let quote;
    try {
      quote = await getMorphoMidnightPaybackUnitsQuote(market.marketId, unitsRaw, 0.5, market.maturity);
    } catch (err) {
      // Ask side may be unable to fill (empty book / matured) — skip rather than fail on live liquidity.
      this.skip();
      return;
    }

    assert.containsAllKeys(quote, ['bestPrice', 'worstPrice', 'estPaybackRate', 'minRate', 'newAssets', 'maxAssets', 'takeableOffers']);
    const ttmDays = midnightTimeToMaturityDays(market.maturity);
    assert.approximately(+quote.estPaybackRate, +midnightApyFromPrice(quote.bestPrice, ttmDays), 1e-6);
    assert.approximately(+quote.minRate, +midnightApyFromPrice(quote.worstPrice, ttmDays), 1e-6);

    // The whole point of the units target: retiring N units costs LESS than N loan tokens before maturity,
    // and the ceiling sits above the cost rather than at the debt's face value.
    assert.approximately(+quote.newAssets, +unitsRaw * +quote.bestPrice, 1);
    assert.isTrue(new Dec(quote.newAssets).lt(unitsRaw), 'the close costs less than the debt face value');
    assert.isTrue(new Dec(quote.maxAssets).gte(quote.newAssets), 'maxAssets >= newAssets');
    assert.isTrue(new Dec(quote.maxAssets).lte(unitsRaw), 'even the ceiling stays under the face value');

    // Same side, same offer list as the assets-target quote — only the two amounts swap roles.
    const spendQuote = await getMorphoMidnightPaybackQuote(market.marketId, quote.newAssets, 0.5, market.maturity);
    assert.strictEqual(quote.takeableOffers.length, spendQuote.takeableOffers.length);
    assert.approximately(+spendQuote.newUnits, +unitsRaw, +unitsRaw * 1e-4, 'the two quotes round-trip');
  });

  it('honours an absolute min payback rate exactly on a units target', async function unitsRateFloorTest() {
    const market = market20260828();
    const unitsRaw = '2000000';

    let base;
    try {
      base = await getMorphoMidnightPaybackUnitsQuote(market.marketId, unitsRaw, 0.5, market.maturity);
    } catch (err) {
      this.skip();
      return;
    }

    // A floor below the estimate pins at exactly that rate, widening the spend ceiling as it drops.
    const floor = Dec.max(new Dec(base.estPaybackRate).sub(2), 0.01);
    const quote = await getMorphoMidnightPaybackUnitsQuote(market.marketId, unitsRaw, 0.5, market.maturity, floor);
    assert.approximately(+quote.minRate, floor.toNumber(), 1e-6, 'minRate should be the requested floor');
    assert.approximately(+quote.maxAssets, +unitsRaw * +midnightPriceFromApy(floor, midnightTimeToMaturityDays(market.maturity)), 1);
    assert.isTrue(new Dec(quote.maxAssets).gt(quote.newAssets), 'a floor below the estimate leaves headroom');
    assert.strictEqual(quote.estPaybackRate, base.estPaybackRate);

    // A floor above the estimate leaves no headroom — the payback would revert on-chain, by design.
    const tight = await getMorphoMidnightPaybackUnitsQuote(market.marketId, unitsRaw, 0.5, market.maturity, new Dec(base.estPaybackRate).add(2));
    assert.isTrue(new Dec(tight.maxAssets).lt(tight.newAssets), 'maxAssets < newAssets when the floor is over the market rate');
  });

  it('parses both book sides best-first', async function bookSideTest() {
    const market = market20260828();
    const [bids, asks] = await Promise.all([
      getMorphoMidnightMarketBook(market, network),
      getMorphoMidnightMarketBook(market, network, 'asks'),
    ]);
    if (!bids || !asks) {
      this.skip();
      return;
    }

    // Best-first means cheapest rate on the bids a borrower fills, dearest on the asks a repayer buys.
    assert.strictEqual(bids.bestRate, bids.offers[0].rate);
    assert.strictEqual(asks.bestRate, asks.offers[0].rate);
    bids.offers.forEach((offer, i) => i > 0 && assert.isTrue(new Dec(offer.rate).gte(bids.offers[i - 1].rate), 'bids ascending by rate'));
    asks.offers.forEach((offer, i) => i > 0 && assert.isTrue(new Dec(offer.rate).lte(asks.offers[i - 1].rate), 'asks descending by rate'));
    // The spread, in rate terms: sell offers are priced above buy offers, and price is inverse to rate,
    // so the best rate on the ask side sits at or below the best rate on the bid side. Compared with a
    // tolerance because the two sides are fetched separately and each annualizes against its own clock —
    // when the book is uncrossed (both sides resting on the same price level) that drift alone can flip it.
    assert.isTrue(new Dec(asks.bestRate).lte(new Dec(bids.bestRate).add(1e-3)), 'best ask rate <= best bid rate');
  });

  it('reports why the API rejected a quote', async () => {
    const market = market20260828();
    // Far beyond any book's depth → INSUFFICIENT_LIQUIDITY rather than a bare "unavailable".
    try {
      await getMorphoMidnightBorrowQuote(market.marketId, '99999999999999999999', 0.5, market.maturity);
      assert.fail('expected the quote to throw');
    } catch (err) {
      assert.match((err as Error).message, /Morpho Midnight quote unavailable: .+/, 'error should carry the API reason');
    }
  });

  it('derives borrow rate + principal/interest split for a borrower, consistent with on-chain debt', async () => {
    const market = market20260828();
    const marketInfo = await fetchMarketData(market);

    const client = getViemProvider(provider, network);
    const view = MorphoMidnightViewContractViem(client, network);
    const onChain = await view.read.getPositionInfo([market.marketId as `0x${string}`, DOC_BORROWER as `0x${string}`]);

    const info = await getMorphoMidnightUserBorrowInfo(DOC_BORROWER, market.marketId, marketInfo.loanToken);
    assert.containsAllKeys(info, ['borrowRate', 'debtBase', 'debtInterest', 'debtTotal']);
    // debtInterest is always debtTotal − debtBase, and base never exceeds total.
    assert.approximately(+info.debtInterest, +info.debtTotal - +info.debtBase, 1e-6);
    assert.isTrue(new Dec(info.debtBase).lte(info.debtTotal), 'debtBase <= debtTotal');

    if (isPositive(onChain.debt)) {
      // Σ borrow units (from the API) should reconcile with the on-chain total debt at maturity.
      const onChainDebt = new Dec(onChain.debt.toString()).div(1e6); // USDC 6 decimals
      assert.approximately(+info.debtTotal, onChainDebt.toNumber(), Math.max(0.01, onChainDebt.mul(0.01).toNumber()), 'debtTotal should reconcile with on-chain debt');
      assert.isTrue(new Dec(info.borrowRate).gt(0), 'borrow rate should be positive for an open borrow');

      // The account getter should surface the same enriched fields.
      const accData = await sdk.morphoMidnight.getMorphoMidnightAccountData(provider, network, DOC_BORROWER as any, market, marketInfo);
      assert.strictEqual(accData.borrowRate, info.borrowRate);
      assert.strictEqual(accData.debtBase, info.debtBase);
      assert.strictEqual(accData.debtInterest, info.debtInterest);
      assert.strictEqual(accData.usedAssets.USDC.borrowRate, info.borrowRate);
    }
  });
});

describe('Morpho Midnight rate math (pure)', () => {
  // Worked examples from the Solidity team spec (fixed-term cbBTC/USDC, maturity 2026-08-28 = 1787929200).
  const MATURITY = 1787929200;

  it('annualizes a discount price into the borrow APY', () => {
    // Quote example: average_best_price 0.9959551, ttm 35.22044 days → 4.289815%.
    assert.approximately(+midnightApyFromPrice(0.9959551, 35.22044), 4.289815, 1e-4);
    // A price of 1 (no discount) is a 0% rate; degenerate inputs are safe.
    assert.strictEqual(midnightApyFromPrice(1, 30), '0');
    assert.strictEqual(midnightApyFromPrice(0, 30), '0');
    assert.strictEqual(midnightApyFromPrice(0.99, 0), '0');
  });

  it('computes time-to-maturity in days at a given timestamp', () => {
    // Fill #4 executed 2026-07-23T08:59:33Z = 1784797173 → 36.250313 days to maturity.
    assert.approximately(midnightTimeToMaturityDays(MATURITY, 1784797173), 36.250313, 1e-4);
  });

  it('matches the documented per-fill APY (units / seller_assets annualized)', () => {
    // Fill #4: seller_assets 1.5, units 1.506341, ttm 36.250313 days → 4.33898%.
    const price = new Dec('1.5').div('1.506341'); // seller_assets / units
    assert.approximately(+midnightApyFromPrice(price, 36.250313), 4.33898, 1e-3);
  });

  it('round-trips a rate through the price it implies', () => {
    // midnightPriceFromApy is the exact inverse of midnightApyFromPrice.
    assert.approximately(+midnightPriceFromApy(4.289815, 35.22044), 0.9959551, 1e-7);
    for (const [rate, ttm] of [[4.289815, 35.22044], [12.5, 21.96], [0.75, 180]] as const) {
      assert.approximately(+midnightApyFromPrice(midnightPriceFromApy(rate, ttm), ttm), rate, 1e-6);
    }
    // Degenerate inputs price at par rather than blowing up.
    assert.strictEqual(midnightPriceFromApy(0, 30), '1');
    assert.strictEqual(midnightPriceFromApy(5, 0), '1');
  });

  it('coerces slippage to what the API accepts (0.1–100, one decimal place)', () => {
    // The value the old absolute-rate conversion produced — rejected verbatim by the API.
    assert.strictEqual(midnightSlippageParam('4.15066671050631467'), '4.1'); // rounded down, never looser
    assert.strictEqual(midnightSlippageParam(0.5), '0.5');
    assert.strictEqual(midnightSlippageParam('0.50'), '0.5'); // trailing zeros count as a decimal place
    assert.strictEqual(midnightSlippageParam(0), '0.1'); // clamped up to the minimum
    assert.strictEqual(midnightSlippageParam(-3), '0.1');
    assert.strictEqual(midnightSlippageParam(250), '100'); // clamped down to the maximum
  });
});
