
import { DEFAULT_TIMEOUT } from '../services/utils';
import { NetworkNumber } from '../types/common';
import { aprToApy } from '../moneymarket';
import { AaveVersions } from '../types';


type RewardInfo = { apy: string; rewardTokenSymbol: string, description: string };
type MeritTokenRewardMap = { supply: Record<string, RewardInfo>; borrow: Record<string, RewardInfo> };

/**
 * Maps API keys to reward data & actions - hardcoded and needs to be maintained actively.
 * Mapping based on Aave interface implementation: https://github.com/aave/interface/blob/main/src/hooks/useMeritIncentives.ts
 * Active campaigns found here: https://apps.aavechan.com/merit
 */
const MERIT_DATA_MAP:
Record<
NetworkNumber,
Partial<Record<
AaveVersions,
Record<string, {
  rewardTokenSymbol: string;
  action: 'supply' | 'borrow' | 'stake';
  message?: string;
  supplyTokens?: string[],
  borrowTokens?: string[],
}>
>>
> = {
  [NetworkNumber.Eth]: {
    [AaveVersions.AaveV3]: {
      // 'ethereum-sgho': { supplyTokens: ['sGHO'], rewardTokenSymbol: 'sGHO', action: 'stake' },
      // 'ethereum-stkgho': { supplyTokens: ['stkGHO'], rewardTokenSymbol: 'stkGHO', action: 'stake' },
      'ethereum-supply-ethx': { rewardTokenSymbol: 'SD', action: 'supply', supplyTokens: ['ETHx'] },
      'ethereum-supply-rlusd': { rewardTokenSymbol: 'aEthRLUSD', action: 'supply', supplyTokens: ['RLUSD'] },
      'ethereum-borrow-eurc': { rewardTokenSymbol: 'aEthEURC', action: 'borrow', borrowTokens: ['EURC'] },
    },
    [AaveVersions.AaveV3Lido]: {},
    [AaveVersions.AaveV3Etherfi]: {},
  },
  [NetworkNumber.Arb]: {
    [AaveVersions.AaveV3]: {},
  },
  [NetworkNumber.Opt]: {
    [AaveVersions.AaveV3]: {},
  },
  [NetworkNumber.Base]: {
    [AaveVersions.AaveV3]: {
      'base-borrow-usdc': { rewardTokenSymbol: 'USDC', action: 'borrow', borrowTokens: ['USDC'] },
      'base-borrow-gho': { rewardTokenSymbol: 'GHO', action: 'borrow', borrowTokens: ['GHO'] },
      'base-borrow-eurc': { rewardTokenSymbol: 'EURC', action: 'borrow', borrowTokens: ['EURC'] },
      // DEV: Campaigns for specific users, no APY:
      // 'base-supply-usdc': { rewardTokenSymbol: 'USDC', action: 'supply' },
      // 'base-supply-gho': { rewardTokenSymbol: 'GHO', action: 'supply' },
      // 'base-supply-cbbtc-borrow-multiple': {
      //   rewardTokenSymbol: 'cbBTC',
      //   action: 'supply',
      //   message: 'You must supply cbBTC and borrow USDC, GHO, EURC or wETH to receive Merit rewards. Holding some assets or positions on other protocols may impact the amount of rewards you are eligible for. Please check the forum post for the full eligibility criteria.',
      //   supplyTokens: ['cbBTC'],
      //   borrowTokens: ['USDC', 'GHO', 'EURC', 'ETH'],
      // },
      // 'base-supply-wsteth-borrow-multiple': {
      //   rewardTokenSymbol: 'wstETH',
      //   action: 'supply',
      //   message: 'You must supply wstETH and borrow USDC, GHO, EURC or wETH to receive Merit rewards. Holding some assets or positions on other protocols may impact the amount of rewards you are eligible for. Please check the forum post for the full eligibility criteria.',
      //   supplyTokens: ['wstETH'],
      //   borrowTokens: ['USDC', 'GHO', 'EURC', 'ETH'],
      // },
      // 'base-supply-eth-borrow-multiple': {
      //   rewardTokenSymbol: 'ETH',
      //   action: 'supply',
      //   message: 'Supplying ETH alone earns 1.25%, supplying ETH and borrowing USDC or EURC earns 1.50%, supplying ETH and borrowing GHO earns 1.75%. Some assets holding or positions on other protocols may impact the amount of rewards you are eligible for. Please check the forum post for the full eligibility criteria.',
      // },
    },
  },
  [NetworkNumber.Linea]: {
    [AaveVersions.AaveV3]: {},
  },
};

/**
 * Fetches merit rewards data from Aave API
 */
export const fetchMeritRewardsData = async (): Promise<Record<string, number | null>> => {
  try {
    const response = await fetch('https://apps.aavechan.com/api/merit/aprs', {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });
    const data = await response.json();
    return data.currentAPR.actionsAPR as Record<string, number | null>;
  } catch (error) {
    console.error('Failed to fetch merit rewards data:', error);
    return {};
  }
};

export const getMeritCampaigns = async (chainId: NetworkNumber, market: AaveVersions): Promise<MeritTokenRewardMap> => {
  const meritData = await fetchMeritRewardsData();
  const relevantCampaigns = {
    supply: {},
    borrow: {},
  } as MeritTokenRewardMap;
  Object.entries(MERIT_DATA_MAP[chainId]?.[market] || {})
    .filter(([key, rewardData]) => !!meritData[key])
    .forEach(([key, rewardData]) => {
      const apr = meritData[key]!;
      if (!apr) return;
      const reward = {
        rewardTokenSymbol: rewardData.rewardTokenSymbol,
        apy: aprToApy(apr).toString(),
        description: `Eligible for Merit rewards in ${rewardData.rewardTokenSymbol}. ${rewardData.message ? `\n${rewardData.message}` : ''}`,
      };
      rewardData.supplyTokens?.forEach(token => {
        relevantCampaigns.supply[token] = reward;
      });
      rewardData.borrowTokens?.forEach(token => {
        relevantCampaigns.borrow[token] = reward;
      });
    });
  return relevantCampaigns;
};
