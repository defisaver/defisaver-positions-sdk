import Dec from 'decimal.js';
import memoize from 'memoizee';
import {
  MMAssetsData,
  MMUsedAssets,
  NetworkNumber,
} from '../types/common';
import { BLOCKS_IN_A_YEAR } from '../constants';
import { DEFAULT_TIMEOUT } from '../services/utils';
import { EligibilityMapping } from './eligibility';
import { EulerV2UsedAsset } from '../types';

const getSsrApy = async () => {
  try {
    const res = await fetch('https://fe.defisaver.com/api/sky/data',
      { signal: AbortSignal.timeout(DEFAULT_TIMEOUT) });
    const data = await res.json();
    return new Dec(data.data.skyData[0].sky_savings_rate_apy).mul(100).toString();
  } catch (e) {
    console.error('External API Failure: Failed to fetch SSR APY from external API', e);
    return '0';
  }
};

const getSuperOETHApy = async () => {
  try {
    const res = await fetch('https://origin.squids.live/origin-squid/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '\n    query OTokenApy($chainId: Int!, $token: String!) {\n  oTokenApies(\n    limit: 1\n    orderBy: timestamp_DESC\n    where: {chainId_eq: $chainId, otoken_containsInsensitive: $token}\n  ) {\n    apy7DayAvg\n    apy14DayAvg\n    apy30DayAvg\n    apr\n    apy\n  }\n}\n    ',
        variables: {
          token: '0xdbfefd2e8460a6ee4955a68582f85708baea60a3',
          chainId: 8453,
        },
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });

    const data = await res.json();
    return new Dec(data.data.oTokenApies[0].apy).mul(100).toString();
  } catch (e) {
    console.error('External API Failure: Failed to fetch Super OETH APY from external API', e);
    return '0';
  }
};

const getApyFromDfsApi = async (asset: string, network: number = NetworkNumber.Eth) => {
  try {
    const res = await fetch(`https://fe.defisaver.com/api/staking/apy?asset=${asset}&network=${network}`,
      { signal: AbortSignal.timeout(DEFAULT_TIMEOUT) });
    if (!res.ok) throw new Error(`Failed to fetch APY for ${asset}`);
    const data = await res.json();
    return String(data.apy ?? '0');
  } catch (e) {
    console.error(`External API Failure: Failed to fetch APY for ${asset} from DFS API`, e);
    return '0';
  }
};

export const STAKING_ASSETS = [
  'cbETH', 'wstETH', 'cbETH', 'rETH', 'sDAI', 'weETH', 'sUSDe', 'osETH',
  'ezETH', 'ETHx', 'rsETH', 'pufETH', 'wrsETH', 'wsuperOETHb', 'sUSDS', 'tETH', 'PT sUSDe Sep', 'PT USDe Sep',
  'PT sUSDe Nov', 'PT USDe Nov', 'PT USDe Jan', 'PT sUSDe Jan', 'wrsETH', 'wstETH', 'syrupUSDT', 'syrupUSDC', 'wstUSR',
  'PT sUSDe Feb', 'PT USDe Feb', 'mmUSD',
];

export const getStakingApy = memoize(async (asset: string, network: number = NetworkNumber.Eth) => {
  try {
    if (asset === 'stETH' || asset === 'wstETH') return await getApyFromDfsApi('wstETH');
    if (asset === 'cbETH') return await getApyFromDfsApi('cbETH');
    if (asset === 'rETH') return await getApyFromDfsApi('rETH');
    if (asset === 'sDAI') return await getApyFromDfsApi('sDAI');
    if (asset === 'sUSDe') return await getApyFromDfsApi('sUSDe');
    if (asset === 'weETH') return await getApyFromDfsApi('weETH');
    if (asset === 'ezETH') return await getApyFromDfsApi('ezETH');
    if (asset === 'osETH') return await getApyFromDfsApi('osETH');
    if (asset === 'ETHx') return await getApyFromDfsApi('ETHx');
    if (asset === 'rsETH' || asset === 'wrsETH') return await getApyFromDfsApi('rsETH');
    if (asset === 'pufETH') return await getApyFromDfsApi('pufETH');
    if (asset === 'wsuperOETHb') return await getSuperOETHApy();
    if (asset === 'sUSDS') return await getSsrApy();
    if (asset === 'PT eUSDe May') return await getApyFromDfsApi('PT eUSDe May', network);
    if (asset === 'PT sUSDe July') return await getApyFromDfsApi('PT sUSDe July', network);
    if (asset === 'PT USDe July') return await getApyFromDfsApi('PT USDe July', network);
    if (asset === 'PT eUSDe Aug') return await getApyFromDfsApi('PT eUSDe Aug', network);
    if (asset === 'PT sUSDe Sep') return await getApyFromDfsApi('PT sUSDe Sep', network);
    if (asset === 'PT USDe Sep') return await getApyFromDfsApi('PT USDe Sep', network);
    if (asset === 'tETH') return await getApyFromDfsApi('tETH');
    if (asset === 'USDe') return await getApyFromDfsApi('USDe');
    if (asset === 'PT sUSDe Nov') return await getApyFromDfsApi('PT sUSDe Nov', network);
    if (asset === 'PT USDe Nov') return await getApyFromDfsApi('PT USDe Nov', network);
    if (asset === 'PT USDe Jan') return await getApyFromDfsApi('PT USDe Jan', network);
    if (asset === 'PT sUSDe Jan') return await getApyFromDfsApi('PT sUSDe Jan', network);
    if (asset === 'syrupUSDT') return await getApyFromDfsApi('syrupUSDT');
    if (asset === 'syrupUSDC') return await getApyFromDfsApi('syrupUSDC');
    if (asset === 'wstUSR') return await getApyFromDfsApi('wstUSR');
    if (asset === 'PT sUSDe Feb') return await getApyFromDfsApi('PT sUSDe Feb', network);
    if (asset === 'PT USDe Feb') return await getApyFromDfsApi('PT USDe Feb', network);
    if (asset === 'mmUSD') return await getApyFromDfsApi('mmUSD', network);
  } catch (e) {
    console.error(`Failed to fetch APY for ${asset}`);
  }
  return '0';
}, { promise: true, maxAge: 2 * 60 * 1000 });

