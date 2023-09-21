const { assert } = require('chai');
const sdk = require('../cjs');

describe('SDK', () => {
  it('Exports all protocols', () => {
    assert.containsAllKeys(sdk, [
      'aaveV2',
      'aaveV3',
      'morphoAaveV2',
      'morphoAaveV3',
      'compoundV2',
      'compoundV3',
      'spark',
      'curveUsd',
      'liquity',
      'maker',
    ]);
  });
});
