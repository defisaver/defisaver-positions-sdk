const { assert } = require('chai');
const sdk = require('../cjs');

describe('SDK', () => {
  it('Exports all protocols', () => {
    assert.containsAllKeys(sdk, [
      'aaveV3',
    ]);
  });
});
