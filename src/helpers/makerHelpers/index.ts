import Dec from 'decimal.js';
import { SECONDS_PER_YEAR } from '../../constants';
import { bytesToString } from '../../services/utils';

export const parseCollateralInfo = (
  ilk: string,
  _par: string,
  _mat: string,
  _art: string,
  _rate: string,
  _spot: string,
  _line: string,
  _duty: string,
  _futureRate: string,
  _chop: string,
) => {
  const par = new Dec(_par).div(1e27).toString();
  const mat = new Dec(_mat).div(1e27).toString();
  const art = new Dec(_art).toString();
  const rate = new Dec(_rate).toString();
  const spot = new Dec(_spot).div(1e27).toString();
  const line = new Dec(_line).div(1e45).toString();
  const dust = new Dec(_rate).div(1e45).toString();
  const duty = new Dec(_duty).toString();
  const futureRate = new Dec(_futureRate).toString();
  const chop = new Dec(_chop).div(1e18).toString();

  const stabilityFee = new Dec(duty.toString())
    .div(1e27)
    .pow(SECONDS_PER_YEAR)
    .minus(1)
    .mul(100)
    .toNumber();
  const liquidationFee = new Dec(chop).mul(100).sub(100).toString();
  const globalDebtCurrent = new Dec(art).div(1e18).mul(new Dec(futureRate).div(1e27)).toString();
  const globalDebtCeiling = line;
  const creatableDebt = new Dec(globalDebtCeiling).sub(globalDebtCurrent).toString();

  return {
    ilkLabel: bytesToString(ilk),
    currentRate: rate,
    futureRate,
    minDebt: dust,
    globalDebtCurrent,
    globalDebtCeiling,
    assetPrice: new Dec(spot).times(par).times(mat).toString(),
    liqRatio: mat,
    liqPercent: +mat * 100,
    stabilityFee,
    liquidationFee: new Dec(liquidationFee).lt(0) ? '0' : liquidationFee,
    creatableDebt,
  };
};