import 'dotenv/config';

import * as sdk from '../src';

import { Blockish, EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Liquity', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchAccountBalances = async (network: NetworkNumber, _provider: EthereumProvider, blockNumber: Blockish) => {
    const balances = await sdk.liquity.getLiquityAccountBalances(_provider, network, blockNumber, false, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
    // console.log(balances);
    assert.containsAllKeys(balances, [
      'collateral', 'debt',
    ]);
  };


  it('can fetch trove data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const troveData = await sdk.liquity.getLiquityTroveInfo(provider, network, '0x9cCf93089cb14F94BAeB8822F8CeFfd91Bd71649');
    // console.log(troveData);
    assert.containsAllKeys(troveData, [
      'troveStatus', 'collateral', 'debtInAsset', 'TCRatio', 'recoveryMode', 'claimableCollateral', 'borrowingRateWithDecay',
      'assetPrice', 'totalETH', 'totalLUSD', 'minCollateralRatio', 'priceForRecovery',
    ]);
  });

  it('can fetch latest account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 'latest');
  });

  it('can fetch past account balances for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    await fetchAccountBalances(network, provider, 18000000);
  });
});