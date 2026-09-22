import { Client } from 'viem';
import Dec from 'decimal.js';
import { request as graphqlRequest } from 'graphql-request';
import { assetAmountInEth } from '@defisaver/tokens';
import * as morphoVaultsOptions from './options';
import {
  EthAddress, EthereumProvider, NetworkNumber, MorphoVault, MorphoVaultType, SavingsVaultData,
} from '../../types';
import { getViemProvider } from '../../services/viem';
import { getMorphoVaultContractViem } from '../../contracts';

export {
  morphoVaultsOptions,
};

const MORPHO_BLUE_API = 'https://api.morpho.org/graphql';

// Morpho API caps list page size at 100 items
const MORPHO_API_PAGE_SIZE = 100;

const vaultsLiquidityQuery = `
  query VaultsLiquidity($addresses: [String!], $chainIds: [Int!]) {
    vaults(first: ${MORPHO_API_PAGE_SIZE}, where: { address_in: $addresses, chainId_in: $chainIds }) {
      items {
        address
        liquidity {
          underlying
        }
      }
    }
}`;

/**
 * Fetches liquidity for all given vaults in a single API request (chunked if over the page cap),
 * returned as a map keyed by lowercased vault address. A vault missing from the API response is
 * absent from the map.
 */
export const fetchMorphoVaultsLiquidity = async (network: NetworkNumber, vaults: MorphoVault[]): Promise<Record<string, string>> => {
  const chunks: MorphoVault[][] = [];
  for (let i = 0; i < vaults.length; i += MORPHO_API_PAGE_SIZE) chunks.push(vaults.slice(i, i + MORPHO_API_PAGE_SIZE));

  const liquidityByAddress: Record<string, string> = {};
  await Promise.all(chunks.map(async (chunk) => {
    const data = await graphqlRequest(MORPHO_BLUE_API, vaultsLiquidityQuery, {
      addresses: chunk.map((vault) => vault.address),
      chainIds: [network],
    // the BigInt scalar serializes as a JSON number when it fits in Number.MAX_SAFE_INTEGER, a string otherwise
    }) as { vaults: { items: { address: string, liquidity: { underlying: string | number | null } | null }[] | null } };

    (data.vaults.items || []).forEach((item) => {
      if (item?.liquidity?.underlying !== undefined && item.liquidity?.underlying !== null) {
        liquidityByAddress[item.address.toLowerCase()] = String(item.liquidity.underlying);
      }
    });
  }));
  return liquidityByAddress;
};

const getBatchedViemProvider = (provider: EthereumProvider, network: NetworkNumber) => getViemProvider(provider, network, {
  batch: {
    multicall: {
      batchSize: 250_000,
    },
  },
});

const getMorphoVaultChainData = async (provider: Client, morphoVault: MorphoVault, accounts: EthAddress[]) => {
  const morphoVaultContract = getMorphoVaultContractViem(provider, morphoVault.address);

  const shares: Record<EthAddress, bigint> = {};

  const [totalAssets, totalSupply, decimals, decimalsOffset] = await Promise.all([
    morphoVaultContract.read.totalAssets(),
    morphoVaultContract.read.totalSupply(),
    morphoVaultContract.read.decimals(),
    morphoVaultContract.read.DECIMALS_OFFSET(),
    ...accounts.map(async (account) => {
      const share = await morphoVaultContract.read.balanceOf([account]);
      shares[account] = share;
    }),
  ]);

  return {
    totalAssets, totalSupply, decimals, decimalsOffset, shares,
  };
};

const formatMorphoVaultData = (
  morphoVault: MorphoVault,
  chainData: Awaited<ReturnType<typeof getMorphoVaultChainData>>,
  liquidityUnderlying: string,
  accounts: EthAddress[],
): SavingsVaultData => {
  const {
    totalAssets, totalSupply, decimals, decimalsOffset, shares,
  } = chainData;

  const poolSize = assetAmountInEth(totalAssets.toString(), morphoVault.asset);
  const liquidity = assetAmountInEth(liquidityUnderlying, morphoVault.asset);

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

/**
 * Fetches data for all given vaults with a single Morpho API request for their liquidity,
 * instead of one request per vault. The on-chain reads run in parallel with the API request.
 * A vault whose on-chain reads fail or that is missing from the API response is left out of
 * the result; a failed API request rejects, leaving all vaults out.
 */
export const _getMorphoVaultsData = async (provider: Client, network: NetworkNumber, vaults: MorphoVault[], accounts: EthAddress[]): Promise<Partial<Record<MorphoVaultType, SavingsVaultData>>> => {
  const [liquidityByAddress, chainData] = await Promise.all([
    fetchMorphoVaultsLiquidity(network, vaults),
    Promise.all(vaults.map((vault) => getMorphoVaultChainData(provider, vault, accounts).catch((err) => {
      console.error(`[getMorphoVaultsData] Error fetching on-chain data for morpho vault ${vault.type}:`, err);
      return null;
    }))),
  ]);

  const savingsData: Partial<Record<MorphoVaultType, SavingsVaultData>> = {};
  vaults.forEach((vault, i) => {
    const vaultChainData = chainData[i];
    if (!vaultChainData) return;
    const liquidityUnderlying = liquidityByAddress[vault.address.toLowerCase()];
    if (liquidityUnderlying === undefined) {
      console.error(`[getMorphoVaultsData] Vault ${vault.type} (${vault.address}) missing from Morpho API response`);
      return;
    }
    savingsData[vault.type] = formatMorphoVaultData(vault, vaultChainData, liquidityUnderlying, accounts);
  });
  return savingsData;
};

export async function getMorphoVaultsData(provider: EthereumProvider, network: NetworkNumber, vaults: MorphoVault[], accounts: EthAddress[]): Promise<Partial<Record<MorphoVaultType, SavingsVaultData>>> {
  return _getMorphoVaultsData(getBatchedViemProvider(provider, network), network, vaults, accounts);
}

export async function getMorphoVaultData(provider: EthereumProvider, network: NetworkNumber, morphoVault: MorphoVault, accounts: EthAddress[]): Promise<SavingsVaultData> {
  const [liquidityByAddress, chainData] = await Promise.all([
    fetchMorphoVaultsLiquidity(network, [morphoVault]),
    getMorphoVaultChainData(getBatchedViemProvider(provider, network), morphoVault, accounts),
  ]);
  const liquidityUnderlying = liquidityByAddress[morphoVault.address.toLowerCase()];
  if (liquidityUnderlying === undefined) throw new Error(`Vault ${morphoVault.address} missing from Morpho API response`);
  return formatMorphoVaultData(morphoVault, chainData, liquidityUnderlying, accounts);
}
