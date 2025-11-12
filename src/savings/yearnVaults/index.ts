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

export const _getYearnVaultData = async (provider: Client, network: NetworkNumber, yearnVault: YearnVault, account: EthAddress): Promise<SavingsVaultData> => {
  const yearnVaultContract = getYearnVaultContractViem(provider, yearnVault.address);
  const viewContract = YearnViewContractViem(provider, network);

  const [tokenSupply, underlyingSupply, yvAmountWei, poolLiquidity] = await Promise.all([
    yearnVaultContract.read.totalSupply(),
    yearnVaultContract.read.totalAssets(),
    yearnVaultContract.read.balanceOf([account]),
    viewContract.read.getPoolLiquidity([yearnVault.address]),
  ]);

  const exchangeRate = new Dec(underlyingSupply).div(tokenSupply).toString();
  const underlyingAmountWei = new Dec(yvAmountWei).mul(exchangeRate).toString();
  const supplied = assetAmountInEth(underlyingAmountWei, yearnVault.asset);
  const poolSize = assetAmountInEth(underlyingSupply.toString(), yearnVault.asset);
  const liquidity = assetAmountInEth(poolLiquidity.toString(), yearnVault.asset);

  return {
    poolSize,
    supplied,
    liquidity,
  };
};

export async function getYearnVaultData(provider: EthereumProvider, network: NetworkNumber, yearnVault: YearnVault, account: EthAddress): Promise<SavingsVaultData> {
  return _getYearnVaultData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, yearnVault, account);
}