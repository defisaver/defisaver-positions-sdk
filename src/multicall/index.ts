import Web3 from 'web3';
import { chunk } from 'lodash';
import { UniMulticallContract } from '../contracts';
import { NetworkNumber } from '../types/common';

export const multicall = async (calls: any[], web3: Web3, network: NetworkNumber = NetworkNumber.Eth, blockNumber: 'latest' | number = 'latest') => {
  const multicallContract = UniMulticallContract(web3, network);
  const formattedCalls = calls.map((call) => {
    const callData = web3.eth.abi.encodeFunctionCall(call.abiItem, call.params);
    return { callData, target: call.target || '0x0', gasLimit: call.gasLimit || 1200000 };
  });
  const callResult = await multicallContract.methods.multicall(formattedCalls.filter(item => item.target !== '0x0')).call({}, blockNumber);

  let formattedResult: any[] = [];

  callResult.returnData.forEach(([success, gasUsed, result], i) => {
    const formattedRes = result !== '0x'
      ? web3.eth.abi.decodeParameters(calls[i].abiItem.outputs, result)
      : undefined;
    formattedResult = [...formattedResult, formattedRes];
  });

  return formattedResult;
};

export const chunkAndMulticall = async (calls: any[], chunkSize: number, blockNumber: 'latest' | number = 'latest', web3: Web3, network: NetworkNumber = NetworkNumber.Eth) => {
  const chunkedCalls = chunk(calls, chunkSize);

  // @ts-ignore
  const results = await Promise.all(chunkedCalls.map((cnk) => multicall(cnk, web3, network, blockNumber)));

  return results.flat(1);
};