export const calculateInterestEarned = (principal: string, interest: string, type: string, apy = false) => {
  let interval = 1;

  if (+interest === 0) return 0;

  if (type === 'month') interval = 1 / 12;
  if (type === 'week') interval = 1 / 52.1429;

  if (apy) {
    // interest rate already compounded
    return (+principal * (1 + (+interest / 100 * interval))) - +principal;
  }

  return (+principal * (((1 + (+interest / 100) / BLOCKS_IN_A_YEAR)) ** (BLOCKS_IN_A_YEAR * interval))) - +principal; // eslint-disable-line
};

export const calculateNetApy = ({
  usedAssets, assetsData, optionalData,
}: { usedAssets: MMUsedAssets, assetsData: MMAssetsData, optionalData?: any }) => {
  const sumValues = Object.values(usedAssets).reduce((_acc, usedAsset) => {
    const acc = { ..._acc };
    const assetData = assetsData[usedAsset.symbol] || assetsData[(usedAsset as EulerV2UsedAsset).vaultAddress?.toLowerCase() || ''];

    if (usedAsset.isSupplied) {
      const amount = usedAsset.suppliedUsd;
      acc.suppliedUsd = new Dec(acc.suppliedUsd).add(amount).toString();
      const rate = assetData.supplyRate;
      const supplyInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.supplyInterest = new Dec(acc.supplyInterest).add(supplyInterest.toString()).toString();

      for (const supplyIncentive of assetData.supplyIncentives) {
        const { apy, eligibilityId } = supplyIncentive;
        const eligibilityCheck = eligibilityId ? EligibilityMapping[eligibilityId] : null;
        if (eligibilityCheck) {
          const { isEligible, eligibleUSDAmount } = eligibilityCheck(usedAssets, optionalData);
          const incentiveInterest = isEligible ? calculateInterestEarned(eligibleUSDAmount, apy, 'year', true) : '0';
          acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
        } else {
          const incentiveInterest = calculateInterestEarned(amount, apy, 'year', true);
          acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
        }
      }
    }

    if (usedAsset.isBorrowed) {
      const amount = usedAsset.borrowedUsd;
      acc.borrowedUsd = new Dec(acc.borrowedUsd).add(amount).toString();
      const rate = assetData.borrowRate;
      const borrowInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.borrowInterest = new Dec(acc.borrowInterest).sub(borrowInterest.toString()).toString();

      for (const borrowIncentive of assetData.borrowIncentives) {
        const { apy, eligibilityId } = borrowIncentive;
        const eligibilityCheck = eligibilityId ? EligibilityMapping[eligibilityId] : null;
        if (eligibilityCheck) {
          const { isEligible, eligibleUSDAmount } = eligibilityCheck(usedAssets, optionalData);
          const incentiveInterest = isEligible ? calculateInterestEarned(eligibleUSDAmount, apy, 'year', true) : '0';
          acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
        } else {
          const incentiveInterest = calculateInterestEarned(amount, apy, 'year', true);
          acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
        }
      }
    }

    return acc;
  }, {
    borrowInterest: '0', supplyInterest: '0', incentiveUsd: '0', borrowedUsd: '0', suppliedUsd: '0',
  });

  const {
    borrowedUsd, suppliedUsd, borrowInterest, supplyInterest, incentiveUsd,
  } = sumValues;

  const totalInterestUsd = new Dec(borrowInterest).add(supplyInterest).add(incentiveUsd).toString();
  const balance = new Dec(suppliedUsd).sub(borrowedUsd);
  const netApy = new Dec(totalInterestUsd).div(balance).times(100).toString();

  return { netApy, totalInterestUsd, incentiveUsd };
};