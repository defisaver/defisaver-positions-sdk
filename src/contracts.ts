import Web3 from 'web3';
import {AbiItem} from 'web3-utils';
import configRaw from './config/contracts'
import { BaseContract } from './types/contracts/generated/types';
import * as ContractTypes from './types/contracts/generated';
import {NetworkNumber} from "./types/common";

export type ConfigKey = keyof typeof configRaw;

declare type ContractConfig = {
  abi: any[],
  networks: Record<NetworkNumber, Network>,
};
declare type Network = {
  createdBlock?:number,
  address:string
};
const ContractConfig:Record<ConfigKey, ContractConfig> = configRaw
export const getConfigContractAddress = (name: ConfigKey, network: NetworkNumber): string => ContractConfig[name].networks[network]?.address;

const createContractFromConfigFunc = <T extends BaseContract>(name: ConfigKey, _address?: string) => (web3: Web3, network: NetworkNumber) => {
  const address = _address || getConfigContractAddress(name, network);
  return new web3.eth.Contract(ContractConfig[name].abi, address) as any as T;
};

export const AaveV3ViewContract = createContractFromConfigFunc<ContractTypes.AaveV3View>('AaveV3View');
