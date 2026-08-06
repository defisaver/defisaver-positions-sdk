import 'dotenv/config';
import Dec from 'decimal.js';

import * as sdk from '../src';

import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { MorphoMidnightMarketData, MorphoMidnightMarketInfo } from '../src/types';
import { getProvider } from './utils/getProvider';
import { getViemProvider } from '../src/services/viem';
import { MorphoMidnightViewContractViem } from '../src/contracts';
import {
  getMorphoMidnightBorrowQuote, getMorphoMidnightUserBorrowInfo, midnightApyFromPrice, midnightPriceFromApy,
  midnightSlippageParam, midnightTimeToMaturityDays,
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

// Rebuild the on-chain Market struct from the hardcoded config so we can recompute its id.
const marketToStruct = (market: MorphoMidnightMarketData, network: NetworkNumber) => ({
  chainId: BigInt(network),
  midnight: market.midnight as `0x${string}`,
  loanToken: market.loanToken as `0x${string}`,
  collateralParams: market.collaterals.map((c) => ({
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

  it('has marketIds that match MidnightView.toId(struct)', async () => {
    const client = getViemProvider(provider, network);
    const view = MorphoMidnightViewContractViem(client, network);
    for (const market of markets()) {
      const id = await view.read.toId([marketToStruct(market, network)]);
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
    // The estimate and the offers to fill against are unaffected by the cap.
    assert.strictEqual(quote.estBorrowRate, base.estBorrowRate);
    assert.strictEqual(quote.takeableOffers.length, base.takeableOffers.length);

    // A ceiling below the estimate leaves no headroom — the borrow would revert on-chain, by design.
    const tight = await getMorphoMidnightBorrowQuote(market.marketId, assetsRaw, 0.5, market.maturity, new Dec(base.estBorrowRate).div(2));
    assert.isTrue(new Dec(tight.maxUnits).lt(tight.newUnits), 'maxUnits < newUnits when the ceiling is under the market rate');
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

    const info = await getMorphoMidnightUserBorrowInfo(DOC_BORROWER, market.marketId, market.maturity, marketInfo.loanToken);
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
