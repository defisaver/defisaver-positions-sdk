import { Client } from 'viem';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { SavingsVaultData, SparkSavingsVault } from '../../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import * as sparkSavingsVaultsOptions from './options';
import { getViemProvider } from '../../services/viem';
import { getErc20ContractViem, getSparkSavingsVaultContractViem } from '../../contracts';

export {
  sparkSavingsVaultsOptions,
};

export const _getSparkSavingsVaultData = async (provider: Client, network: NetworkNumber, sparkSavingsVault: SparkSavingsVault, accounts: EthAddress[]): Promise<SavingsVaultData> => {
  const sparkSavingsVaultContract = getSparkSavingsVaultContractViem(provider, sparkSavingsVault.address);
  const underlyingAssetContract = getErc20ContractViem(provider, getAssetInfo(sparkSavingsVault.asset, network).address as EthAddress);

  const shares: Record<EthAddress, bigint> = {};

  const [totalAssets, decimals, nowChi, RAY, liquidityWei] = await Promise.all([
    sparkSavingsVaultContract.read.totalAssets(),
    sparkSavingsVaultContract.read.decimals(),
    sparkSavingsVaultContract.read.nowChi(),
    sparkSavingsVaultContract.read.RAY(),
    underlyingAssetContract.read.balanceOf([sparkSavingsVault.address]),
    ...accounts.map(async (account) => {
      const share = await sparkSavingsVaultContract.read.balanceOf([account]);
      shares[account] = share;
    }),
  ]);

  const poolSize = assetAmountInEth(totalAssets.toString(), sparkSavingsVault.asset);
  const liquidity = assetAmountInEth(liquidityWei.toString(), sparkSavingsVault.asset);

  const supplied: Record<EthAddress, string> = {};
  accounts.forEach((account) => {
    const share = shares[account] || BigInt(0);
    supplied[account.toLowerCase() as EthAddress] = assetAmountInEth(
      new Dec(share).mul(nowChi).div(RAY).toFixed(0)
        .toString(), sparkSavingsVault.asset,
    );
  });

  return {
    poolSize,
    supplied,
    liquidity,
    asset: sparkSavingsVault.asset,
    optionType: sparkSavingsVault.type,
  };
};

export async function getSparkSavingsVaultData(provider: EthereumProvider, network: NetworkNumber, sparkSavingsVault: SparkSavingsVault, accounts: EthAddress[]): Promise<SavingsVaultData> {
  return _getSparkSavingsVaultData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, sparkSavingsVault, accounts);
}