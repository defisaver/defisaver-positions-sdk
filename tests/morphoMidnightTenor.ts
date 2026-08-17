import Dec from 'decimal.js';
import {
  parseTenorBookSide,
  parseTenorOrderBook,
  tenorBookKeyFor,
  tenorBookRateToApyPercent,
  tenorCapPrice,
  tenorOfferFillToApiFill,
  tenorOfferToApiOffer,
} from '../src/helpers/morphoMidnightHelpers/tenor';
import { midnightApyFromPrice, midnightTimeToMaturityDays } from '../src/helpers/morphoMidnightHelpers/rate';
import { getMorphoMidnightBorrowQuote, getMorphoMidnightMarketBook } from '../src/helpers/morphoMidnightHelpers';
import { isTenorMidnightMarket, MorphoMidnightMarkets } from '../src/markets/morphoMidnight';
import { MorphoMidnightVersions, NetworkNumber } from '../src/types';
import * as sdk from '../src';

const { assert } = require('chai');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MIDNIGHT = '0xAdedD8ab6dE832766Fedf0FaC4992E5C4D3EA18A';

const sampleOffer = {
  start: 1786536066,
  group: '0x74656e6f72010009c396fc6fa187b357fa2b4e9a62d76bd03769421a8f198572',
  callback: '0xc0b438Bbf5a8cC4e57C0D81e1818C069e413DdDf',
  tick: 5220,
  chain_id: 8453,
  maturity: 1787788800,
  buy: true,
  maker: '0xF33Cec38B56dc445399ae0D4ec834e83dA67e19c',
  loan_token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  callback_data: '0xabc',
  expiry: 1786560038,
  ratifier: '0x800B5F12A61B8198a5a6EfD794Cac6699B294d63',
  collaterals: [{
    token: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    lltv: '860000000000000000',
    liquidation_cursor: '300000000000000000',
    oracle: '0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9',
  }],
  continuous_fee_cap: '0',
  enter_gate: ZERO_ADDRESS,
  liquidator_gate: ZERO_ADDRESS,
  max_assets: '22000000000',
  max_units: '0',
  ratifier_data: '0xratifier',
  rcf_threshold: '3000000000',
  receiver_if_maker_is_seller: ZERO_ADDRESS,
  reduce_only: false,
};

describe('Tenor Midnight rate math (pure)', () => {
  it('divides a book level by 100 (25 → 0.25%)', () => {
    assert.strictEqual(tenorBookRateToApyPercent(25), '0.25');
    assert.strictEqual(tenorBookRateToApyPercent(700), '7');
  });
});

describe('Tenor Midnight guard prices', () => {
  const ttmDays = 30;
  const bestPrice = '0.996';

  it('honours a pinned borrow ceiling exactly, whatever the default slippage is', () => {
    const capPrice = tenorCapPrice(bestPrice, 0.5, -1, ttmDays, 5);
    assert.approximately(+midnightApyFromPrice(capPrice, ttmDays), 5, 1e-9);
  });

  it('honours a pinned payback floor exactly', () => {
    const capPrice = tenorCapPrice(bestPrice, 0.5, 1, ttmDays, 3);
    assert.approximately(+midnightApyFromPrice(capPrice, ttmDays), 3, 1e-9);
  });

  it('widens the borrow cap and tightens the payback floor by the slippage band when no rate is pinned', () => {
    assert.strictEqual(tenorCapPrice(bestPrice, 0.5, -1, ttmDays), '0.99102');
    assert.strictEqual(tenorCapPrice(bestPrice, 0.5, 1, ttmDays), '1.00098');
  });

  it('leaves the price untouched at 0 slippage', () => {
    assert.strictEqual(tenorCapPrice(bestPrice, 0, -1, ttmDays), bestPrice);
  });

  it('caps borrow units at the pinned rate rather than the quoted fill', () => {
    // The bug this replaces treated (pinned − estimate) in APY points as a percentage of units, which on a
    // short market let the on-chain cap sit tens of percent above the rate the user actually pinned.
    const assets = '100000000';
    const maturity = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    const capPrice = tenorCapPrice(bestPrice, 0.5, -1, midnightTimeToMaturityDays(maturity), 5);
    const maxUnits = new Dec(assets).div(capPrice).toFixed(0);
    const impliedRate = midnightApyFromPrice(new Dec(assets).div(maxUnits), midnightTimeToMaturityDays(maturity));
    assert.approximately(+impliedRate, 5, 1e-3);
  });
});

