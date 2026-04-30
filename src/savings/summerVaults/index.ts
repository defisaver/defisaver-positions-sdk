import { Client } from 'viem';
import { assetAmountInEth } from '@defisaver/tokens';
import { getViemProvider } from '../../services/viem';
import { SavingsVaultData, SummerVault } from '../../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import * as summerVaultsOptions from './options';
import { getErc4626ContractViem } from '../../contracts';

export {
  summerVaultsOptions,
};

export const _getSummerVaultData = async (provider: Client, network: NetworkNumber, summerVault: SummerVault, accounts: EthAddress[]): Promise<SavingsVaultData> => {
  const vaultContract = getErc4626ContractViem(provider, summerVault.address);

  const shares: Record<EthAddress, bigint> = {};

  const [totalAssets, totalSupply] = await Promise.all([
    vaultContract.read.totalAssets(),
    vaultContract.read.totalSupply(),
    ...accounts.map(async (account) => {
      const share = await vaultContract.read.balanceOf([account]);
      shares[account.toLowerCase() as EthAddress] = share;
    }),
  ]);

  const poolSize = assetAmountInEth(totalAssets.toString(), summerVault.asset);

  const supplied: Record<EthAddress, string> = {};
  await Promise.all(accounts.map(async (account) => {
    const normalizedAccount = account.toLowerCase() as EthAddress;
    const share = shares[normalizedAccount] || BigInt(0);
    const assets = share === BigInt(0)
      ? BigInt(0)
      : await vaultContract.read.convertToAssets([share]);
    supplied[normalizedAccount] = assetAmountInEth(assets.toString(), summerVault.asset);
  }));

  return {
    poolSize,
    liquidity: poolSize,
    supplied,
    asset: summerVault.asset,
    optionType: summerVault.type,
  };
};

export async function getSummerVaultData(provider: EthereumProvider, network: NetworkNumber, summerVault: SummerVault, accounts: EthAddress[]): Promise<SavingsVaultData> {
  return _getSummerVaultData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, summerVault, accounts);
}
