import { NetworkNumber } from '../../types/common';
import { EulerV2Market, EulerV2Versions } from '../../types';

export const eUSDC2 = (networkId: NetworkNumber): EulerV2Market => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Euler Prime USDC',
  shortLabel: 'eUSDC-2',
  value: EulerV2Versions.eUSDC2,
  asset: 'USDC',
  secondLabel: 'Market',
  marketAddress: '0x797DD80692c3b2dAdabCe8e30C07fDE5307D48a9',
});

export const eUSDC8 = (networkId: NetworkNumber): EulerV2Market => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Stablecoin Maxi USDC',
  shortLabel: 'eUSDC-8',
  value: EulerV2Versions.eUSDC8,
  asset: 'USDC',
  secondLabel: 'Market',
  marketAddress: '0xce45EF0414dE3516cAF1BCf937bF7F2Cf67873De',
});

export const eWETH2 = (networkId: NetworkNumber): EulerV2Market => ({
  chainIds: [NetworkNumber.Eth],
  label: 'Euler Prime WETH',
  shortLabel: 'eWETH-2',
  value: EulerV2Versions.eWETH2,
  asset: 'WETH',
  secondLabel: 'Market',
  marketAddress: '0xD8b27CF359b7D15710a5BE299AF6e7Bf904984C2',
});

export const EulerV2Markets = (networkId: NetworkNumber) => ({
  [EulerV2Versions.eUSDC2]: eUSDC2(networkId),
  [EulerV2Versions.eUSDC8]: eUSDC8(networkId),
  [EulerV2Versions.eWETH2]: eWETH2(networkId),
}) as const;