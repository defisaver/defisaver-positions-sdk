import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo, ilkToAsset } from '@defisaver/tokens';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import { McdViewContract } from '../contracts';
import { makerHelpers } from '../helpers';
import { CdpData } from '../types';
import { wethToEth } from '../services/utils';

export const getMakerAccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, cdpId: string, _managerAddress?: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };
  const managerAddress = _managerAddress || '0x5ef30b9986345249bc32d8928B7ee64DE9435E39'; // Default CDP Manager (This is used only to differentiate BProtocol CDPs)

  if (!cdpId) {
    return balances;
  }

  const viewContract = McdViewContract(web3, network, block);

  let ilk;

  const needsIlk = block !== 'latest' && new Dec(block).lt(14410792) && new Dec(block).gte(14384301);

  if (needsIlk) {
    ilk = (await viewContract.methods.getUrnAndIlk(managerAddress, cdpId).call({}, block)).ilk;
  }

  // @ts-ignore
  const cdpInfo = await viewContract.methods.getCdpInfo(...(needsIlk ? [managerAddress, cdpId, ilk] : [cdpId])).call({}, block);
  const ilkInfo = await makerHelpers.getCollateralInfo(needsIlk ? ilk : cdpInfo.ilk, web3, network, block);


  const collateral = needsIlk ? cdpInfo[1] : cdpInfo.collateral;
  const debt = needsIlk ? cdpInfo[0] : cdpInfo.debt;

  const asset = wethToEth(ilkToAsset(needsIlk ? ilk : cdpInfo.ilk));

  balances = {
    collateral: {
      [addressMapping ? getAssetInfo(asset, network).address.toLowerCase() : asset]: asset === 'WBTC' ? new Dec(collateral).div(1e10).floor().toString() : collateral,
    },
    debt: {
      [addressMapping ? getAssetInfo('DAI', network).address.toLowerCase() : 'DAI']: new Dec(debt).times(ilkInfo.currentRate).div(1e27).floor()
        .toString(),
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
