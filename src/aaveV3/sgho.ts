import Dec from 'decimal.js';
import { EthAddress, NetworkNumber } from '../types/common';
import { DEFAULT_TIMEOUT } from '../services/utils';
import { ZERO_ADDRESS } from '../constants';

export interface SghoUserData {
  shares: string;
  balance: string;
  maxDeposit: string;
  maxWithdraw: string;
  underlyingBalance: string;
}

export interface SghoData {
  totalAssets: string;
  totalSupply: string;
  supplyCap: string;
  /** Target savings rate as an APY percent (e.g. "4.25" for 4.25%). */
  targetRate: string;
  paused: boolean;
  user: SghoUserData;
}

const EMPTY_SGHO_DATA: SghoData = {
  totalAssets: '0',
  totalSupply: '0',
  supplyCap: '0',
  targetRate: '0',
  paused: false,
  user: {
    shares: '0',
    balance: '0',
    maxDeposit: '0',
    maxWithdraw: '0',
    underlyingBalance: '0',
  },
};

const SGHO_VAULT_QUERY = `query SghoVault($request: SghoVaultRequest!) {
  value: sghoVault(request: $request) {
    totalAssets { amount { value } }
    totalSupply { value }
    supplyCap { amount { value } }
    targetRate { value }
    paused
    user {
      shares { amount { value } }
      balance { amount { value } }
      maxDeposit { amount { value } }
      maxWithdraw { amount { value } }
      underlyingBalance { amount { value } }
    }
  }
}`;

const tokenAmountValue = (entry: any): string => entry?.amount?.value?.toString() || '0';
const decimalValue = (entry: any): string => entry?.value?.toString() || '0';
// Aave returns the rate as a ratio (e.g. 0.0425); consumers display/compound it as a percent (4.25).
const percentValue = (entry: any): string => (entry?.value != null ? new Dec(entry.value).mul(100).toString() : '0');

export const getSghoData = async (
  network: NetworkNumber,
  address: EthAddress = ZERO_ADDRESS,
): Promise<SghoData> => {
  if (network !== NetworkNumber.Eth) return EMPTY_SGHO_DATA;
  try {
    const res = await fetch('https://api.v3.aave.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'SghoVault',
        query: SGHO_VAULT_QUERY,
        variables: { request: { chainId: 1, user: address } },
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });
    if (!res.ok) throw new Error(`Aave SghoVault request failed: ${res.status}`);
    const body = await res.json();
    const data = body?.data?.value;
    if (!data) throw new Error('Aave SghoVault response missing data');

    return {
      totalAssets: tokenAmountValue(data.totalAssets),
      totalSupply: decimalValue(data.totalSupply),
      supplyCap: tokenAmountValue(data.supplyCap),
      targetRate: percentValue(data.targetRate),
      paused: !!data.paused,
      user: {
        shares: tokenAmountValue(data?.user?.shares),
        balance: tokenAmountValue(data?.user?.balance),
        maxDeposit: tokenAmountValue(data?.user?.maxDeposit),
        maxWithdraw: tokenAmountValue(data?.user?.maxWithdraw),
        underlyingBalance: tokenAmountValue(data?.user?.underlyingBalance),
      },
    };
  } catch (e) {
    console.error('External API Failure: Failed to fetch Aave sGHO vault data', e);
    return EMPTY_SGHO_DATA;
  }
};
