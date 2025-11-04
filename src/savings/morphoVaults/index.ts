import { Client } from 'viem';
import { request as graphqlRequest } from 'graphql-request';
import { assetAmountInEth } from '@defisaver/tokens';
import * as morphoVaultsOptions from './options';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import { getViemProvider } from '../../services/viem';
import { getMorphoVaultContractViem } from '../../contracts';
import { MorphoVault } from '../../types';

export {
  morphoVaultsOptions,
};

const vaultDataQuery = (vaultAddress: EthAddress) => `query vaultByAddress {
vaultByAddress(chainId: 1, address: "${vaultAddress}") {
    id,
    dailyApy,
    dailyApys {
    apy, netApy
    },
    monthlyApys {
    apy, netApy
    },
    liquidity {
    underlying, usd,
    },
    asset {
    priceUsd
    }
}
}`;

const MORPHO_BLUE_API = 'https://blue-api.morpho.org/graphql';

export const _getMorphoVaultData = async (provider: Client, network: NetworkNumber, morphoVault: MorphoVault, account: EthAddress): Promise<any> => {
  const morphoVaultContract = getMorphoVaultContractViem(provider, morphoVault.address);

  const [totalAssets, shares, vaultData] = await Promise.all([
    morphoVaultContract.read.totalAssets(),
    morphoVaultContract.read.balanceOf([account]),
    graphqlRequest(MORPHO_BLUE_API, vaultDataQuery(morphoVault.address)),
  ]);

  const assets = await morphoVaultContract.read.convertToAssets([shares]);

  const poolSize = assetAmountInEth(totalAssets.toString(), morphoVault.asset);
  const supplied = assetAmountInEth(assets.toString(), morphoVault.asset);
  const liquidity = assetAmountInEth((vaultData as any).vaultByAddress.liquidity.underlying, morphoVault.asset);

  return {
    poolSize,
    supplied,
    liquidity,
  };
};

export async function getMorphoVaultData(provider: EthereumProvider, network: NetworkNumber, morphoVault: MorphoVault, account: EthAddress): Promise<any> {
  return _getMorphoVaultData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, morphoVault, account);
}