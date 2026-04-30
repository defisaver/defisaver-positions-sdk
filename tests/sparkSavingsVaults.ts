import 'dotenv/config';
import * as sdk from '../src';
import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Spark Savings Vaults', () => {
  let provider: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
  });

  const fetchVaultData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const vaultData = await sdk.savings.sparkSavingsVaults.getSparkSavingsVaultData(_provider, network, sdk.savings.sparkSavingsVaults.sparkSavingsVaultsOptions.getSparkSavingsVault(sdk.SparkSavingsVaultType.SparkSavingsUSDC), ['0x21dC459fbA0B1Ea037Cd221D35b928Be1C26141a']);
    console.log(vaultData);
    return vaultData;
  };

  it('can fetch Spark USDC vault data on Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const vaultData = await fetchVaultData(network, provider);
  });
});