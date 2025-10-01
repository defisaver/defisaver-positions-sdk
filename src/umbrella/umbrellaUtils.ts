export enum UmbrellaStaking {
  UmbrellaGHO = 'UmbrellaGHO',
  UmbrellaUSDC = 'UmbrellaUSDC',
  UmbrellaUSDT = 'UmbrellaUSDT',
  UmbrellaETH = 'UmbrellaETH',
}

export const tokenMapping = {
  [UmbrellaStaking.UmbrellaUSDC]: '0x6bf183243FdD1e306ad2C4450BC7dcf6f0bf8Aa6',
  [UmbrellaStaking.UmbrellaUSDT]: '0xA484Ab92fe32B143AEE7019fC1502b1dAA522D31',
  [UmbrellaStaking.UmbrellaETH]: '0xaAFD07D53A7365D3e9fb6F3a3B09EC19676B73Ce',
  [UmbrellaStaking.UmbrellaGHO]: '0x4f827A63755855cDf3e8f3bcD20265C833f15033',
} as const;

// ----- chat gpt code for result mapping ---------
export const normalize = (addr?: string) => addr?.toLowerCase?.() ?? '';

export const tokenEntries = Object.entries(tokenMapping).map(([symbol, address]) => [
  symbol,
  normalize(address),
]);

// 👇 Define how to extract the token address from each source type
export const extractAddress = (item?: { stakeToken?: string, stkToken?: string, stakeTokenData?: { token?: string } }): string => normalize(item?.stakeToken
        || item?.stkToken
        || item?.stakeTokenData?.token,
);

// 👇 Utility to find the matching object in a dataset
export const findMatching = (dataset: any[], targetAddr: string) => dataset.find((item) => extractAddress(item) === targetAddr);