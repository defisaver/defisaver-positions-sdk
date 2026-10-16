import Dec from 'decimal.js';
import { getAssetInfoByAddress } from '@defisaver/tokens';
import { FluidUserPositionStructOutputStruct, FluidVaultDataStructOutputStruct } from '../types';
import { NetworkNumber, PositionBalances } from '../types/common';

/** Convert raw tokens, or raw 18-decimal shares with a human-readable token/share ratio. */
export const fluidTokenAmount = (amount: bigint, decimals: number, perShare?: string): string => (
  new Dec(amount.toString()).div(new Dec(10).pow(perShare === undefined ? decimals : 18)).mul(perShare ?? 1).toString()
);

/** The same token/share conversion used by the full Fluid user parsers, without prices or yield. */
export function parseFluidBalances(position: FluidUserPositionStructOutputStruct, vault: FluidVaultDataStructOutputStruct, network: NetworkNumber): PositionBalances {
  const type = Number(vault.vaultType);
  if (![10000, 20000, 30000, 40000].includes(type)) throw new Error('Unsupported Fluid vault');
  const side = (amount: bigint, tokens: string[], ratios: bigint[] | undefined) => {
    const balances: Record<string, string> = {};
    tokens.forEach((address, i) => {
      const token = getAssetInfoByAddress(address, network);
      if (!Number.isFinite(token.decimals) || !token.symbol) throw new Error('Fluid token metadata unavailable');
      const perShare = ratios ? fluidTokenAmount(ratios[i], token.decimals) : undefined;
      const value = fluidTokenAmount(amount, token.decimals, perShare);
      balances[token.symbol] = new Dec(balances[token.symbol] || 0).add(value).toString();
    });
    return balances;
  };
  const smartSupply = type === 20000 || type === 40000;
  const smartDebt = type === 30000 || type === 40000;
  return {
    collateral: side(position.supply, smartSupply ? [vault.supplyToken0, vault.supplyToken1] : [vault.supplyToken0],
      smartSupply ? [vault.dexSupplyData.token0PerSupplyShare, vault.dexSupplyData.token1PerSupplyShare] : undefined),
    debt: side(position.borrow, smartDebt ? [vault.borrowToken0, vault.borrowToken1] : [vault.borrowToken0],
      smartDebt ? [vault.dexBorrowData.token0PerBorrowShare, vault.dexBorrowData.token1PerBorrowShare] : undefined),
  };
}
