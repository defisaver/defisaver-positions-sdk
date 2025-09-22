import { getContract, Client } from 'viem';
import * as configRaw from './config/contracts';
import {
  Blockish, EthAddress, HexString, NetworkNumber,
} from './types/common';

export type ConfigKey = keyof typeof configRaw;

declare type ContractConfig = {
  abi: any[],
  networks: Partial<Record<NetworkNumber, Network>>,
};
declare type Network = {
  createdBlock?: number,
  address: string,
  oldVersions?: Record<string, { address: EthAddress, abi: any[] }>,
};
// @ts-ignore
const contractConfig:Record<ConfigKey, ContractConfig> = configRaw;

export const getConfigContractAddress = (name: ConfigKey, network: NetworkNumber, block?: Blockish): HexString => {
  const networkData = contractConfig[name].networks[network];
  const latestAddress = networkData?.address || '';
  if (block && block !== 'latest') {
    if (block >= (networkData?.createdBlock || 0)) {
      return latestAddress as HexString;
    }

    const oldVersions = networkData?.oldVersions || {};
    // Versions are ordered from oldest to the newest
    for (const [createdBlock, oldVersionObject] of Object.entries(oldVersions).reverse()) {
      if (block >= Number(createdBlock)) {
        return oldVersionObject.address as HexString;
      }
    }
  }
  return latestAddress as HexString;
};

export const getConfigContractAbi = <TKey extends ConfigKey>(name: TKey, network?: NetworkNumber, block?: Blockish): typeof configRaw[TKey]['abi'] => {
  const networkData = network ? contractConfig[name].networks[network] : null;
  const latestAbi = contractConfig[name].abi;

  if (block && block !== 'latest' && networkData) {
    if (block >= (networkData?.createdBlock || 0)) {
      return latestAbi as unknown as typeof configRaw[TKey]['abi'];
    }

    const oldVersions = networkData?.oldVersions || {};
    // Versions are ordered from oldest to the newest
    for (const [createdBlock, oldVersionObject] of Object.entries(oldVersions).reverse()) {
      if (block >= Number(createdBlock)) {
        return oldVersionObject.abi as unknown as typeof configRaw[TKey]['abi'];
      }
    }
  }
  return latestAbi as unknown as typeof configRaw[TKey]['abi'];
};

export const createViemContractFromConfigFunc = <TKey extends ConfigKey>(name: TKey, _address?: HexString) => (client: Client, network: NetworkNumber, block?: Blockish) => {
  const address = (_address || getConfigContractAddress(name, network, block));
  const abi = getConfigContractAbi(name, network, block) as typeof configRaw[TKey]['abi'];
  return getContract({
    address,
    abi,
    client,
  });
};

export const MorphoBlueViewContractViem = createViemContractFromConfigFunc('MorphoBlueView');
export const AaveLoanInfoV2ContractViem = createViemContractFromConfigFunc('AaveLoanInfoV2');
export const AaveV3ViewContractViem = createViemContractFromConfigFunc('AaveV3View');
export const AaveIncentiveDataProviderV3ContractViem = createViemContractFromConfigFunc('AaveUiIncentiveDataProviderV3');
export const FeedRegistryContractViem = createViemContractFromConfigFunc('FeedRegistry');
export const DFSFeedRegistryContractViem = createViemContractFromConfigFunc('DFSFeedRegistry');
export const COMPPriceFeedContractViem = createViemContractFromConfigFunc('COMPPriceFeed');
export const ETHPriceFeedContractViem = createViemContractFromConfigFunc('ETHPriceFeed');
export const USDCPriceFeedContractViem = createViemContractFromConfigFunc('USDCPriceFeed');
export const WstETHPriceFeedContractViem = createViemContractFromConfigFunc('WstETHPriceFeed');
export const CompV3ViewContractViem = createViemContractFromConfigFunc('CompV3View');
export const SparkViewContractViem = createViemContractFromConfigFunc('SparkView');
export const SparkIncentiveDataProviderContractViem = createViemContractFromConfigFunc('SparkIncentiveDataProvider');
export const EulerV2ViewContractViem = createViemContractFromConfigFunc('EulerV2View');
export const CrvUSDViewContractViem = createViemContractFromConfigFunc('crvUSDView');
export const CrvUSDFactoryContractViem = createViemContractFromConfigFunc('crvUSDFactory');
export const LlamaLendViewContractViem = createViemContractFromConfigFunc('LlamaLendView');
export const McdGetCdpsContractViem = createViemContractFromConfigFunc('McdGetCdps');
export const McdViewContractViem = createViemContractFromConfigFunc('McdView');
export const McdVatContractViem = createViemContractFromConfigFunc('McdVat');
export const McdSpotterContractViem = createViemContractFromConfigFunc('McdSpotter');
export const McdDogContractViem = createViemContractFromConfigFunc('McdDog');
export const McdJugContractViem = createViemContractFromConfigFunc('McdJug');
export const CompoundLoanInfoContractViem = createViemContractFromConfigFunc('CompoundLoanInfo');
export const ComptrollerContractViem = createViemContractFromConfigFunc('Comptroller');

export const WeETHPriceFeedContractViem = createViemContractFromConfigFunc('WeETHPriceFeed');
export const BTCPriceFeedContractViem = createViemContractFromConfigFunc('BTCPriceFeed');

export const LiquityViewContractViem = createViemContractFromConfigFunc('LiquityView');
export const LiquityCollSurplusPoolContractViem = createViemContractFromConfigFunc('CollSurplusPool');
export const LiquityTroveManagerContractViem = createViemContractFromConfigFunc('TroveManager');
export const LiquityPriceFeedContractViem = createViemContractFromConfigFunc('PriceFeed');
export const LiquityActivePoolContractViem = createViemContractFromConfigFunc('LiquityActivePool');

export const LiquityV2ViewContractViem = createViemContractFromConfigFunc('LiquityV2View');
export const LiquityV2LegacyViewContractViem = createViemContractFromConfigFunc('LiquityV2LegacyView');

export const FluidViewContractViem = createViemContractFromConfigFunc('FluidView');

export const AaveIncentivesControllerViem = createViemContractFromConfigFunc('AaveIncentivesController');
export const AaveUmbrellaViewViem = createViemContractFromConfigFunc('AaveUmbrellaView');

export const LiquityLQTYStakingViem = createViemContractFromConfigFunc('LiquityLQTYStaking');
export const LiquityStabilityPoolViem = createViemContractFromConfigFunc('LiquityStabilityPool');

export const UUPSViem = createViemContractFromConfigFunc('UUPS');
export const SparkRewardsControllerViem = createViemContractFromConfigFunc('SparkRewardsController');

export const AaveRewardsControllerViem = createViemContractFromConfigFunc('AaveRewardsController');
export const LiquityV2sBoldVaultViem = createViemContractFromConfigFunc('LiquityV2sBoldVault');
export const StkAAVEViem = createViemContractFromConfigFunc('StkAAVE');