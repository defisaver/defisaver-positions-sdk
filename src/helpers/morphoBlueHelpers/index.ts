import Dec from 'decimal.js';
import { assetAmountInWei, getAssetInfoByAddress } from '@defisaver/tokens';
import Web3 from 'web3';
import { calcLeverageLiqPrice, getAssetsTotal, isLeveragedPos } from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import { MMAssetsData, MMUsedAssets, NetworkNumber } from '../../types/common';
import {
  MorphoBlueAggregatedPositionData, MorphoBlueAssetsData, MorphoBlueMarketData, MorphoBlueMarketInfo,
  MorphoBluePublicAllocatorItem,
  MorphoBlueRealloactionMarketData,
} from '../../types';
import { borrowOperations, SECONDS_PER_YEAR, WAD } from '../../constants';
import { MorphoBlueViewContract } from '../../contracts';
import { MarketParamsStruct } from '../../types/contracts/generated/MorphoBlueView';
import { compareAddresses } from '../../services/utils';

export const getMorphoBlueAggregatedPositionData = ({ usedAssets, assetsData, marketInfo }: { usedAssets: MMUsedAssets, assetsData: MorphoBlueAssetsData, marketInfo: MorphoBlueMarketInfo }): MorphoBlueAggregatedPositionData => {
  const payload = {} as MorphoBlueAggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);

  const {
    lltv, oracle, collateralToken, loanToken,
  } = marketInfo;

  payload.borrowLimitUsd = getAssetsTotal(
    usedAssets,
    ({ isSupplied, collateral }: { isSupplied: boolean, collateral: string }) => isSupplied && collateral,
    ({ symbol, suppliedUsd }: { symbol: string, suppliedUsd: string }) => {
      const suppliedUsdAmount = suppliedUsd;

      return new Dec(suppliedUsdAmount).mul(lltv);
    },
  );
  payload.liquidationLimitUsd = payload.borrowLimitUsd;
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();

  payload.leftToBorrow = new Dec(usedAssets[collateralToken]?.supplied || 0).mul(oracle).mul(lltv).sub(usedAssets[loanToken]?.borrowed || 0)
    .toString();

  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData: assetsData as unknown as MMAssetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;

  payload.ltv = new Dec(payload.borrowedUsd).div(payload.suppliedCollateralUsd).toString();
  payload.ltv = new Dec(usedAssets[loanToken]?.borrowed || 0).div(oracle).div(usedAssets[collateralToken]?.supplied || 1).toString(); // default to 1 because can't div 0
  payload.ratio = new Dec(usedAssets[collateralToken]?.supplied || 0).mul(oracle).div(usedAssets[loanToken]?.borrowed || 1).mul(100)
    .toString();

  const { leveragedType, leveragedAsset } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedAsset].price;
    if (leveragedType === 'lsd-leverage') {
      // Treat ETH like a stablecoin in a long stETH position
      payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedAsset].price).div(assetsData.ETH.price).toDP(18).toString();
      assetPrice = new Dec(assetPrice).div(assetsData.ETH.price).toString();
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }

  return payload;
};

const compound = (ratePerSeconds: string) => {
  const compounding = new Dec(ratePerSeconds).mul(SECONDS_PER_YEAR).toString();
  const apyNumber = Math.expm1(new Dec(compounding).div(WAD).toNumber());
  return new Dec(apyNumber).mul(WAD).floor().toString();
};

export const getSupplyRate = (totalSupplyAssets: string, totalBorrowAssets: string, borrowRate: string, fee: string) => {
  if (totalBorrowAssets === '0' || totalSupplyAssets === '0') {
    return '0';
  }
  const utillization = new Dec(totalBorrowAssets).mul(WAD).div(totalSupplyAssets).ceil()
    .toString();
  const supplyRate = new Dec(utillization).mul(borrowRate).div(WAD).ceil()
    .toString();
  const ratePerSecond = new Dec(supplyRate).mul(new Dec(WAD).minus(fee)).div(WAD).ceil()
    .toString();
  return new Dec(compound(ratePerSecond)).div(1e18).mul(100).toString();
};

export const getBorrowRate = (borrowRate: string, totalBorrowShares: string) => {
  if (totalBorrowShares === '0') {
    return '0';
  }
  return new Dec(compound(borrowRate)).div(1e18).mul(100).toString();
};

export const getApyAfterValuesEstimation = async (selectedMarket: MorphoBlueMarketData, action: string, amount: string, asset: string, web3: Web3, network: NetworkNumber) => {
  const morphoBlueViewContract = MorphoBlueViewContract(web3, network);
  const lltvInWei = assetAmountInWei(selectedMarket.lltv, 'ETH');
  const marketData: MarketParamsStruct = [selectedMarket.loanToken, selectedMarket.collateralToken, selectedMarket.oracle, selectedMarket.irm, lltvInWei];
  const isBorrowOperation = borrowOperations.includes(action);
  const amountInWei = assetAmountInWei(amount, asset);
  let liquidityAdded;
  let liquidityRemoved;
  if (isBorrowOperation) {
    liquidityAdded = action === 'payback' ? amountInWei : '0';
    liquidityRemoved = action === 'borrow' ? amountInWei : '0';
  } else {
    liquidityAdded = action === 'collateral' ? amountInWei : '0';
    liquidityRemoved = action === 'withdraw' ? amountInWei : '0';
  }
  const data = await morphoBlueViewContract.methods.getApyAfterValuesEstimation([
    marketData,
    isBorrowOperation,
    liquidityAdded,
    liquidityRemoved,
  ]).call();
  const borrowRate = getBorrowRate(data.borrowRate, data.market.totalBorrowShares);
  const supplyRate = getSupplyRate(data.market.totalSupplyAssets, data.market.totalBorrowAssets, data.borrowRate, data.market.fee);
  return { borrowRate, supplyRate };
};

