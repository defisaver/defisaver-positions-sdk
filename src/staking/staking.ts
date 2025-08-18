import Dec from 'decimal.js';
import memoize from 'memoizee';
import { MMAssetsData, MMUsedAssets } from '../types/common';
import { BLOCKS_IN_A_YEAR } from '../constants';
import { DEFAULT_TIMEOUT } from '../services/utils';

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

const getApyFromDfsApi = async (asset: string) => {
  try {
    const res = await fetch(`https://fe.defisaver.com/api/staking/apy?asset=${asset}`,
      { signal: AbortSignal.timeout(DEFAULT_TIMEOUT) });
    if (!res.ok) throw new Error(`Failed to fetch APY for ${asset}`);
    const data = await res.json();
    return String(data.apy);
  } catch (e) {
    console.error(`External API Failure: Failed to fetch APY for ${asset} from DFS API`, e);
    return '0';
  }
};

export const STAKING_ASSETS = ['cbETH', 'wstETH', 'cbETH', 'rETH', 'sDAI', 'weETH', 'sUSDe', 'osETH', 'ezETH', 'ETHx', 'rsETH', 'pufETH', 'wrsETH', 'wsuperOETHb', 'sUSDS', 'PT eUSDe May', 'PT sUSDe July', 'PT USDe July', 'PT eUSDe Aug', 'tETH', 'PT sUSDe Sep', 'PT USDe Sep'];

export const getStakingApy = memoize(async (asset: string) => {
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
    if (asset === 'PT eUSDe May') return await getApyFromDfsApi('PT eUSDe May');
    if (asset === 'PT sUSDe July') return await getApyFromDfsApi('PT sUSDe July');
    if (asset === 'PT USDe July') return await getApyFromDfsApi('PT USDe July');
    if (asset === 'PT eUSDe Aug') return await getApyFromDfsApi('PT eUSDe Aug');
    if (asset === 'PT sUSDe Sep') return await getApyFromDfsApi('PT sUSDe Sep');
    if (asset === 'PT USDe Sep') return await getApyFromDfsApi('PT USDe Sep');
    if (asset === 'tETH') return await getApyFromDfsApi('tETH');
    if (asset === 'USDe') return await getApyFromDfsApi('USDe');
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

export const isEligibleForEthenaUSDeRewards = (usedAssets: MMUsedAssets) => {
  const USDeUSDAmountSupplied = usedAssets.USDe?.suppliedUsd || '0';
  const sUSDeUSDAmountSupplied = usedAssets.sUSDe?.suppliedUsd || '0';
  const anythingElseSupplied = Object.values(usedAssets).some((asset) => asset.symbol !== 'USDe' && asset.symbol !== 'sUSDe' && asset.isSupplied);
  if (anythingElseSupplied) return { isEligible: false, eligibleUSDAmount: '0' };
  const totalAmountSupplied = new Dec(USDeUSDAmountSupplied).add(sUSDeUSDAmountSupplied).toString();
  const percentageInUSDe = new Dec(USDeUSDAmountSupplied).div(totalAmountSupplied).toNumber();
  if (percentageInUSDe < 0.45 || percentageInUSDe > 0.55) return { isEligible: false, eligibleUSDAmount: '0' }; // 45% - 55% of total amount supplied must be in USDe
  const percentageInSUSDe = new Dec(sUSDeUSDAmountSupplied).div(totalAmountSupplied).toNumber();
  if (percentageInSUSDe < 0.45 || percentageInSUSDe > 0.55) return { isEligible: false, eligibleUSDAmount: '0' }; // 45% - 55% of total amount supplied must be in sUSDe

  const allowedBorrowAssets = ['USDC', 'USDT', 'USDS'];
  const anythingBorrowedNotAllowed = Object.values(usedAssets).some((asset) => asset.isBorrowed && !allowedBorrowAssets.includes(asset.symbol));
  if (anythingBorrowedNotAllowed) return { isEligible: false, eligibleUSDAmount: '0' };

  const totalAmountBorrowed = Object.values(usedAssets).reduce((acc, asset) => {
    if (asset.isBorrowed) {
      return acc.add(asset.borrowedUsd);
    }
    return acc;
  }, new Dec(0)).toString();

  const borrowPercentage = new Dec(totalAmountBorrowed).div(totalAmountSupplied).toNumber();
  if (borrowPercentage < 0.5) return { isEligible: false, eligibleUSDAmount: '0' }; // must be looped at least once

  const halfAmountSupplied = new Dec(totalAmountSupplied).div(2).toString();
  const USDeAmountEligibleForRewards = Dec.min(USDeUSDAmountSupplied, halfAmountSupplied).toString(); // rewards are given to amount of USDe supplied up to half of total amount supplied

  return { isEligible: true, eligibleUSDAmount: USDeAmountEligibleForRewards };
};

export const calculateNetApy = ({
  usedAssets, assetsData, isMorpho = false, isAave = false,
}: { usedAssets: MMUsedAssets, assetsData: MMAssetsData, isMorpho?: boolean, isAave?: boolean }) => {
  const { isEligible, eligibleUSDAmount } = isAave ? isEligibleForEthenaUSDeRewards(usedAssets) : { isEligible: true, eligibleUSDAmount: '0' };
  const sumValues = Object.values(usedAssets).reduce((_acc, usedAsset) => {
    const acc = { ..._acc };
    const assetData = assetsData[usedAsset.symbol];

    if (usedAsset.isSupplied) {
      const amount = usedAsset.suppliedUsd;
      acc.suppliedUsd = new Dec(acc.suppliedUsd).add(amount).toString();
      const rate = isMorpho
        ? usedAsset.supplyRate === '0' ? assetData.supplyRateP2P : usedAsset.supplyRate
        : assetData.supplyRate;
      const supplyInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.supplyInterest = new Dec(acc.supplyInterest).add(supplyInterest.toString()).toString();
      if (assetData.incentiveSupplyApy) {
        // take COMP/AAVE yield into account
        const incentiveInterest = calculateInterestEarned(amount, assetData.incentiveSupplyApy, 'year', true);
        acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
      }

      if (usedAsset.symbol === 'USDe' && isEligible) {
        // @ts-ignore
        const incentiveInterest = calculateInterestEarned(eligibleUSDAmount, assetData.supplyIncentives?.[0]?.apy || '0', 'year', true);
        acc.incentiveUsd = new Dec(acc.incentiveUsd).add(incentiveInterest).toString();
      }
    }

    if (usedAsset.isBorrowed) {
      const amount = usedAsset.borrowedUsd;
      acc.borrowedUsd = new Dec(acc.borrowedUsd).add(amount).toString();
      const rate = isMorpho
        ? usedAsset.borrowRate === '0' ? assetData.borrowRateP2P : usedAsset.borrowRate
        : (usedAsset?.interestMode === '1' ? usedAsset.stableBorrowRate : assetData.borrowRate);
      const borrowInterest = calculateInterestEarned(amount, rate as string, 'year', true);
      acc.borrowInterest = new Dec(acc.borrowInterest).sub(borrowInterest.toString()).toString();
      if (assetData.incentiveBorrowApy) {
        // take COMP/AAVE yield into account
        const incentiveInterest = calculateInterestEarned(amount, assetData.incentiveBorrowApy, 'year', true);
        acc.incentiveUsd = new Dec(acc.incentiveUsd).sub(incentiveInterest).toString();
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