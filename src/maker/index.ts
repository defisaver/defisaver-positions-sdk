import Web3 from 'web3';
import Dec from 'decimal.js';
import {
  assetAmountInEth, bytesToString, getAssetInfo, ilks, ilkToAsset,
} from '@defisaver/tokens';
import { Client, createPublicClient } from 'viem';
import {
  Blockish, EthAddress, HexString, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  getConfigContractAddress, McdDogContractViem, McdGetCdpsContractViem, McdJugContractViem, McdSpotterContractViem, McdVatContractViem, McdViewContract, McdViewContractViem,
} from '../contracts';
import { makerHelpers } from '../helpers';
import { CdpData, CdpInfo, CdpType } from '../types';
import { wethToEth } from '../services/utils';
import { parseCollateralInfo } from '../helpers/makerHelpers';

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

export const _getUserCdps = async (provider: Client, network: NetworkNumber, userAddress: HexString): Promise<CdpInfo[]> => {
  if (!userAddress) return [];
  const mcdGetCdpsContract = McdGetCdpsContractViem(provider, network);

  const mcdCdpManagerAddress = getConfigContractAddress('McdCdpManager', network);

  const standardCdps = await mcdGetCdpsContract.read.getCdpsAsc([mcdCdpManagerAddress, userAddress]);

  const parsedStandardCdps = standardCdps[0].map((id, i) => ({
    id: parseInt(id.toString(), 10),
    ilk: standardCdps[2][i].toLowerCase() as HexString, // collateral type
    ilkLabel: bytesToString(standardCdps[2][i].toLowerCase()),
    urn: standardCdps[1][i].toLowerCase() as HexString, // contract of cdp
    asset: ilkToAsset(standardCdps[2][i]),
    type: CdpType.MCD,
    owner: userAddress,
  }));

  return parsedStandardCdps;
};

export const getUserCdps = async (web3: Web3, network: NetworkNumber, userAddress: HexString): Promise<CdpInfo[]> => {
  const client = createPublicClient({
    // @ts-ignore
    transport: http(web3._provider.host),
  });

  return _getUserCdps(client, network, userAddress);
};

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
  const cdpDebt = assetAmountInEth(art.toString(), 'DAI');

  const collateralUsd = new Dec(collateral).mul(collInfo.assetPrice).floor().toString();
  const debt = new Dec(cdpDebt).times(collInfo.currentRate).div(1e27).floor()
    .toString();
  const futureDebt = new Dec(cdpDebt).times(collInfo.futureRate).div(1e27).floor()
    .toString(); // after drip
  const liquidationPrice = new Dec(debt).times(collInfo.liqRatio).div(collateral).toString();

  let ratio = new Dec(collateral).times(collInfo.assetPrice).div(debt).times(100)
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

export const getMakerCdpData = async (web3: Web3, network: NetworkNumber, cdp: CdpInfo): Promise<CdpData> => {
  const client = createPublicClient({
    // @ts-ignore
    transport: http(web3._provider.host),
  });
  return _getMakerCdpData(client, network, cdp);
};