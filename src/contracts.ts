import Web3 from 'web3';
import configRaw from './config/contracts';
import { BaseContract } from './types/contracts/generated/types';
import * as ContractTypes from './types/contracts/generated';
import { NetworkNumber } from './types/common';

export type ConfigKey = keyof typeof configRaw;

declare type ContractConfig = {
  abi: any[],
  networks: Partial<Record<NetworkNumber, Network>>,
};
declare type Network = {
  createdBlock?:number,
  address:string
};
const contractConfig:Record<ConfigKey, ContractConfig> = configRaw;
export const getConfigContractAddress = (name: ConfigKey, network: NetworkNumber): string => contractConfig[name].networks[network]?.address || '';
export const getConfigContractAbi = (name: ConfigKey): any[] => contractConfig[name].abi;

const createContractFromConfigFunc = <T extends BaseContract>(name: ConfigKey, _address?: string) => (web3: Web3, network: NetworkNumber) => {
  const address = _address || getConfigContractAddress(name, network);
  return new web3.eth.Contract(contractConfig[name].abi, address) as any as T;
};

export const getErc20Contract = (address: string, web3: Web3) => (
  new web3.eth.Contract(getConfigContractAbi('Erc20'), address)
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
