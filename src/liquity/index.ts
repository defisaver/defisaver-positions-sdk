import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { Client } from 'viem';
import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  LiquityActivePoolContractViem, LiquityCollSurplusPoolContractViem, LiquityPriceFeedContractViem, LiquityTroveManagerContractViem, LiquityViewContractViem,
} from '../contracts';
import { LIQUITY_TROVE_STATUS_ENUM, LiquityTroveInfo } from '../types';
import { ZERO_ADDRESS } from '../constants';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

export const LIQUITY_NORMAL_MODE_RATIO = 110; // MCR
export const LIQUITY_RECOVERY_MODE_RATIO = 150; // CCR

export const _getLiquityAccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const viewContract = LiquityViewContractViem(provider, network, block);
  const troveInfo = await viewContract.read.getTroveInfo([address], setViemBlockNumber(block));

  balances = {
    collateral: {
      [addressMapping ? getAssetInfo('ETH', network).address.toLowerCase() : 'ETH']: troveInfo[1].toString(),
    },
    debt: {
      [addressMapping ? getAssetInfo('LUSD', network).address.toLowerCase() : 'LUSD']: troveInfo[2].toString(),
    },
  };

  return balances;
};

export const getLiquityAccountBalances = async (provider: EthereumProvider, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => _getLiquityAccountBalances(getViemProvider(provider, network), network, block, addressMapping, address);

const _getDebtInFront = async (viewContract: any, address: EthAddress, accumulatedSum = '0', iterations = 2000): Promise<string> => {
  const res = await viewContract.read.getDebtInFront([address, accumulatedSum, iterations]);
  const debt = res[1].toString();
  const next = res[0];
  if (next === ZERO_ADDRESS) return assetAmountInEth(debt, 'LUSD');
  return _getDebtInFront(viewContract, next, debt, iterations);
};

export const getDebtInFront = async (provider: EthereumProvider, address: EthAddress): Promise<string> => {
  const client = getViemProvider(provider, NetworkNumber.Eth);
  const viewContract = LiquityViewContractViem(client, NetworkNumber.Eth);
  return _getDebtInFront(viewContract, address);
};

export const _getLiquityTroveInfo = async (provider: Client, network: NetworkNumber, address: EthAddress): Promise<LiquityTroveInfo> => {
  const viewContract = LiquityViewContractViem(provider, network);
  const collSurplusPoolContract = LiquityCollSurplusPoolContractViem(provider, network);
  const troveManagerContract = LiquityTroveManagerContractViem(provider, network);
  const priceFeedContract = LiquityPriceFeedContractViem(provider, network);
  const activePoolContract = LiquityActivePoolContractViem(provider, network);

  const [
    troveInfo,
    collSurplusInfo,
    borrowingRateWithDecay,
    assetPrice,
    totalETH,
    totalLUSD,
    debtInFront,
  ] = await Promise.all([
    viewContract.read.getTroveInfo([address]),
    collSurplusPoolContract.read.getCollateral([address]),
    troveManagerContract.read.getBorrowingRateWithDecay(),
    priceFeedContract.read.fetchPrice(),
    activePoolContract.read.getETH(),
    activePoolContract.read.getLUSDDebt(),
    _getDebtInFront(viewContract, address),
  ]);

  const recoveryMode = troveInfo[6];

  const payload = {
    troveStatus: LIQUITY_TROVE_STATUS_ENUM[+(troveInfo[0].toString())],
    collateral: assetAmountInEth(troveInfo[1].toString()),
    debtInAsset: assetAmountInEth(troveInfo[2].toString()),
    TCRatio: assetAmountInEth(troveInfo[4].toString()),
    recoveryMode,
    claimableCollateral: assetAmountInEth(collSurplusInfo.toString()),
    borrowingRateWithDecay: assetAmountInEth(borrowingRateWithDecay.toString()),
    assetPrice: assetAmountInEth(assetPrice.toString()),
    totalETH: totalETH.toString(),
    totalLUSD: totalLUSD.toString(),
    debtInFront: debtInFront.toString(),
    minCollateralRatio: recoveryMode ? LIQUITY_RECOVERY_MODE_RATIO : LIQUITY_NORMAL_MODE_RATIO,
    priceForRecovery: new Dec(recoveryMode ? LIQUITY_RECOVERY_MODE_RATIO : LIQUITY_NORMAL_MODE_RATIO).mul(totalLUSD).div(totalETH).div(100)
      .toString(),
  };

  return payload;
};

export const getLiquityTroveInfo = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress): Promise<LiquityTroveInfo> => _getLiquityTroveInfo(getViemProvider(provider, network, { batch: { multicall: true } }), network, address);