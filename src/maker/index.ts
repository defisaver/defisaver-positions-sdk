import Dec from 'decimal.js';
import {
  assetAmountInEth, bytesToString, getAssetInfo, ilkToAsset,
} from '@defisaver/tokens';
import { Client, PublicClient } from 'viem';
import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  getConfigContractAddress, McdDogContractViem, McdGetCdpsContractViem, McdJugContractViem, McdSpotterContractViem, McdVatContractViem, McdViewContractViem,
} from '../contracts';
import { CdpData, CdpInfo, CdpType } from '../types';
import { wethToEth } from '../services/utils';
import { parseCollateralInfo } from '../helpers/makerHelpers';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

export const _getMakerAccountBalances = async (provider: PublicClient, network: NetworkNumber, block: Blockish, addressMapping: boolean, cdpId: string, _managerAddress?: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };
  const managerAddress = _managerAddress || '0x5ef30b9986345249bc32d8928B7ee64DE9435E39'; // Default CDP Manager (This is used only to differentiate BProtocol CDPs)

  if (!cdpId) {
    return balances;
  }

  const viewContract = McdViewContractViem(provider, network, block);
  const vatContract = McdVatContractViem(provider, network, block);
  const spotterContract = McdSpotterContractViem(provider, network, block);
  const dogContract = McdDogContractViem(provider, network, block);
  const jugContract = McdJugContractViem(provider, network, block);

  let ilk;

  const needsIlk = block !== 'latest' && new Dec(block).lt(14410792) && new Dec(block).gte(14384301);

  if (needsIlk) {
    ilk = (await viewContract.read.getUrnAndIlk([managerAddress, BigInt(cdpId)], setViemBlockNumber(block)))[1];
  }

  // @ts-ignore
  // [urn, owner, userAddr, ilk, collateral, debt]
  const cdpInfo: any = await viewContract.read.getCdpInfo((needsIlk ? [managerAddress, cdpId, ilk] : [cdpId]), setViemBlockNumber(block));
  cdpInfo.ilk = cdpInfo[3];

  const [
    par,
    [_, mat],
    [artGlobal, rate, spot, line],
    [duty],
    futureRate,
    chop,
  ] = await Promise.all([
    spotterContract.read.par(setViemBlockNumber(block)),
    spotterContract.read.ilks(needsIlk ? [ilk] : [cdpInfo.ilk], setViemBlockNumber(block)),
    vatContract.read.ilks(needsIlk ? [ilk] : [cdpInfo.ilk], setViemBlockNumber(block)),
    jugContract.read.ilks(needsIlk ? [ilk] : [cdpInfo.ilk], setViemBlockNumber(block)),
    jugContract.read.drip(needsIlk ? [ilk] : [cdpInfo.ilk], setViemBlockNumber(block)),
    dogContract.read.chop(needsIlk ? [ilk] : [cdpInfo.ilk], setViemBlockNumber(block)),
  ]);

  const ilkInfo = parseCollateralInfo(
    needsIlk ? ilk : cdpInfo.ilk,
    par.toString(),
    mat.toString(),
    artGlobal.toString(),
    rate.toString(),
    spot.toString(),
    line.toString(),
    duty.toString(),
    futureRate.toString(),
    chop.toString(),
  );


  const collateral = cdpInfo[4];
  const debt = cdpInfo[5];

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

export const getMakerAccountBalances = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  cdpId: string,
  _managerAddress?: EthAddress,
): Promise<PositionBalances> => _getMakerAccountBalances(getViemProvider(provider, network, { batch: { multicall: true } }), network, block, addressMapping, cdpId, _managerAddress);

export const _getUserCdps = async (provider: Client, network: NetworkNumber, userAddress: EthAddress): Promise<CdpInfo[]> => {
  if (!userAddress) return [];
  const mcdGetCdpsContract = McdGetCdpsContractViem(provider, network);

  const mcdCdpManagerAddress = getConfigContractAddress('McdCdpManager', network);

  const standardCdps = await mcdGetCdpsContract.read.getCdpsAsc([mcdCdpManagerAddress, userAddress]);

  const parsedStandardCdps = standardCdps[0].map((id, i) => ({
    id: parseInt(id.toString(), 10),
    ilk: standardCdps[2][i].toLowerCase() as EthAddress, // collateral type
    ilkLabel: bytesToString(standardCdps[2][i].toLowerCase()),
    urn: standardCdps[1][i].toLowerCase() as EthAddress, // contract of cdp
    asset: ilkToAsset(standardCdps[2][i]),
    type: CdpType.MCD,
    owner: userAddress,
  }));

  return parsedStandardCdps;
};

