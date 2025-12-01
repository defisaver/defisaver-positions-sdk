import { Client } from 'viem';
import Dec from 'decimal.js';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import { SavingsVaultData } from '../../types';
import * as skySavingsOptions from './options';
import { DEFAULT_TIMEOUT } from '../../services/utils';
import { getViemProvider } from '../../services/viem';
import { SKY_SAVINGS_OPTION } from './options';
import { SkySavingsContractView } from '../../contracts';

export { skySavingsOptions };

const formatSkyProtocolData = (data: any) => ({
  skySavingsApy: new Dec(data.skyData[0].sky_savings_rate_apy).mul(100).toString(),
  savingsSuppliers: data.skyData[0].ssr_depositor_count,
  savingsTVL: data.skyData[0].sky_savings_rate_tvl,
});

const fetchSkyData = async (proxyAddress?: string) => {
  try {
    const res = await fetch(
      `https://fe.defisaver.com/api/sky/data?proxyAddress=${proxyAddress}`,
      { signal: AbortSignal.timeout(DEFAULT_TIMEOUT) },
    );
    return await res.json();
  } catch (err) {
    console.error('External API failure: Failed to fetch Sky data from external API', err);
  }
  return {};
};

export const _getSkyOptionData = async (
  provider: Client,
  network: NetworkNumber,
  accounts: EthAddress[],
): Promise<SavingsVaultData> => {
  const { data } = await fetchSkyData();
  const skyData = formatSkyProtocolData(data);
  const skySavingsContract = SkySavingsContractView(provider, network);

  const balances = await Promise.all(
    accounts.map((account) => skySavingsContract.read.balanceOf([account])),
  );

  const supplied: Record<EthAddress, string> = {};
  accounts.forEach((account, index) => {
    supplied[account] = balances[index].toString();
  });

  return {
    poolSize: skyData.savingsTVL,
    supplied,
    liquidity: skyData.savingsTVL,
    asset: SKY_SAVINGS_OPTION.asset,
    optionType: SKY_SAVINGS_OPTION.type,
  };
};

export async function getSkyOptionData(
  provider: EthereumProvider,
  network: NetworkNumber,
  accounts: EthAddress[],
): Promise<SavingsVaultData> {
  return _getSkyOptionData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, accounts);
}