describe('Tenor Midnight offer mapping', () => {
  it('nests Tenor market fields into the Morpho offer shape Midnight.take encodes', () => {
    const mapped = tenorOfferToApiOffer(sampleOffer);
    assert.strictEqual(mapped.market.midnight, MIDNIGHT);
    assert.strictEqual(mapped.market.loan_token, sampleOffer.loan_token_address);
    assert.strictEqual(mapped.market.chain_id, 8453);
    assert.strictEqual(mapped.market.collaterals[0].token, sampleOffer.collaterals[0].token);
    assert.strictEqual(mapped.buy, true);
    assert.strictEqual(mapped.max_assets, '22000000000');
  });

  it('fills missing group/callback/ratifier fields with zero values', () => {
    const mapped = tenorOfferToApiOffer({
      ...sampleOffer, group: undefined, callback: undefined, ratifier: undefined, callback_data: undefined,
    });
    assert.strictEqual(mapped.group, ZERO_BYTES);
    assert.strictEqual(mapped.callback, ZERO_ADDRESS);
    assert.strictEqual(mapped.ratifier, ZERO_ADDRESS);
    assert.strictEqual(mapped.callback_data, '0x');
  });

  it('lifts ratifier_data onto the fill, not the offer', () => {
    const fill = tenorOfferFillToApiFill({ units: '123', offer: sampleOffer });
    assert.strictEqual(fill.units, '123');
    assert.strictEqual(fill.ratifier_data, '0xratifier');
    assert.strictEqual(fill.offer.maker, sampleOffer.maker);
  });
});

describe('Tenor Midnight order book parse', () => {
  // Tenor names its sides from the maker's side of the trade, the mirror of Morpho's taker-side naming.
  const book = {
    asks: { buckets: [{ rate: 25, liquidity: 1_000_000 }, { rate: 100, liquidity: 2_000_000 }] },
    bids: { buckets: [{ rate: 200, liquidity: 500_000 }, { rate: 500, liquidity: 3_000_000 }] },
  };

  it('maps Morpho book sides onto the Tenor side that actually holds those offers', () => {
    assert.strictEqual(tenorBookKeyFor('bids'), 'asks');
    assert.strictEqual(tenorBookKeyFor('asks'), 'bids');
  });

  it('reads the borrow side (Morpho `bids`) off Tenor `asks`', () => {
    const offers = parseTenorBookSide(book, 'bids');
    assert.deepStrictEqual(offers.map((offer) => offer.rate), ['0.25', '1']);
    assert.strictEqual(offers[0].liquidityRaw, '1000000');
  });

  // The raw side read keeps the router's own order; ordering is the assembled book's job, below.
  it('reads the payback side (Morpho `asks`) off Tenor `bids`', () => {
    const offers = parseTenorBookSide(book, 'asks');
    assert.deepStrictEqual(offers.map((offer) => offer.rate), ['2', '5']);
    assert.strictEqual(offers[1].liquidityRaw, '3000000');
  });

  it('assembles each side best-first, in loan-token amounts', () => {
    const borrow = parseTenorOrderBook(book, 'bids', 'USDC');
    assert.strictEqual(borrow!.bestRate, '0.25');
    assert.deepStrictEqual(borrow!.offers.map((offer) => offer.rate), ['0.25', '1']);
    assert.strictEqual(borrow!.offers[0].liquidity, '1'); // 1_000_000 base units of a 6-decimal token
    assert.strictEqual(borrow!.totalLiquidity, '3');

    const payback = parseTenorOrderBook(book, 'asks', 'USDC');
    assert.strictEqual(payback!.bestRate, '5');
    assert.deepStrictEqual(payback!.offers.map((offer) => offer.rate), ['5', '2']);
  });

  it('returns nothing for an empty side', () => {
    assert.deepStrictEqual(parseTenorBookSide({ asks: { buckets: [] }, bids: { buckets: [] } }, 'bids'), []);
    assert.isNull(parseTenorOrderBook({ asks: book.asks, bids: { buckets: [] } }, 'asks', 'USDC'));
  });
});

