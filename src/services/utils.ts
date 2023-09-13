import { NetworkNumber } from '../types/common';

export const isLayer2Network = (networkId: NetworkNumber) => [10, 42161, 8453].includes(+networkId);

export const addToObjectIf = (condition: any, item: any) => (condition ? item : {});

export const ethToWeth = (maybeEth: any) => maybeEth?.replace(/^ETH$/, 'WETH');

export const wethToEth = (maybeWeth: any) => maybeWeth?.replace(/^WETH$/, 'ETH');

export const stEthToWstEth = (maybeStEth: any) => maybeStEth?.replace(/^stETH$/, 'wstETH');

export const wstEthToStEth = (maybeStEth: any) => maybeStEth?.replace(/^wstETH$/, 'stETH');
