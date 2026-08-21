import Dec from 'decimal.js';

import {
  getMorphoMidnightBorrowHeadroom,
  MIDNIGHT_MIN_HEALTH_RATIO,
  midnightPriceFromApy,
} from '../src/helpers/morphoMidnightHelpers';

const { assert } = require('chai');

// A USDC-denominated position on a 126-day market, borrowed a quarter of the way up its limit.
const TTM_DAYS = 126;
const position = {
  borrowLimitUsd: '100000',
  borrowedUsd: '20000',
  loanTokenPrice: '0.9998',
  loanTokenDecimals: 6,
};
const principalPerUnit = midnightPriceFromApy(6.1, TTM_DAYS);

describe('Morpho Midnight borrow headroom', () => {
  /**
   * The reason this helper exists. `leftToBorrow` is what the Borrow action's Max types into the input and
   * `leftToBorrowUsd` is what the position overview prints beside it — if those two ever stop being the
   * same number in two units, the user is told they can borrow something the Max will not let them borrow.
   * String equality, not `approximately`: the round-down to token decimals happens once, before the price
   * is applied, and a regression that reintroduces a second rounding shows up here and nowhere else.
   */
  it('values the max borrow at exactly what it prints as left to borrow', () => {
    const cases = [
      { label: 'deep book', availableAssets: undefined },
      { label: 'book is the binding cap', availableAssets: '1234.5678915' },
      { label: 'empty book', availableAssets: '0' },
      { label: 'awkward decimals', availableAssets: '999.9999999999999' },
    ];

    cases.forEach(({ label, availableAssets }) => {
      const { leftToBorrow, leftToBorrowUsd } = getMorphoMidnightBorrowHeadroom({ ...position, principalPerUnit, availableAssets });
      assert.strictEqual(
        leftToBorrowUsd,
        new Dec(leftToBorrow).mul(position.loanTokenPrice).toString(),
        `${label}: leftToBorrowUsd must be leftToBorrow priced, to the digit`,
      );
    });
  });

  it('quantises to the loan token and never past the book', () => {
    const cap = '1234.5678915';
    const { leftToBorrow } = getMorphoMidnightBorrowHeadroom({ ...position, principalPerUnit, availableAssets: cap });

    assert.isTrue(new Dec(leftToBorrow).lte(cap), 'must not offer more than the book can fill');
    assert.strictEqual(leftToBorrow, new Dec(cap).toDP(position.loanTokenDecimals, Dec.ROUND_DOWN).toString());
  });

  it('reserves the health-ratio margin and the order-book discount', () => {
    const { headroomUsd, leftToBorrowUsd } = getMorphoMidnightBorrowHeadroom({ ...position, principalPerUnit });

    // Face-value headroom is the margined limit less the debt, and is deliberately *not* discounted.
    assert.approximately(+headroomUsd, (100000 / MIDNIGHT_MIN_HEALTH_RATIO) - 20000, 1e-9);
    // What a borrow actually pays out is that, discounted — strictly less, and by the book's discount.
    assert.isTrue(new Dec(leftToBorrowUsd).lt(headroomUsd));
    assert.approximately(+leftToBorrowUsd, +headroomUsd * +principalPerUnit, 0.01);
  });

  it('reads 100% borrow power used at max borrow, not 97.56%', () => {
    const atLimit = { ...position, borrowedUsd: new Dec(100000).div(MIDNIGHT_MIN_HEALTH_RATIO).toString() };
    const { borrowPowerUsed, leftToBorrow } = getMorphoMidnightBorrowHeadroom({ ...atLimit, principalPerUnit });

    assert.approximately(+borrowPowerUsed, 100, 1e-9);
    assert.strictEqual(leftToBorrow, '0');
  });

  it('offers nothing when there is nothing to offer', () => {
    const nothing = [
      { label: 'matured', params: { isMatured: true } },
      { label: 'already past the limit', params: { borrowedUsd: '999999' } },
      { label: 'unpriced loan token', params: { loanTokenPrice: '0' } },
      { label: 'empty book', params: { availableAssets: '0' } },
    ];

    nothing.forEach(({ label, params }) => {
      const { leftToBorrow, leftToBorrowUsd } = getMorphoMidnightBorrowHeadroom({ ...position, principalPerUnit, ...params });
      assert.strictEqual(leftToBorrow, '0', `${label}: nothing borrowable`);
      assert.strictEqual(leftToBorrowUsd, '0', `${label}: nothing borrowable`);
    });
  });
});
