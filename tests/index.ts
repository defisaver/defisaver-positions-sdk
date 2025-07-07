const { assert } = require('chai');
const sdk = require('../src');

describe('SDK', () => {
  it('Exports all protocols', () => {
    assert.containsAllKeys(sdk, [
      'aaveV2',
      'aaveV3',
      'compoundV2',
      'compoundV3',
      'spark',
      'curveUsd',
      'liquity',
      'maker',
    ]);
  });
});
