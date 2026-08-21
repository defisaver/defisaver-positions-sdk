import { Client } from 'viem';
import Dec from 'decimal.js';
import { assetAmountInEth } from '@defisaver/tokens';
import * as morphoVaultsOptions from './options';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import { LONGER_TIMEOUT } from '../../services/utils';
import { getViemProvider } from '../../services/viem';
import { getMorphoVaultContractViem } from '../../contracts';
import { MorphoVault, SavingsVaultData } from '../../types';

export {
  morphoVaultsOptions,
};

const vaultDataQuery = `
  query VaultByAddress($address: String!, $chainId: Int!) {
    vaultByAddress(address: $address, chainId: $chainId) {
      address
      state {
        totalAssets
        totalAssetsUsd
        totalSupply
      }
      liquidity {
        underlying
        usd
      }
    }
}`;

const MORPHO_BLUE_API = 'https://api.morpho.org/graphql';

const fetchVaultData = async (address: EthAddress, chainId: NetworkNumber) => {
  const res = await fetch(MORPHO_BLUE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: vaultDataQuery,
      variables: { address, chainId },
    }),
    signal: AbortSignal.timeout(LONGER_TIMEOUT),
  });
  if (!res.ok) throw new Error(`Morpho vault request failed: ${res.status}`);
  const body = await res.json();
  if (!body?.data) throw new Error('Morpho vault response missing data');
  return body.data;
};

export const _getMorphoVaultData = async (provider: Client, network: NetworkNumber, morphoVault: MorphoVault, accounts: EthAddress[]): Promise<SavingsVaultData> => {
  const morphoVaultContract = getMorphoVaultContractViem(provider, morphoVault.address);

  const shares: Record<EthAddress, bigint> = {};

  const [totalAssets, totalSupply, decimals, decimalsOffset, vaultData] = await Promise.all([
    morphoVaultContract.read.totalAssets(),
    morphoVaultContract.read.totalSupply(),
    morphoVaultContract.read.decimals(),
    morphoVaultContract.read.DECIMALS_OFFSET(),
    fetchVaultData(morphoVault.address, network),
    ...accounts.map(async (account) => {
      const share = await morphoVaultContract.read.balanceOf([account]);
      shares[account] = share;
    }),
  ]);

  const poolSize = assetAmountInEth(totalAssets.toString(), morphoVault.asset);
  const liquidity = assetAmountInEth((vaultData as any).vaultByAddress.liquidity.underlying, morphoVault.asset);

  const supplied: Record<EthAddress, string> = {};
  accounts.forEach((account) => {
    const share = shares[account] || BigInt(0);
    supplied[account.toLowerCase() as EthAddress] = new Dec(new Dec(share.toString()).mul(new Dec(totalAssets.toString()).add(1)).div(new Dec(totalSupply.toString()).add(10 ** decimalsOffset)).div(10 ** 18)
      .toFixed(decimals)).mul(10 ** decimalsOffset)
      .toString();
  });

  return {
    poolSize,
    supplied,
    liquidity,
    asset: morphoVault.asset,
    optionType: morphoVault.type,
  };
};

export async function getMorphoVaultData(provider: EthereumProvider, network: NetworkNumber, morphoVault: MorphoVault, accounts: EthAddress[]): Promise<SavingsVaultData> {
  return _getMorphoVaultData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, morphoVault, accounts);
}