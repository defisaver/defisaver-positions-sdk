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
  AAVE_CORE: '0x08309234884cF7E015b07Bf22569017Aa035cdeF',
  EURC_CORE: '0x73596dED4B2Eb0aC85e477b3c8dB56FC427E6774',
  GHO_CORE: '0xf7E1f1b43922527e5054bD77E7f863Cf182b194D',
  GHO_PRIME: '0xeF1cAd5c6a2C9cb83c952b4B96bbD35b3F61F18f',
  LBTC_CORE: '0x8f4D423590F22833131e3493bf67A27213398f8e',
  LINK_CORE: '0xBE1197750b423e30137E97d9183065d33E903BE6',
  PT_USDe_PLUS: '0x8cA27Ab284F2aA2BcF33D9129e11c101aD2d16de',
  PT_sUSDe_PLUS: '0xb8A464EC56071a98c854f30fE19CfeCc41FA6233',
  PYUSD_CORE: '0x203FB463087005698d50768FcA837047f738632d',
  RLUSD_CORE: '0xa9afdd0c54fb153CaE39cE86E49626B5e9d15513',
  USDC_CORE: '0xa2e476f4cbB06C7bFA8Ad51bCcbF198cd32CfD35',
  USDC_PLUS: '0x320Bec4fB7a25e64c003A007D0AeF7AB3D6C30d7',
  USDC_PRIME: '0x0A0507F7A1129892b5cf74b8B4e911442c466b87',
  USDG_CORE: '0x87c224256f09a014C1BC3e9FbB094C3AdD8fBaCC',
  USDT_CORE: '0x3f12BD5999b9172550893FF52691c980676f9E73',
  USDT_PLUS: '0xa4E74a78bED2d3ab8971e8AB26fb39f26DD8eEd9',
  USDT_PRIME: '0xF565fB55bc96d65561887898bfeb25C1dE7e06d2',
  USDe_PLUS: '0xA0d346ab2699B689AC67aba5174164A84206BB73',
  WBTC_CORE: '0x837Ab872A665e0CF467d41cF56a054031b4A38bc',
  WBTC_PRIME: '0xeae98b8a1798738182B2123DF1eB93d97BD29F34',
  WETH_CORE: '0x3961a75099E986F59a1a31c6f945061641dFD2b2',
  WETH_PRIME: '0xa411826a6ef5d289c0FAa7d5B45FE8aAB52257F6',
  XAUt_CORE: '0x470341bC0e2B833C54D0120642713BdF762A494F',
  cbBTC_CORE: '0xe8D5E595d5b6b5EFf84B7064765fd0e8DfD214C9',
  cbBTC_PRIME: '0x0E986545150DcDDe46Ea9df355D0fD2af33bd75D',
  frxUSD_CORE: '0x00C8A6a42947Cc4E7B6f27963Cab0143ccaaD2B5',
  frxUSD_PLUS: '0xCAB288d37CAb5a9db7b503F086455276Dcde61F1',
  rsETH_CORE: '0x6eEce89caE2163584bA7Ff9743861B9633c245E0',
  sUSDe_PLUS: '0xdf47fc43c88B06edC47753b7d647ff18037D2F3d',
  weETH_CORE: '0xB67F20bFF413C8E5d633B54BD28899c4c9e33ed0',
  wstETH_CORE: '0x474602394d0B02F43AC3D7C8c5cFc0814b03fd40',
  wstETH_PRIME: '0xAcCdAb49ECB9A801CfF62a92fc80D52339b33770',
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

  const normalizedSymbol = symbol
    .trim()
    .replace(/-/g, '_');

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

  console.log(raw);

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


