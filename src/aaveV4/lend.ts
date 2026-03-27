import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { AaveV4ViewContractViem } from '../contracts';
import { getViemProvider } from '../services/viem';
import { wethToEth } from '../services/utils';
import {
  EthAddress,
  EthereumProvider,
  NetworkNumber,
} from '../types/common';

export interface AaveV4TokenizationSpokeData {
  underlyingAsset: EthAddress;
  assetId: string;
  decimals: number;
  spoke: EthAddress;
  spokeActive: boolean;
  spokeHalted: boolean;
  spokeDepositCap: string;
  spokeTotalAssets: string;
  spokeTotalShares: string;
  hub: EthAddress;
  hubLiquidity: string;
  hubDrawnRate: string;
  convertToShares: string;
  convertToAssets: string;
  user: EthAddress;
  userSuppliedAssets: string;
  userSuppliedShares: string;
}

export const AAVE_V4_TOKENIZED_SPOKES: Record<string, EthAddress> = {
  AAVE_CORE: '0x0A65197b16C5969F92672051c9C9C0C75B369135',
  EURC_CORE: '0x6D9e2Cdd61CaF69af99b275704B6e272C41c6718',
  GHO_CORE: '0x58C14a5E061c9bC6926c5b853445290F296C2F7B',
  LBTC_CORE: '0x7961F140B570490849DB878AE222570ea838799d',
  LINK_CORE: '0xE69C2045095C8Ab3E2a7d77de2328faE5baF797c',
  RLUSD_CORE: '0xC8a125AE4275a78AADc53B46Ca10566Bc9B249E0',
  USDC_CORE: '0x531E90a2376902DE8915789Fcc1075e3B0c153E7',
  USDG_CORE: '0xAC2435E3C25e8246870D33ce0a26988A46d5DB68',
  USDT_CORE: '0x5eC44a70F309854fe04d495cFE1B5dA63DD1cc73',
  WBTC_CORE: '0x82A9CC4656784E55Ef2E78F704028B5E1Bfc1732',
  WETH_CORE: '0x7320CF22Ac095bA2a2e0a652F77efB836c2E751b',
  XAUt_CORE: '0x4E712562fcb5337011398B6C630f55b60641cd5e',
  cbBTC_CORE: '0x33B41B74366F55327d959FfF6D6b6fBc2853dbB1',
  frxUSD_CORE: '0x2226749630775ee20230Ad65214fB339087eF30D',
  rsETH_CORE: '0x45a04Ca1A5cbEeA4B44356c75EDd29b33eB2527a',
  weETH_CORE: '0x559cEc2C840D9DBB18936Afc5E5341D78bfC7Cbe',
  wstETH_CORE: '0xcb0E7dA9c635628f6d4827355AeCa75aB8d3560f',

  GHO_PLUS: '0xA54382db40EC602c0a173A08f9E86Ed40F9D4D10',
  PT_USDe_7MAY2026_PLUS: '0xdd2Eb78BF9e6aC5068B95aD2d451e8c9Af10ac81',
  PT_sUSDE_7MAY2026_PLUS: '0x90774889c22D2F2Adf44da1f04C7c95542590df4',
  USDC_PLUS: '0xc94bdd83D2c7655C280655D60954e79E88D4F949',
  USDT_PLUS: '0x80835EB50694EE0e519743f67e5401e6FD300006',
  USDe_PLUS: '0x502Cd81da6a8F1785eb2eEE72713B7388E16A854',
  sUSDe_PLUS: '0x24f8c062e1E0451736C1D6E023510DA262a41df4',

  GHO_PRIME: '0x900fD46d565d1ac8995928c0179052ec02a6D0E1',
  USDC_PRIME: '0x486415fb1F8b062c89ED548f871cf64304AACb31',
  USDT_PRIME: '0x46c588DD8453aC259c1f6a54b4C9A93C2aC3762D',
  WBTC_PRIME: '0x5AE3d87De89CA6Ce501e8317887F71EABED69E18',
  WETH_PRIME: '0x2087513383330B961A3753B47627Bbf149F31c70',
  cbBTC_PRIME: '0xD38098faf52D8E915EdED84fBF30F81C17906938',
  wstETH_PRIME: '0xFCD3D3C69cd032DE0cc78fE529B7447D2fe7F666',
};

export const AAVE_V4_TOKENIZED_SPOKE_ADDRESSES: Partial<Record<NetworkNumber, EthAddress[]>> = {
  [NetworkNumber.Eth]: Object.values(AAVE_V4_TOKENIZED_SPOKES),
};

