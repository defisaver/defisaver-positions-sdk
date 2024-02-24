import Dec from 'decimal.js';
import { getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import { NetworkNumber } from '../types/common';

export const isLayer2Network = (networkId: NetworkNumber) => [10, 42161, 8453].includes(+networkId);

export const addToObjectIf = (condition: any, item: any) => (condition ? item : {});

export const ethToWeth = (maybeEth: any) => maybeEth?.replace(/^ETH$/, 'WETH');

export const wethToEth = (maybeWeth: any) => maybeWeth?.replace(/^WETH$/, 'ETH');

export const stEthToWstEth = (maybeStEth: any) => maybeStEth?.replace(/^stETH$/, 'wstETH');

export const wstEthToStEth = (maybeStEth: any) => maybeStEth?.replace(/^wstETH$/, 'stETH');

export const getAbiItem = (abi: any, methodName: string) => abi.find((i: any) => i.name === methodName);

export const ADDRESS_REGEX = /0x[0-9a-fA-F]{40}/;
export const isAddress = (address: string) => typeof address === 'string' && (new RegExp(ADDRESS_REGEX).test(address));

export const compareAddresses = (addr1 = '', addr2 = '') => addr1.toLowerCase() === addr2.toLowerCase();

export const getWeiAmountForDecimals = (amount: string | number, decimals: number) => new Dec(amount).mul(10 ** decimals).floor().toString();

export const getEthAmountForDecimals = (amount: string | number, decimals: string | number) => new Dec(amount).div(10 ** +decimals).toString();

export const handleWbtcLegacy = (asset: string) => (asset === 'WBTC Legacy' ? 'WBTC' : asset);

export const wethToEthByAddress = (maybeWethAddr: string, chainId = NetworkNumber.Eth) => getAssetInfo(wethToEth(getAssetInfoByAddress(maybeWethAddr, chainId).symbol), chainId).address;

export const ethToWethByAddress = (maybeEthAddr: string, chainId = NetworkNumber.Eth) => getAssetInfo(ethToWeth(getAssetInfoByAddress(maybeEthAddr, chainId).symbol), chainId).address;

export const bytesToString = (hex: string) => Buffer.from(hex.replace(/^0x/, ''), 'hex')
  .toString()
  // eslint-disable-next-line no-control-regex
  .replace(/\x00/g, '');

/**
 * Map an input value from one range (minInput, maxInput) to a value in another range (minOutput, maxOutput)
 */
export const mapRange = (input: number | string, minInput: number | string, maxInput: number | string, minOutput:number | string, maxOutput: number | string) => {
  // slope = 1.0 * (output_end - output_start) / (input_end - input_start)
  const inputDiff = new Dec(maxInput).minus(minInput);
  const outputDiff = new Dec(maxOutput).minus(minOutput);
  const slope = new Dec(outputDiff).div(inputDiff);

  // output = output_start + slope * (input - input_start)
  return new Dec(minOutput).plus(new Dec(slope).mul(new Dec(input).minus(minInput))).toDP(2).toNumber();
};

