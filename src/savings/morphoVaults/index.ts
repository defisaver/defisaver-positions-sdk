import { Client } from 'viem';
import Dec from 'decimal.js';
import { request as graphqlRequest } from 'graphql-request';
import { assetAmountInEth } from '@defisaver/tokens';
import * as morphoVaultsOptions from './options';
import {
  EthAddress, EthereumProvider, NetworkNumber, MorphoVault, MorphoVaultType, MorphoVaultVersion, SavingsVaultData,
} from '../../types';
import { getViemProvider } from '../../services/viem';
import { getErc4626ContractViem, getMorphoVaultContractViem } from '../../contracts';
import { MORPHO_API_URL } from '../../constants';

export {
  morphoVaultsOptions,
};

// Morpho API caps list page size at 100 items
const MORPHO_API_PAGE_SIZE = 100;

const buildLiquidityQuery = (listField: 'vaults' | 'vaultV2s') => `
  query VaultsLiquidity($addresses: [String!], $chainIds: [Int!]) {
    ${listField}(first: ${MORPHO_API_PAGE_SIZE}, where: { address_in: $addresses, chainId_in: $chainIds }) {
      items {
        address
        liquidity${listField === 'vaults' ? ' {\n          underlying\n        }' : ''}
      }
    }
}`;

const liquidityQueries = {
  [MorphoVaultVersion.V1]: { field: 'vaults', query: buildLiquidityQuery('vaults') },
  [MorphoVaultVersion.V2]: { field: 'vaultV2s', query: buildLiquidityQuery('vaultV2s') },
} as const;

type LiquidityItem = { address: string, liquidity: { underlying: string | number | null } | string | number | null };

/**
 * Fetches liquidity for all given vaults, one API request per vault version (chunked if over the page cap),
 * returned as a map keyed by lowercased vault address. A vault missing from the API response is
 * absent from the map.
 */
export const fetchMorphoVaultsLiquidity = async (network: NetworkNumber, vaults: MorphoVault[]): Promise<Record<string, string>> => {
  const requests: { version: MorphoVaultVersion, chunk: MorphoVault[] }[] = [];
  [MorphoVaultVersion.V1, MorphoVaultVersion.V2].forEach((version) => {
    const versionVaults = vaults.filter((vault) => vault.version === version);
    for (let i = 0; i < versionVaults.length; i += MORPHO_API_PAGE_SIZE) requests.push({ version, chunk: versionVaults.slice(i, i + MORPHO_API_PAGE_SIZE) });
  });

  const liquidityByAddress: Record<string, string> = {};
  await Promise.all(requests.map(async ({ version, chunk }) => {
    const { field, query } = liquidityQueries[version];
    const data = await graphqlRequest(MORPHO_API_URL, query, {
      addresses: chunk.map((vault) => vault.address),
      chainIds: [network],
    // the BigInt scalar serializes as a JSON number when it fits in Number.MAX_SAFE_INTEGER, a string otherwise
    }) as Record<string, { items: LiquidityItem[] | null }>;

    (data[field].items || []).forEach((item) => {
      // V1 exposes liquidity as { underlying }, V2 as a plain BigInt scalar
      const underlying = item?.liquidity !== null && typeof item?.liquidity === 'object' ? item.liquidity.underlying : item?.liquidity;
      if (underlying !== undefined && underlying !== null) {
        liquidityByAddress[item.address.toLowerCase()] = String(underlying);
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

// Vault V2 is ERC-4626 but has no decimals offset, so shares are converted with convertToAssets
const getMorphoVaultV2ChainData = async (provider: Client, morphoVault: MorphoVault, accounts: EthAddress[]) => {
  const vaultContract = getErc4626ContractViem(provider, morphoVault.address);

  const [totalAssets, suppliedAssets] = await Promise.all([
    vaultContract.read.totalAssets(),
    Promise.all(accounts.map(async (account) => {
      const share = await vaultContract.read.balanceOf([account]);
      return share === BigInt(0) ? BigInt(0) : vaultContract.read.convertToAssets([share]);
    })),
  ]);

  return { totalAssets, suppliedAssets };
};

const getMorphoVaultV1ChainData = async (provider: Client, morphoVault: MorphoVault, accounts: EthAddress[]) => {
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

type MorphoVaultChainData = {
  v1?: Awaited<ReturnType<typeof getMorphoVaultV1ChainData>>,
  v2?: Awaited<ReturnType<typeof getMorphoVaultV2ChainData>>,
};

const getMorphoVaultChainData = async (provider: Client, morphoVault: MorphoVault, accounts: EthAddress[]): Promise<MorphoVaultChainData> => (
  morphoVault.version === MorphoVaultVersion.V2
    ? { v2: await getMorphoVaultV2ChainData(provider, morphoVault, accounts) }
    : { v1: await getMorphoVaultV1ChainData(provider, morphoVault, accounts) }
);

const formatMorphoVaultData = (
  morphoVault: MorphoVault,
  chainData: MorphoVaultChainData,
  liquidityUnderlying: string,
  accounts: EthAddress[],
): SavingsVaultData => {
  const liquidity = assetAmountInEth(liquidityUnderlying, morphoVault.asset);
  const supplied: Record<EthAddress, string> = {};

  if (chainData.v2) {
    const { totalAssets, suppliedAssets } = chainData.v2;
    accounts.forEach((account, i) => {
      supplied[account.toLowerCase() as EthAddress] = assetAmountInEth(suppliedAssets[i].toString(), morphoVault.asset);
    });
    return {
      poolSize: assetAmountInEth(totalAssets.toString(), morphoVault.asset),
      supplied,
      liquidity,
      asset: morphoVault.asset,
      optionType: morphoVault.type,
    };
  }

  const {
    totalAssets, totalSupply, decimals, decimalsOffset, shares,
  } = chainData.v1!;

  const poolSize = assetAmountInEth(totalAssets.toString(), morphoVault.asset);

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
