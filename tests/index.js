const { assert } = require('chai');
const sdk = require('../umd');

describe('SDK', () => {
  it('Exports all protocols', () => {
    assert.containsAllKeys(sdk, [
      'aaveV3',
    ]);
  });
});
