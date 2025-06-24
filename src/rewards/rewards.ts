import memoize from 'memoizee';
import { IncentiveKind } from '../types/common';

export const REWARD_ASSETS = [
  'syrupUSDC',
];

const getApyFromDfsApi = async (asset: string) => {
  const res = await fetch(`https://fe.defisaver.com/api/rewards/apy?asset=${asset}`);
  if (!res.ok) throw new Error(`Failed to fetch APY for ${asset}`);
  const data = await res.json();
  return String(data.apy);
};

export const getReward = memoize(async (asset: string) => {
  try {
    if (asset === 'syrupUSDC') {
      return {
        token: '$MAPLE',
        apy: await getApyFromDfsApi(asset),
        incentiveKind: IncentiveKind.Reward,
      };
    }
  } catch (e) {
    console.error(`Failed to fetch APY for ${asset}`);
  }
  return {
    token: '?',
    apy: '0',
    incentiveKind: IncentiveKind.Reward,
  };
}, { promise: true, maxAge: 2 * 60 * 1000 });