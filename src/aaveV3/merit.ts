
import { DEFAULT_TIMEOUT } from '../services/utils';
import { NetworkNumber } from '../types/common';
import { aprToApy } from '../moneymarket';
import { AaveVersions, MeritTokenRewardMap } from '../types';

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
      'ethereum-supply-ethx': { rewardTokenSymbol: 'SD', action: 'supply', supplyTokens: ['ETHx'] },
      'ethereum-supply-rlusd': { rewardTokenSymbol: 'aEthRLUSD', action: 'supply', supplyTokens: ['RLUSD'] },
      // Campaign disabled here as it's present on Merkl API:
      // 'ethereum-borrow-eurc': { rewardTokenSymbol: 'aEthEURC', action: 'borrow', borrowTokens: ['EURC'] },
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
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data.currentAPR.actionsAPR as Record<string, number | null>;
  } catch (error) {
    console.error('External API Failure: Failed to fetch merit rewards data:', error);
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
