import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  LiquityActivePoolContract, LiquityCollSurplusPoolContract, LiquityPriceFeedContract, LiquityTroveManagerContract, LiquityViewContract,
} from '../contracts';
import { multicall } from '../multicall';
import { LIQUITY_TROVE_STATUS_ENUM, LiquityTroveInfo } from '../types';
import { ZERO_ADDRESS } from '../constants';

export const LIQUITY_NORMAL_MODE_RATIO = 110; // MCR
export const LIQUITY_RECOVERY_MODE_RATIO = 150; // CCR

export const getLiquityAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const viewContract = LiquityViewContract(web3, network, block);
  const troveInfo = await viewContract.methods.getTroveInfo(address).call({}, block);

  balances = {
    collateral: {
      [addressMapping ? getAssetInfo('ETH', network).address.toLowerCase() : 'ETH']: troveInfo[1],
    },
    debt: {
      [addressMapping ? getAssetInfo('LUSD', network).address.toLowerCase() : 'LUSD']: troveInfo[2],
    },
  };

  return balances;
};

const _getDebtInFront = async (viewContract: any, address: string, accumulatedSum = '0', iterations = 2000) => viewContract.methods.getDebtInFront(address, accumulatedSum, iterations).call();

export const getDebtInFront = async (viewContract: any, address: string, accumulatedSum = '0', iterations = 2000): Promise<string> => {
  const { debt, next } = await _getDebtInFront(viewContract, address, accumulatedSum, iterations);
  if (next === ZERO_ADDRESS) return assetAmountInEth(debt, 'LUSD');
  return getDebtInFront(viewContract, next, debt, iterations);
};

export const getLiquityTroveInfo = async (web3: Web3, network: NetworkNumber, address: string): Promise<LiquityTroveInfo> => {
  const viewContract = LiquityViewContract(web3, network);
  const collSurplusPoolContract = LiquityCollSurplusPoolContract(web3, network);
  const troveManagerContract = LiquityTroveManagerContract(web3, network);
  const priceFeedContract = LiquityPriceFeedContract(web3, network);
  const activePoolContract = LiquityActivePoolContract(web3, network);

  const multicallData = [
    {
      target: viewContract.options.address,
      abiItem: viewContract.options.jsonInterface.find(({ name }) => name === 'getTroveInfo'),
      params: [address],
    },
    {
      target: collSurplusPoolContract.options.address,
      abiItem: collSurplusPoolContract.options.jsonInterface.find(({ name }) => name === 'getCollateral'),
      params: [address],
    },
    {
      target: troveManagerContract.options.address,
      abiItem: troveManagerContract.options.jsonInterface.find(({ name }) => name === 'getBorrowingRateWithDecay'),
      params: [],
    },
    {
      target: priceFeedContract.options.address,
      abiItem: priceFeedContract.options.jsonInterface.find(({ name }) => name === 'fetchPrice'),
      params: [],
    },
    {
      target: activePoolContract.options.address,
      abiItem: activePoolContract.options.jsonInterface.find(({ name }) => name === 'getETH'),
      params: [],
    },
    {
      target: activePoolContract.options.address,
      abiItem: activePoolContract.options.jsonInterface.find(({ name }) => name === 'getLUSDDebt'),
      params: [],
    },
  ];

  const [multiRes, debtInFront] = await Promise.all([
    multicall(multicallData, web3, network),
    getDebtInFront(viewContract, address),
  ]);

  const recoveryMode = multiRes[0][6];
  const totalETH = multiRes[4][0];
  const totalLUSD = multiRes[5][0];

  const payload = {
    troveStatus: LIQUITY_TROVE_STATUS_ENUM[+multiRes[0][0].toString()],
    collateral: assetAmountInEth(multiRes[0][1]),
    debtInAsset: assetAmountInEth(multiRes[0][2]),
    TCRatio: assetAmountInEth(multiRes[0][4]),
    recoveryMode,
    claimableCollateral: assetAmountInEth(multiRes[1][0]),
    borrowingRateWithDecay: assetAmountInEth(multiRes[2][0]),
    assetPrice: assetAmountInEth(multiRes[3][0]),
    totalETH,
    totalLUSD,
    debtInFront,
    minCollateralRatio: recoveryMode ? LIQUITY_RECOVERY_MODE_RATIO : LIQUITY_NORMAL_MODE_RATIO,
    priceForRecovery: new Dec(recoveryMode ? LIQUITY_RECOVERY_MODE_RATIO : LIQUITY_NORMAL_MODE_RATIO).mul(totalLUSD).div(totalETH).div(100)
      .toString(),
  };

  return payload;
};