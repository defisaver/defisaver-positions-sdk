import Web3 from 'web3';
import configRaw from './config/contracts';
import { BaseContract } from './types/contracts/generated/types';
import * as ContractTypes from './types/contracts/generated';
import { Blockish, EthAddress, NetworkNumber } from './types/common';

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
const contractConfig:Record<ConfigKey, ContractConfig> = configRaw;

export const getConfigContractAddress = (name: ConfigKey, network: NetworkNumber, block?: Blockish): string => {
  const networkData = contractConfig[name].networks[network];
  const latestAddress = networkData?.address || '';
  if (block && block !== 'latest') {
    if (block >= (networkData?.createdBlock || 0)) {
      return latestAddress;
    }

    const oldVersions = networkData?.oldVersions || {};
    // Versions are ordered from oldest to the newest
    for (const [createdBlock, oldVersionObject] of Object.entries(oldVersions).reverse()) {
      if (block >= Number(createdBlock)) {
        return oldVersionObject.address;
      }
    }
  }
  return latestAddress;
};

export const getConfigContractAbi = (name: ConfigKey, network?: NetworkNumber, block?: Blockish): any[] => {
  const networkData = network ? contractConfig[name].networks[network] : null;
  const latestAbi = contractConfig[name].abi;

  if (block && block !== 'latest' && networkData) {
    if (block >= (networkData?.createdBlock || 0)) {
      return latestAbi;
    }

    const oldVersions = networkData?.oldVersions || {};
    // Versions are ordered from oldest to the newest
    for (const [createdBlock, oldVersionObject] of Object.entries(oldVersions).reverse()) {
      if (block >= Number(createdBlock)) {
        return oldVersionObject.abi;
      }
    }
  }
  return latestAbi;
};

const createContractFromConfigFunc = <T extends BaseContract>(name: ConfigKey, _address?: string) => (web3: Web3, network: NetworkNumber, block?: Blockish) => {
  const address = _address || getConfigContractAddress(name, network, block);
  return new web3.eth.Contract(getConfigContractAbi(name, network, block), address) as any as T;
};

export const getErc20Contract = (address: string, web3: Web3) => (
  new web3.eth.Contract(getConfigContractAbi('Erc20'), address)
);

export const createContractWrapper = (web3: Web3, network: NetworkNumber, name: ConfigKey, _address?: string, block?: Blockish) => (
  createContractFromConfigFunc(name, _address)(web3, network, block)
);

export const UniMulticallContract = createContractFromConfigFunc<ContractTypes.UniMulticall>('UniMulticall');

export const AaveV3ViewContract = createContractFromConfigFunc<ContractTypes.AaveV3View>('AaveV3View');
export const AaveIncentiveDataProviderV3Contract = createContractFromConfigFunc<ContractTypes.AaveUiIncentiveDataProviderV3>('AaveUiIncentiveDataProviderV3');

export const GhoTokenContract = createContractFromConfigFunc<ContractTypes.GHO>('GHO');

export const LidoContract = createContractFromConfigFunc<ContractTypes.Lido>('Lido');
export const CbEthContract = createContractFromConfigFunc<ContractTypes.CbEth>('CbEth');
export const REthContract = createContractFromConfigFunc<ContractTypes.REth>('REth');

export const BalanceScannerContract = createContractFromConfigFunc<ContractTypes.BalanceScanner>('BalanceScanner');

export const CompV3ViewContract = createContractFromConfigFunc<ContractTypes.CompV3View>('CompV3View');

export const wstETHContract = createContractFromConfigFunc<ContractTypes.WstETH>('wstETH');

export const AaveLoanInfoV2Contract = createContractFromConfigFunc<ContractTypes.AaveLoanInfoV2>('AaveLoanInfoV2');

export const CompoundLoanInfoContract = createContractFromConfigFunc<ContractTypes.CompoundLoanInfo>('CompoundLoanInfo');

export const ComptrollerContract = createContractFromConfigFunc<ContractTypes.Comptroller>('Comptroller');

export const PotContract = createContractFromConfigFunc<ContractTypes.Pot>('Pot');

export const MorphoAaveV2ViewContract = createContractFromConfigFunc<ContractTypes.MorphoAaveV2View>('MorphoAaveV2View');

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

export const ChickenBondsViewContract = createContractFromConfigFunc<ContractTypes.ChickenBondsView>('ChickenBondsView');
export const ChickenBondsManagerContract = createContractFromConfigFunc<ContractTypes.ChickenBondsManager>('ChickenBondsManager');

export const ETHPriceFeedContract = createContractFromConfigFunc<ContractTypes.ETHPriceFeed>('ETHPriceFeed');
export const BTCPriceFeedContract = createContractFromConfigFunc<ContractTypes.BTCPriceFeed>('BTCPriceFeed');
export const COMPPriceFeedContract = createContractFromConfigFunc<ContractTypes.COMPPriceFeed>('COMPPriceFeed');
export const USDCPriceFeedContract = createContractFromConfigFunc<ContractTypes.USDCPriceFeed>('USDCPriceFeed');
export const WstETHPriceFeedContract = createContractFromConfigFunc<ContractTypes.WstETHPriceFeed>('WstETHPriceFeed');
export const WeETHPriceFeedContract = createContractFromConfigFunc<ContractTypes.WeETHPriceFeed>('WeETHPriceFeed');

export const FeedRegistryContract = createContractFromConfigFunc<ContractTypes.FeedRegistry>('FeedRegistry');
export const DFSFeedRegistryContract = createContractFromConfigFunc<ContractTypes.DFSFeedRegistry>('DFSFeedRegistry');

export const MorphoBlueViewContract = createContractFromConfigFunc<ContractTypes.MorphoBlueView>('MorphoBlueView');

export const LlamaLendViewContract = createContractFromConfigFunc<ContractTypes.LlamaLendView>('LlamaLendView');

export const LiquityV2ViewContract = createContractFromConfigFunc<ContractTypes.LiquityV2View>('LiquityV2View');
export const LiquityV2LegacyViewContract = createContractFromConfigFunc<ContractTypes.LiquityV2LegacyView>('LiquityV2LegacyView');

export const EulerV2ViewContract = createContractFromConfigFunc<ContractTypes.EulerV2View>('EulerV2View');
export const FluidViewContract = createContractFromConfigFunc<ContractTypes.FluidView>('FluidView');
