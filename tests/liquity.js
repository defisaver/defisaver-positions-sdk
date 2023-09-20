require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('Liquity', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });


  it('can fetch trove data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const troveData = await sdk.liquity.getLiquityTroveInfo(web3, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
    // console.log(troveData);
    assert.containsAllKeys(troveData, [
      'troveStatus', 'collateral', 'debtInAsset', 'TCRatio', 'recoveryMode', 'claimableCollateral', 'borrowingRateWithDecay',
      'assetPrice', 'totalETH', 'totalLUSD', 'minCollateralRatio', 'priceForRecovery',
    ]);
  });
});