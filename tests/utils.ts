const { assert } = require('chai');

const { isEnabledOnBitmap } = require('../src/services/utils');

describe('utils', () => {
  it('keeps low bits intact for large bitmap strings', () => {
    assert.isTrue(isEnabledOnBitmap('576460753377165576', 3));
    assert.isTrue(isEnabledOnBitmap('576460753377165576', 8));
    assert.isFalse(isEnabledOnBitmap('576460753377165576', 4));
  });

  it('works for small bitmap numbers too', () => {
    assert.isTrue(isEnabledOnBitmap(264, 3));
    assert.isTrue(isEnabledOnBitmap(264, 8));
    assert.isFalse(isEnabledOnBitmap(264, 2));
  });
});
