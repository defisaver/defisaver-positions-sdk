import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, ilkToAsset } from '@defisaver/tokens';
import { Blockish, NetworkNumber, PositionBalances } from '../types/common';
import { McdViewContract } from '../contracts';
import { makerHelpers } from '../helpers';
import { CdpData } from '../types';

export const getMakerAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, cdpId: string): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!cdpId) {
    return balances;
  }

  const viewContract = McdViewContract(web3, network);
  // @ts-ignore
  const cdpInfo = await viewContract.methods.getCdpInfo(cdpId).call({}, block);
  const ilkInfo = await makerHelpers.getCollateralInfo(cdpInfo.ilk, web3, network, block);

  const asset = ilkToAsset(cdpInfo.ilk);

  balances = {
    collateral: {
      [asset]: assetAmountInEth(cdpInfo.collateral, `MCD-${asset}`),
    },
    debt: {
      DAI: assetAmountInEth(new Dec(cdpInfo.debt).times(ilkInfo.currentRate).div(1e27).floor().toString(), 'DAI'),
    },
  };

  return balances;
};

export const getMakerCdpData = async (web3: Web3, network: NetworkNumber, cdpId: string): Promise<CdpData> => {
  const viewContract = McdViewContract(web3, network);

  // @ts-ignore
  const cdpInfo = await viewContract.methods.getCdpInfo(cdpId).call();

  const [ilkInfo, coll] = await Promise.all([
    makerHelpers.getCollateralInfo(cdpInfo.ilk, web3, network),
    makerHelpers.getUnclaimedCollateral(web3, network, cdpInfo.urn, cdpInfo.ilk),
  ]);

  const asset = ilkToAsset(cdpInfo.ilk);

  const collateralUsd = new Dec(cdpInfo.collateral).mul(ilkInfo.assetPrice).floor().toString();
  const debt = new Dec(cdpInfo.debt).times(ilkInfo.currentRate).div(1e27).floor()
    .toString();
  const futureDebt = new Dec(cdpInfo.debt).times(ilkInfo.futureRate).div(1e27).floor()
    .toString(); // after drip
  const debtDripDelta = assetAmountInEth(new Dec(futureDebt).sub(debt).toString(), 'DAI');
  const liquidationPrice = new Dec(debt).times(ilkInfo.liqRatio).div(cdpInfo.collateral).toString();

  let ratio = new Dec(cdpInfo.collateral).times(ilkInfo.assetPrice).div(debt).times(100)
    .toString();
  if (new Dec(debt).eq(0)) ratio = '0';

  const debtTooLow = new Dec(debt).gt(0) && new Dec(assetAmountInEth(debt, 'DAI')).lt(ilkInfo.minDebt);

  const par = '1';
  return {
    owner: cdpInfo.owner,
    userAddress: cdpInfo.userAddr,
    id: cdpId,
    urn: cdpInfo.urn,
    type: 'mcd',
    ilk: cdpInfo.ilk,
    ilkLabel: ilkInfo.ilkLabel,
    asset,
    collateral: assetAmountInEth(cdpInfo.collateral, `MCD-${asset}`),
    collateralUsd: assetAmountInEth(collateralUsd, `MCD-${asset}`),
    futureDebt: assetAmountInEth(futureDebt, 'DAI'),
    debtDai: assetAmountInEth(debt, 'DAI'),
    debtUsd: assetAmountInEth(debt, 'DAI'),
    debtInAsset: assetAmountInEth(debt, 'DAI'),
    debtAssetPrice: par,
    debtAssetMarketPrice: par,
    liquidationPrice,
    ratio,
    liqRatio: ilkInfo.liqRatio.toString(),
    liqPercent: parseFloat(ilkInfo.liqPercent.toString()),
    assetPrice: ilkInfo.assetPrice,
    daiLabel: 'DAI',
    debtAsset: 'DAI',
    unclaimedCollateral: assetAmountInEth(coll, asset),
    debtTooLow,
    minDebt: ilkInfo.minDebt,
    stabilityFee: ilkInfo.stabilityFee,
    creatableDebt: ilkInfo.creatableDebt,
    globalDebtCeiling: ilkInfo.globalDebtCeiling,
    globalDebtCurrent: ilkInfo.globalDebtCurrent,
    liquidationFee: ilkInfo.liquidationFee,
    lastUpdated: Date.now(),
  };
};