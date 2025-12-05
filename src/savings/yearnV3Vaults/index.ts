import { Client } from 'viem';
import Dec from 'decimal.js';
import { assetAmountInEth } from '@defisaver/tokens';
import { getViemProvider } from '../../services/viem';
import { SavingsVaultData, YearnV3Vault } from '../../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import * as yearnV3VaultsOptions from './options';
import { getYearnV3VaultContractViem } from '../../contracts';

export {
  yearnV3VaultsOptions,
};

export const _getYearnV3VaultData = async (provider: Client, network: NetworkNumber, yearnV3Vault: YearnV3Vault, accounts: EthAddress[]): Promise<SavingsVaultData> => {
  const yearnV3VaultContract = getYearnV3VaultContractViem(provider, yearnV3Vault.address);

  const shares: Record<EthAddress, bigint> = {};

  const [totalAssets, totalSupply, totalDebt] = await Promise.all([
    yearnV3VaultContract.read.totalAssets(),
    yearnV3VaultContract.read.totalSupply(),
    yearnV3VaultContract.read.totalDebt(),
    ...accounts.map(async (account) => {
      const share = await yearnV3VaultContract.read.balanceOf([account]);
      shares[account] = share;
    }),
  ]);

  const poolSize = assetAmountInEth(totalAssets.toString(), yearnV3Vault.asset);
  const debt = assetAmountInEth(totalDebt.toString(), yearnV3Vault.asset);
  // DEV: Check if true
  const liquidity = poolSize;

  const supplied: Record<EthAddress, string> = {};
  accounts.forEach((account) => {
    const share = shares[account] || BigInt(0);
    supplied[account.toLowerCase() as EthAddress] = assetAmountInEth(
      new Dec(share).mul(totalAssets).div(totalSupply).toFixed()
        .toString(),
      yearnV3Vault.asset,
    );
  });

  return {
    poolSize,
    supplied,
    liquidity,
    asset: yearnV3Vault.asset,
    optionType: yearnV3Vault.type,
  };
};

export async function getYearnV3VaultData(provider: EthereumProvider, network: NetworkNumber, yearnV3Vault: YearnV3Vault, accounts: EthAddress[]): Promise<SavingsVaultData> {
  return _getYearnV3VaultData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, yearnV3Vault, accounts);
}
