require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../src');
const { NetworkNumber } = require('../src/types/common');

describe('Liquity', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });

  const fetchAccountBalances = async (network, web3, blockNumber) => {
    const balances = await sdk.liquity.getLiquityAccountBalances(web3, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };


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

  it('can fetch latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 'latest');
  });

  it('can fetch past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, web3, 18000000);
  });
});