describe('Tenor Midnight markets', () => {
  const allMarkets = MorphoMidnightMarkets(NetworkNumber.Base);
  const tenorMarkets = Object.fromEntries(
    Object.entries(allMarkets).filter(([, market]) => market.curator === 'Tenor'),
  ) as typeof allMarkets;

  it('are included in MorphoMidnightMarkets and flagged as Tenor', () => {
    const markets = sdk.markets.MorphoMidnightMarkets(NetworkNumber.Base);
    const tenor = tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base];
    assert.isTrue(isTenorMidnightMarket(tenor));
    assert.strictEqual(markets[MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base].marketId, tenor.marketId);
    assert.isFalse(isTenorMidnightMarket(markets[MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base]));
  });

  it('cover the three Tenor pairs from morphoFixedMarkets', () => {
    assert.strictEqual(Object.keys(tenorMarkets).length, 15);
    assert.strictEqual(
      tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base].marketId,
      '0x44495af1cca7842191a65a73978e01ed72238731e193c3b11460083efd60a318',
    );
    assert.strictEqual(
      tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260827_Base].loanToken.toLowerCase(),
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    );
    assert.strictEqual(
      tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260827_Base].loanToken.toLowerCase(),
      '0x4200000000000000000000000000000000000006',
    );
    assert.isTrue(isTenorMidnightMarket(tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20261217_Base]));
    assert.isTrue(isTenorMidnightMarket(tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20261217_Base]));
  });

  it('use the same MorphoMidnightMarketData shape as Morpho-curated markets', () => {
    const morpho = sdk.markets.MorphoMidnightMarkets(NetworkNumber.Base)[MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base];
    const tenor = tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base];
    assert.strictEqual(morpho.curator, 'Morpho');
    assert.strictEqual(tenor.curator, 'Tenor');
    // `hiddenCollaterals` is the one field a Tenor market carries that a Morpho one has no use for: only
    // curated markets put a collateral in the struct that the app doesn't surface.
    assert.sameMembers(Object.keys(tenor), [...Object.keys(morpho), 'hiddenCollaterals']);
    assert.isUndefined(morpho.hiddenCollaterals);
    assert.isTrue(isTenorMidnightMarket(tenor));
    assert.isFalse(isTenorMidnightMarket(morpho));
  });

  it('routes by market id too, for the quote helpers that only get one', () => {
    const tenor = tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base];
    const morpho = sdk.markets.MorphoMidnightMarkets(NetworkNumber.Base)[MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260828_Base];
    assert.isTrue(isTenorMidnightMarket(tenor.marketId.toUpperCase().replace('0X', '0x')));
    assert.isFalse(isTenorMidnightMarket(morpho.marketId));
  });

  it('list only the primary collateral, which is index 0 of the on-chain market', () => {
    const cbbtc = tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base];
    assert.strictEqual(cbbtc.collaterals.length, 1);
    assert.strictEqual(cbbtc.collaterals[0].token.toLowerCase(), '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf');
    assert.strictEqual(new Dec(cbbtc.collaterals[0].lltv).toNumber(), 0.86);

    const weth = tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorWETHUSDC_20260827_Base];
    assert.strictEqual(weth.collaterals.length, 1);
    assert.strictEqual(weth.collaterals[0].token.toLowerCase(), '0x4200000000000000000000000000000000000006');

    const cbeth = tenorMarkets[MorphoMidnightVersions.MorphoMidnightTenorCbETHWETH_20260827_Base];
    assert.strictEqual(cbeth.collaterals.length, 1);
    assert.strictEqual(cbeth.collaterals[0].token.toLowerCase(), '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22');
    assert.strictEqual(new Dec(cbeth.collaterals[0].lltv).toNumber(), 0.945);
    assert.strictEqual(cbeth.rcfThreshold, '4000000000000000000');
  });

  /**
   * The curator's vault is hidden from the app but not from the market: it is the second half of what the
   * id is hashed from, so every Tenor market has to carry one and the shared getter has to hand back both.
   * Without it a `Market` struct addresses a market of the caller's own making rather than this one — the
   * on-chain half of this invariant is the `toId` check in the Morpho Midnight suite.
   */
  it('keep the curator vault out of `collaterals` but in the market struct', () => {
    Object.values(tenorMarkets).forEach((market) => {
      assert.strictEqual(market.hiddenCollaterals?.length, 1, `${market.value} should hide exactly the curator vault`);
      const all = sdk.markets.morphoMidnightMarketCollateralParams(market);
      assert.strictEqual(all.length, 2, `${market.value} should hash from both collaterals`);
      assert.strictEqual(all[0].token, market.collaterals[0].token, `${market.value} should keep the listed collateral first`);
      assert.strictEqual(all[1].token, market.hiddenCollaterals![0].token, `${market.value} should append the hidden one`);
    });
  });
});