const API_URL = 'https://blue-api.morpho.org/graphql';
const MARKET_QUERY = `
  query MarketByUniqueKey($uniqueKey: String!, $chainId: Int!) {
      marketByUniqueKey(uniqueKey: $uniqueKey, chainId: $chainId) {
        reallocatableLiquidityAssets
        targetBorrowUtilization
        loanAsset {
          address
          decimals
          priceUsd
        }
        state {
          liquidityAssets
          borrowAssets
          supplyAssets
        }
        publicAllocatorSharedLiquidity {
          assets
          vault {
            address
            name
          }
          allocationMarket {
            uniqueKey
            loanAsset {
              address
            }
            collateralAsset {
              address
            }
            irmAddress
            oracle {
              address
            }
            lltv
          }
        }
        loanAsset {
          address
        }
        collateralAsset {
          address
        }
        oracle {
          address
        }
        irmAddress
        lltv  
      }
    }
`;

export const getReallocatableLiquidity = async (marketId: string, network: NetworkNumber = NetworkNumber.Eth): Promise<string> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: MARKET_QUERY,
      variables: { uniqueKey: marketId, chainId: network },
    }),
  });

  const data: { data: { marketByUniqueKey: MorphoBlueRealloactionMarketData } } = await response.json();
  const marketData: MorphoBlueRealloactionMarketData = data?.data?.marketByUniqueKey;

  if (!marketData) throw new Error('Market data not found');

  return marketData.reallocatableLiquidityAssets;
};

export const getReallocation = async (marketId: string, amountToBorrow: string, network: NetworkNumber = NetworkNumber.Eth) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: MARKET_QUERY,
      variables: { uniqueKey: marketId, chainId: network },
    }),
  });

  const data: { data: { marketByUniqueKey: MorphoBlueRealloactionMarketData } } = await response.json();
  const marketData: MorphoBlueRealloactionMarketData = data?.data?.marketByUniqueKey;

  if (!marketData) throw new Error('Market data not found');

  const newTotalBorrowAssets = new Dec(marketData.state.borrowAssets).add(amountToBorrow).toString();
  const leftToBorrow = new Dec(marketData.state.supplyAssets).sub(marketData.state.borrowAssets).toString();

  const newUtil = new Dec(newTotalBorrowAssets).div(marketData.state.supplyAssets).toString();
  const newUtilScaled = new Dec(newUtil).mul(1e18).toString();

  if (new Dec(newUtilScaled).lt(marketData.targetBorrowUtilization)) return { vaults: [], withdrawals: [] };

  let liquidityToAllocate = new Dec(newTotalBorrowAssets).div(marketData.targetBorrowUtilization).mul(1e18).sub(marketData.state.supplyAssets)
    .toFixed(0)
    .toString();

  if (new Dec(marketData.reallocatableLiquidityAssets).lt(liquidityToAllocate)) {
    liquidityToAllocate = new Dec(amountToBorrow).sub(leftToBorrow).toString();
    if (new Dec(marketData.reallocatableLiquidityAssets).lt(liquidityToAllocate)) throw new Error('Not enough liquidity available to allocate');
  }

  const vaultTotalAssets = marketData.publicAllocatorSharedLiquidity.reduce(
    (acc: Record<string, string>, item: MorphoBluePublicAllocatorItem) => {
      const vaultAddress = item.vault.address;
      acc[vaultAddress] = new Dec(acc[vaultAddress] || '0').add(item.assets).toString();
      return acc;
    },
    {},
  );

  const sortedVaults = Object.entries(vaultTotalAssets).sort(
    ([, a]: [string, string], [, b]: [string, string]) => new Dec(b || '0').sub(a || '0').toNumber(),
  );

  const withdrawalsPerVault: Record<string, [string[], string][]> = {};
  let totalReallocated = '0';
  for (const [vaultAddress] of sortedVaults) {
    if (new Dec(totalReallocated).gte(liquidityToAllocate)) break;

    const vaultAllocations = marketData.publicAllocatorSharedLiquidity.filter(
      (item: MorphoBluePublicAllocatorItem) => compareAddresses(item.vault.address, vaultAddress),
    );
    for (const item of vaultAllocations) {
      if (new Dec(totalReallocated).gte(liquidityToAllocate)) break;
      const itemAmount = item.assets;
      const leftToAllocate = new Dec(liquidityToAllocate).sub(totalReallocated).toString();
      const amountToTake = new Dec(itemAmount).lt(leftToAllocate) ? itemAmount : leftToAllocate;
      totalReallocated = new Dec(totalReallocated).add(amountToTake).toString();
      const withdrawal: [string[], string] = [
        [
          item.allocationMarket.loanAsset.address,
          item.allocationMarket.collateralAsset?.address,
          item.allocationMarket.oracle?.address,
          item.allocationMarket.irmAddress,
          item.allocationMarket.lltv,
        ],
        amountToTake.toString(),
      ];
      if (!withdrawalsPerVault[vaultAddress]) {
        withdrawalsPerVault[vaultAddress] = [];
      }
      withdrawalsPerVault[vaultAddress].push(withdrawal);
    }
  }

  const vaults = Object.keys(withdrawalsPerVault);
  const withdrawals = vaults.map(
    (vaultAddress) => withdrawalsPerVault[vaultAddress],
  );
  return {
    vaults,
    withdrawals,
  };
};