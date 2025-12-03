import { Client } from 'viem';
import Dec from 'decimal.js';
import { assetAmountInEth } from '@defisaver/tokens';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import { SavingsVaultData } from '../../types';
import * as skySavingsOptions from './options';
import { getViemProvider } from '../../services/viem';
import { SKY_SAVINGS_OPTION } from './options';
import { SkySavingsContractView } from '../../contracts';

export { skySavingsOptions };

/**
 * Converts shares to assets using ERC4626 standard formula
 * Formula: assets = shares * totalAssets / totalSupply
 *
 * @param shares - The amount of shares to convert
 * @param totalAssets - Total assets in the vault
 * @param totalSupply - Total supply of shares
 * @returns The equivalent amount of assets
 */
const convertToAssets = (shares: bigint, totalAssets: bigint, totalSupply: bigint): bigint => {
  // If no shares or no total supply, return 0 (or shares if totalSupply is 0 per ERC4626 spec)
  if (shares === BigInt(0)) {
    return BigInt(0);
  }

  // Per ERC4626 spec: if totalSupply == 0, return shares (1:1 ratio)
  if (totalSupply === BigInt(0)) {
    return shares;
  }

  // Standard ERC4626 formula: assets = shares * totalAssets / totalSupply
  return BigInt(
    new Dec(shares.toString())
      .mul(totalAssets.toString())
      .div(totalSupply.toString())
      .toFixed(0),
  );
};

export const _getSkyOptionData = async (
  provider: Client,
  network: NetworkNumber,
  accounts: EthAddress[],
): Promise<SavingsVaultData> => {
  const skySavingsContract = SkySavingsContractView(provider, network);

  const shares: Record<EthAddress, bigint> = {};

  const [totalAssets, totalSupply] = await Promise.all([
    skySavingsContract.read.totalAssets(),
    skySavingsContract.read.totalSupply(),
    ...accounts.map(async (account) => {
      const share = await skySavingsContract.read.balanceOf([account]);
      shares[account.toLowerCase() as EthAddress] = share;
      return share;
    }),
  ]);

  const poolSize = assetAmountInEth(totalAssets.toString(), SKY_SAVINGS_OPTION.asset);

  const supplied: Record<EthAddress, string> = {};
  accounts.forEach((account) => {
    const normalizedAccount = account.toLowerCase() as EthAddress;
    const share = shares[normalizedAccount] || BigInt(0);

    // Use local convertToAssets for each account to convert sUSDS shares to USDS assets
    const assetsWei = convertToAssets(share, totalAssets, totalSupply);
    const suppliedAmount = assetAmountInEth(assetsWei.toString(), SKY_SAVINGS_OPTION.asset);
    supplied[normalizedAccount] = suppliedAmount;
  });

  return {
    poolSize,
    supplied,
    liquidity: poolSize,
    asset: SKY_SAVINGS_OPTION.asset,
    optionType: SKY_SAVINGS_OPTION.type,
  };
};

export async function getSkyOptionData(
  provider: EthereumProvider,
  network: NetworkNumber,
  accounts: EthAddress[],
): Promise<SavingsVaultData> {
  return _getSkyOptionData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, accounts);
}