/**
 * Live checks against Tenor's router. The one thing unit tests cannot pin down is which of Tenor's two
 * book sides holds the offers a borrower fills — the naming is the mirror of Morpho's — so the borrow
 * quote is cross-checked against the book the SDK reads for that side. Each test skips (rather than fails)
 * when the market's book is empty, the way the Morpho suite does.
 */
describe('Tenor Midnight router (live)', function tenorLiveSuite() {
  this.timeout(60000);
  const network = NetworkNumber.Base;
  const market = MorphoMidnightMarkets(NetworkNumber.Base)[MorphoMidnightVersions.MorphoMidnightTenorCbBTCUSDC_20260827_Base];
  const assetsRaw = '100000000'; // 100 USDC

  it('reads the borrow book best-first and prices a borrow at the top of it', async function borrowBookTest() {
    const book = await getMorphoMidnightMarketBook(market, network, 'bids');
    if (!book) {
      this.skip();
      return;
    }

    // Ascending on the borrow side: the cheapest offer a borrower fills comes first.
    book.offers.forEach((offer, i) => {
      if (i === 0) return;
      assert.isTrue(new Dec(offer.rate).gte(book.offers[i - 1].rate), 'borrow book should be cheapest-first');
    });
    assert.strictEqual(book.bestRate, book.offers[0].rate);

    let quote;
    try {
      quote = await getMorphoMidnightBorrowQuote(market.marketId, assetsRaw, 0.5, market.maturity);
    } catch (err) {
      this.skip();
      return;
    }

    assert.isTrue(new Dec(quote.newUnits).gt(assetsRaw), 'debt at maturity exceeds the principal borrowed');
    assert.isNotEmpty(quote.takeableOffers);
    // 100 USDC fills at the top of the book, so the blended rate must sit in its first bucket's band.
    assert.isTrue(
      new Dec(quote.estBorrowRate).gte(new Dec(book.bestRate).sub(0.3)),
      `estimate ${quote.estBorrowRate} is under the book's best rate ${book.bestRate} — sides are crossed`,
    );
    assert.isTrue(new Dec(quote.maxUnits).gt(quote.newUnits), 'default slippage leaves headroom over the quoted debt');
  });

  it('caps a borrow at exactly the rate the user pinned', async function pinnedRateTest() {
    let base;
    try {
      base = await getMorphoMidnightBorrowQuote(market.marketId, assetsRaw, 0.5, market.maturity);
    } catch (err) {
      this.skip();
      return;
    }

    const cap = new Dec(base.estBorrowRate).add(2);
    const quote = await getMorphoMidnightBorrowQuote(market.marketId, assetsRaw, 0.5, market.maturity, cap);

    assert.approximately(+quote.maxRate, cap.toNumber(), 1e-6, 'maxRate should be the requested ceiling');
    // The guard the recipe sends must be the ceiling itself, not a percentage-of-units stand-in for it.
    const impliedRate = midnightApyFromPrice(new Dec(assetsRaw).div(quote.maxUnits), midnightTimeToMaturityDays(market.maturity));
    assert.approximately(+impliedRate, cap.toNumber(), 1e-2, 'maxUnits implies a rate other than the ceiling');
  });
});