export type AaveV4TokenizedHubKey = 'CORE' | 'PLUS' | 'PRIME';

export const aaveV4GetTokenizedHubKey = (hubNameOrKey?: string | null): AaveV4TokenizedHubKey | null => {
  if (!hubNameOrKey) return null;
  const normalized = hubNameOrKey.trim().toUpperCase();

  if (normalized === 'CORE' || normalized === 'CORE HUB') return 'CORE';
  if (normalized === 'PLUS' || normalized === 'PLUS HUB') return 'PLUS';
  if (normalized === 'PRIME' || normalized === 'PRIME HUB') return 'PRIME';

  if (normalized.includes('CORE')) return 'CORE';
  if (normalized.includes('PLUS')) return 'PLUS';
  if (normalized.includes('PRIME')) return 'PRIME';

  return null;
};

export const aaveV4GetTokenizedVaultKey = (
  symbol: string,
  hubNameOrKey?: string | null,
): string | null => {
  if (!symbol) return null;
  const hubKey = aaveV4GetTokenizedHubKey(hubNameOrKey);
  if (!hubKey) return null;

  const normalizedSymbol = symbol.trim().replace(/-/g, '_');

  return `${normalizedSymbol}_${hubKey}`;
};

export const aaveV4GetTokenizedVaultAddress = (
  network: NetworkNumber,
  symbol: string,
  hubNameOrKey?: string | null,
): EthAddress | undefined => {
  if (network !== NetworkNumber.Eth) return undefined;
  const key = aaveV4GetTokenizedVaultKey(symbol, hubNameOrKey);
  if (!key) return undefined;
  return AAVE_V4_TOKENIZED_SPOKES[key];
};

/** Parsed tokenization spoke data with human-readable supplied amounts for display */
export interface AaveV4TokenizationSpokeDataParsed {
  vaultAddress: EthAddress;
  key: string | null;
  symbol: string;
  hubKey: string;
  userSuppliedAssetsEth: string;
  userSuppliedSharesEth: string;
  userSuppliedAssets: string;
  userSuppliedShares: string;
  underlyingAsset: EthAddress;
  spoke: EthAddress;
  decimals: number;
}

const AAVE_V4_TOKENIZED_SPOKE_ADDRESS_TO_KEY: Record<string, string> = Object.entries(
  AAVE_V4_TOKENIZED_SPOKES,
).reduce((acc, [k, v]) => {
  acc[v.toLowerCase()] = k;
  return acc;
}, {} as Record<string, string>);

/**
 * Fetches tokenization vault data for the given user via getTokenizationSpokesData.
 * Returns parsed data including userSuppliedAssets in human-readable form for each vault.
 */
export async function getAaveV4TokenizationSpokesData(
  provider: EthereumProvider,
  network: NetworkNumber,
  userAddress: EthAddress,
): Promise<AaveV4TokenizationSpokeDataParsed[]> {
  const spokes = AAVE_V4_TOKENIZED_SPOKE_ADDRESSES[network] ?? [];
  if (spokes.length === 0) return [];

  const client = getViemProvider(provider, network);
  const viewContract = AaveV4ViewContractViem(client, network);
  const raw = await viewContract.read.getTokenizationSpokesData([spokes, userAddress]);

  return raw.map((r: any, i: number) => {
    const vaultAddress = spokes[i];
    const key = AAVE_V4_TOKENIZED_SPOKE_ADDRESS_TO_KEY[vaultAddress.toLowerCase()] ?? null;
    const symbol = wethToEth(getAssetInfoByAddress(r.underlyingAsset, network).symbol);
    if (symbol === '?') { // unsupported asset
      return null;
    }
    const hubKey = key ? key.split('_').pop() ?? '' : '';
    const decimals = Number(r.decimals ?? 18);
    const userSuppliedAssetsRaw = r.userSuppliedAssets ?? 0;
    const userSuppliedSharesRaw = r.userSuppliedShares ?? 0;

    const userSuppliedAssetsEth = assetAmountInEth(userSuppliedAssetsRaw.toString(), symbol);
    const userSuppliedSharesEth = assetAmountInEth(userSuppliedSharesRaw.toString(), symbol);
    return {
      vaultAddress,
      key,
      symbol,
      hubKey,
      userSuppliedAssetsEth,
      userSuppliedSharesEth,
      userSuppliedAssets: userSuppliedAssetsRaw.toString(),
      userSuppliedShares: userSuppliedSharesRaw.toString(),
      underlyingAsset: r.underlyingAsset,
      spoke: r.spoke,
      decimals,
    };
  }).filter(item => item != null);
}