export const getUserCdps = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  userAddress: EthAddress,
): Promise<CdpInfo[]> => _getUserCdps(getViemProvider(provider, network), network, userAddress);

export const _getMakerCdpData = async (provider: Client, network: NetworkNumber, cdp: CdpInfo): Promise<CdpData> => {
  const vatContract = McdVatContractViem(provider, network);
  const spotterContract = McdSpotterContractViem(provider, network);
  const dogContract = McdDogContractViem(provider, network);
  const jugContract = McdJugContractViem(provider, network);

  const [
    [ink, art],
    coll,
    par,
    [_, mat],
    [artGlobal, rate, spot, line],
    [duty],
    futureRate,
    chop,
  ] = await Promise.all([
    vatContract.read.urns([cdp.ilk, cdp.urn]),
    vatContract.read.gem([cdp.ilk, cdp.urn]),
    spotterContract.read.par(),
    spotterContract.read.ilks([cdp.ilk]),
    vatContract.read.ilks([cdp.ilk]),
    jugContract.read.ilks([cdp.ilk]),
    jugContract.read.drip([cdp.ilk]),
    dogContract.read.chop([cdp.ilk]),
  ]);

  const collInfo = parseCollateralInfo(
    cdp.ilk,
    par.toString(),
    mat.toString(),
    artGlobal.toString(),
    rate.toString(),
    spot.toString(),
    line.toString(),
    duty.toString(),
    futureRate.toString(),
    chop.toString(),
  );

  const collateral = assetAmountInEth(ink.toString(), cdp.asset);

  const collateralUsd = new Dec(collateral).mul(collInfo.assetPrice).toString();
  const debt = new Dec(art).times(collInfo.currentRate).div(1e27).floor()
    .toString();
  const futureDebt = new Dec(art).times(collInfo.futureRate).div(1e27).floor()
    .toString(); // after drip
  const liquidationPrice = new Dec(debt).times(collInfo.liqRatio).div(ink).toString();

  let ratio = new Dec(ink).times(collInfo.assetPrice).div(debt).times(100)
    .toString();
  if (new Dec(debt).eq(0)) ratio = '0';

  const debtTooLow = new Dec(debt).gt(0) && new Dec(assetAmountInEth(debt, 'DAI')).lt(collInfo.minDebt);

  return {
    owner: cdp.owner,
    id: cdp.id.toString(),
    urn: cdp.urn,
    type: CdpType.MCD,
    ilk: cdp.ilk,
    ilkLabel: collInfo.ilkLabel,
    asset: cdp.asset,
    collateral,
    collateralUsd,
    futureDebt: assetAmountInEth(futureDebt, 'DAI'),
    debtDai: assetAmountInEth(debt, 'DAI'),
    debtUsd: assetAmountInEth(debt, 'DAI'),
    debtInAsset: assetAmountInEth(debt, 'DAI'),
    debtAssetPrice: '1',
    debtAssetMarketPrice: '1',
    liquidationPrice,
    ratio,
    liqRatio: collInfo.liqRatio.toString(),
    liqPercent: parseFloat(collInfo.liqPercent.toString()),
    assetPrice: collInfo.assetPrice,
    daiLabel: 'DAI',
    debtAsset: 'DAI',
    unclaimedCollateral: assetAmountInEth(coll.toString(), cdp.asset),
    debtTooLow,
    minDebt: collInfo.minDebt,
    stabilityFee: collInfo.stabilityFee,
    creatableDebt: collInfo.creatableDebt,
    globalDebtCeiling: collInfo.globalDebtCeiling,
    globalDebtCurrent: collInfo.globalDebtCurrent,
    liquidationFee: collInfo.liquidationFee,
    lastUpdated: Date.now(),
  };
};

export const getMakerCdpData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  cdp: CdpInfo,
): Promise<CdpData> => _getMakerCdpData(getViemProvider(provider, network), network, cdp);