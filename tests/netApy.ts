import * as sdk from '../src';

const { assert } = require('chai');

describe('calculateNetApyFromRates', () => {
  const { calculateNetApyFromRates } = sdk.staking;

  it('nets borrow interest against supply interest and incentives on the position equity', () => {
    const res = calculateNetApyFromRates({
      suppliedUsd: '1000',
      borrowedUsd: '500',
      supplyRate: '1',
      borrowRate: '4',
      incentives: [{ apy: '3', amountUsd: '1000' }],
    });
    // +10 supply, +30 incentive, -20 borrow interest on 500 of equity
    assert.closeTo(+res.incentiveUsd, 30, 1e-9);
    assert.closeTo(+res.totalInterestUsd, 20, 1e-9);
    assert.closeTo(+res.netApy, 4, 1e-9);
  });

  it('is negative when the only cash flow is the borrow cost', () => {
    const res = calculateNetApyFromRates({ suppliedUsd: '1000', borrowedUsd: '500', borrowRate: '4' });
    assert.closeTo(+res.totalInterestUsd, -20, 1e-9);
    assert.closeTo(+res.netApy, -4, 1e-9);
    assert.equal(res.incentiveUsd, '0');
  });

  it('returns 0 when there are no rates or no position', () => {
    assert.equal(calculateNetApyFromRates({ suppliedUsd: '1000', borrowedUsd: '500' }).netApy, '0');
    assert.equal(calculateNetApyFromRates({ suppliedUsd: '0', borrowedUsd: '0', borrowRate: '4' }).netApy, '0');
  });
});
