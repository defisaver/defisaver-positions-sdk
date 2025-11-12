import Dec from 'decimal.js';
import { Client } from 'viem';
import { assetAmountInEth } from '@defisaver/tokens';
import { getViemProvider } from '../../services/viem';
import { SavingsVaultData, YearnVault } from '../../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import * as yearnVaultsOptions from './options';
import { getYearnVaultContractViem, YearnViewContractViem } from '../../contracts';

export {
  yearnVaultsOptions,
};

export const _getYearnVaultData = async (provider: Client, network: NetworkNumber, yearnVault: YearnVault, accounts: EthAddress[]): Promise<SavingsVaultData> => {
  const yearnVaultContract = getYearnVaultContractViem(provider, yearnVault.address);
  const viewContract = YearnViewContractViem(provider, network);

  const yvAmountsWei: Record<EthAddress, bigint> = {};

  const [tokenSupply, underlyingSupply, poolLiquidity] = await Promise.all([
    yearnVaultContract.read.totalSupply(),
    yearnVaultContract.read.totalAssets(),
    viewContract.read.getPoolLiquidity([yearnVault.address]),
    ...accounts.map(async (account) => {
      const yvAmount = await yearnVaultContract.read.balanceOf([account]);
      yvAmountsWei[account] = yvAmount;
    }),
  ]);

  const exchangeRate = new Dec(underlyingSupply).div(tokenSupply).toString();
  const poolSize = assetAmountInEth(underlyingSupply.toString(), yearnVault.asset);
  const liquidity = assetAmountInEth(poolLiquidity.toString(), yearnVault.asset);

  const supplied: Record<EthAddress, string> = {};
  accounts.forEach((account) => {
    const yvAmountWei = yvAmountsWei[account] || BigInt(0);
    const underlyingAmountWei = new Dec(yvAmountWei).mul(exchangeRate).toString();
    supplied[account.toLowerCase() as EthAddress] = assetAmountInEth(underlyingAmountWei, yearnVault.asset);
  });

  return {
    poolSize,
    liquidity,
    supplied,
  };
};

export async function getYearnVaultData(provider: EthereumProvider, network: NetworkNumber, yearnVault: YearnVault, accounts: EthAddress[]): Promise<SavingsVaultData> {
  return _getYearnVaultData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, yearnVault, accounts);
}