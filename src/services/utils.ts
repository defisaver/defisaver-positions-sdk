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