import Web3 from 'web3';
import { getContract, Client, GetContractReturnType } from 'viem';
import * as configRaw from './config/contracts';
import { BaseContract } from './types/contracts/generated/types';
import * as ContractTypes from './types/contracts/generated';
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

const createContractFromConfigFunc = <T extends BaseContract>(name: ConfigKey, _address?: string) => (web3: Web3, network: NetworkNumber, block?: Blockish) => {
  const address = _address || getConfigContractAddress(name, network, block);
  return new web3.eth.Contract(getConfigContractAbi(name, network, block) as unknown as any[], address) as any as T;
};

export const getErc20Contract = (address: string, web3: Web3) => (
  new web3.eth.Contract(getConfigContractAbi('Erc20') as unknown as any[], address)
);

export const createContractWrapper = (web3: Web3, network: NetworkNumber, name: ConfigKey, _address?: string, block?: Blockish) => (
  createContractFromConfigFunc(name, _address)(web3, network, block)
);

export const UniMulticallContract = createContractFromConfigFunc<ContractTypes.UniMulticall>('UniMulticall');

export const wstETHContract = createContractFromConfigFunc<ContractTypes.WstETH>('wstETH');

export const PotContract = createContractFromConfigFunc<ContractTypes.Pot>('Pot');

export const SparkIncentiveDataProviderContract = createContractFromConfigFunc<ContractTypes.SparkIncentiveDataProvider>('SparkIncentiveDataProvider');
export const SparkViewContract = createContractFromConfigFunc<ContractTypes.SparkView>('SparkView');

export const CrvUSDViewContract = createContractFromConfigFunc<ContractTypes.CrvUSDView>('crvUSDView');
export const CrvUSDFactoryContract = createContractFromConfigFunc<ContractTypes.CrvUSDFactory>('crvUSDFactory');

export const LiquityViewContract = createContractFromConfigFunc<ContractTypes.LiquityView>('LiquityView');
export const LiquityCollSurplusPoolContract = createContractFromConfigFunc<ContractTypes.CollSurplusPool>('CollSurplusPool');
export const LiquityTroveManagerContract = createContractFromConfigFunc<ContractTypes.TroveManager>('TroveManager');
export const LiquityPriceFeedContract = createContractFromConfigFunc<ContractTypes.PriceFeed>('PriceFeed');
export const LiquityActivePoolContract = createContractFromConfigFunc<ContractTypes.LiquityActivePool>('LiquityActivePool');

export const McdViewContract = createContractFromConfigFunc<ContractTypes.McdView>('McdView');
export const McdSpotterContract = createContractFromConfigFunc<ContractTypes.McdSpotter>('McdSpotter');
export const McdDogContract = createContractFromConfigFunc<ContractTypes.McdDog>('McdDog');
export const McdJugContract = createContractFromConfigFunc<ContractTypes.McdJug>('McdJug');
export const McdVatContract = createContractFromConfigFunc<ContractTypes.McdVat>('McdVat');

export const ETHPriceFeedContract = createContractFromConfigFunc<ContractTypes.ETHPriceFeed>('ETHPriceFeed');
export const BTCPriceFeedContract = createContractFromConfigFunc<ContractTypes.BTCPriceFeed>('BTCPriceFeed');
export const COMPPriceFeedContract = createContractFromConfigFunc<ContractTypes.COMPPriceFeed>('COMPPriceFeed');
export const USDCPriceFeedContract = createContractFromConfigFunc<ContractTypes.USDCPriceFeed>('USDCPriceFeed');
export const WstETHPriceFeedContract = createContractFromConfigFunc<ContractTypes.WstETHPriceFeed>('WstETHPriceFeed');
export const WeETHPriceFeedContract = createContractFromConfigFunc<ContractTypes.WeETHPriceFeed>('WeETHPriceFeed');

export const DFSFeedRegistryContract = createContractFromConfigFunc<ContractTypes.DFSFeedRegistry>('DFSFeedRegistry');
export const FeedRegistryContract = createContractFromConfigFunc<ContractTypes.FeedRegistry>('FeedRegistry');

export const LlamaLendViewContract = createContractFromConfigFunc<ContractTypes.LlamaLendView>('LlamaLendView');

export const LiquityV2ViewContract = createContractFromConfigFunc<ContractTypes.LiquityV2View>('LiquityV2View');
export const LiquityV2LegacyViewContract = createContractFromConfigFunc<ContractTypes.LiquityV2LegacyView>('LiquityV2LegacyView');

export const FluidViewContract = createContractFromConfigFunc<ContractTypes.FluidView>('FluidView');

export const MorphoBlueViewContract = createContractFromConfigFunc<ContractTypes.MorphoBlueView>('MorphoBlueView');

export const BalanceScannerContract = createContractFromConfigFunc<ContractTypes.BalanceScanner>('BalanceScanner');

// Viem

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