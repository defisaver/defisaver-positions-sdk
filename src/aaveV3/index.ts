import Web3 from "web3";
import {AaveV3ViewContract} from "../contracts";
import {NetworkNumber} from "../types/common";
import { AaveMarketInfo, AaveVersions } from '../types/aaveV3';

export const AaveMarkets: AaveMarketInfo[] = [];

export const test = (web3: Web3, network: NetworkNumber) => {
  const contract = AaveV3ViewContract(web3, 1);
  return contract.methods.AAVE_REFERRAL_CODE().call()
}
