import { UniMulticallContract } from '../contracts';
import { NetworkNumber } from '../types/common';
import { getWeb3 } from '../web3';

export const multicall = async (calls: any[], network: NetworkNumber, blockNumber: 'latest' | number = 'latest') => {
  const web3 = getWeb3(network);
  const multicallContract = UniMulticallContract(web3, network);
  const formattedCalls = calls.map((call) => {
    const callData = web3.eth.abi.encodeFunctionCall(call.abiItem, call.params);
    return { callData, target: call.target || '0x0', gasLimit: call.gasLimit || 1e6 };
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