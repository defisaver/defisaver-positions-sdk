import Dec from 'decimal.js';
import { CrvUSDAggregatedPositionData, CrvUSDMarketData, CrvUSDUsedAssets } from '../../types';
import { NetworkNumber } from '../../types/common';
import { getAssetsTotal } from '../../moneymarket';
import { mapRange } from '../../services/utils';

export const getCrvUsdAggregatedData = ({
  loanExists, usedAssets, network, selectedMarket, numOfBands, ...rest
}:{
  loanExists: boolean, usedAssets: CrvUSDUsedAssets, network: NetworkNumber, selectedMarket: CrvUSDMarketData, numOfBands: number | string
}): CrvUSDAggregatedPositionData => {
  const _supplied = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ supplied }: { supplied: string }) => supplied); // this is wrong if we are in soft-liquidations
  const _borrowed = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowed }: { borrowed: string }) => borrowed);
  const _suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  const _borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);

  const ratio = loanExists
    ? new Dec(_suppliedUsd)
      .dividedBy(_borrowedUsd)
      .times(100)
      .toString()
    : '0';

  const minAllowedRatio = mapRange(numOfBands, 4, 50, 115, 140);
  // we don't have borrowLimitUsd here

  return {
    ratio,
    supplied: _supplied,
    suppliedUsd: _suppliedUsd,
    borrowedUsd: _borrowedUsd,
    borrowed: _borrowed,
    safetyRatio: ratio,
    borrowLimitUsd: '0',
    minAllowedRatio,
  };
};