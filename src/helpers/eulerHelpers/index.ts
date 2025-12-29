import Dec from 'decimal.js';
import { assetAmountInWei } from '@defisaver/tokens';
import {
  EthAddress, EthereumProvider, MMAssetsData, NetworkNumber,
} from '../../types/common';
import {
  calcLeverageLiqPrice, getAssetsTotal, STABLE_ASSETS,
} from '../../moneymarket';
import { calculateNetApy } from '../../staking';
import {
  EulerV2AggregatedPositionData,
  EulerV2AssetsData,
  EulerV2UsedAssets,
} from '../../types';
import { EulerV2ViewContractViem } from '../../contracts';
import { borrowOperations } from '../../constants';
import { getViemProvider } from '../../services/viem';

export const isLeveragedPos = (usedAssets: EulerV2UsedAssets, dustLimit = 5) => {
  let borrowUnstable = 0;
  let supplyStable = 0;
  let borrowStable = 0;
  let supplyUnstable = 0;
  let longAsset = '';
  let shortAsset = '';
  let leverageAssetVault = '';
  Object.values(usedAssets).forEach(({
    symbol, suppliedUsd, borrowedUsd, collateral, vaultAddress,
  }) => {
    const isSupplied = (+suppliedUsd) > dustLimit; // ignore dust like <limit leftover supply
    const isBorrowed = (+borrowedUsd) > dustLimit; // ignore dust like <limit leftover supply
    if (isSupplied && STABLE_ASSETS.includes(symbol) && collateral) supplyStable += 1;
    if (isBorrowed && STABLE_ASSETS.includes(symbol)) borrowStable += 1;
    if (isBorrowed && !STABLE_ASSETS.includes(symbol)) {
      borrowUnstable += 1;
      shortAsset = symbol;
      leverageAssetVault = vaultAddress;
    }
    if (isSupplied && !STABLE_ASSETS.includes(symbol) && collateral) {
      supplyUnstable += 1;
      longAsset = symbol;
      leverageAssetVault = vaultAddress;
    }
  });
  const isLong = borrowStable > 0 && borrowUnstable === 0 && supplyUnstable === 1 && supplyStable === 0;
  const isShort = supplyStable > 0 && supplyUnstable === 0 && borrowUnstable === 1 && borrowStable === 0;
  // lsd -> liquid staking derivative
  const isLsdLeveraged = supplyUnstable === 1 && borrowUnstable === 1 && shortAsset === 'ETH' && ['stETH', 'wstETH', 'cbETH', 'rETH'].includes(longAsset);
  if (isLong) {
    return {
      leveragedType: 'long',
      leveragedAsset: longAsset,
      leveragedVault: leverageAssetVault,
    };
  }
  if (isShort) {
    return {
      leveragedType: 'short',
      leveragedAsset: shortAsset,
      leveragedVault: leverageAssetVault,
    };
  }
  if (isLsdLeveraged) {
    return {
      leveragedType: 'lsd-leverage',
      leveragedAsset: longAsset,
      leveragedVault: leverageAssetVault,
    };
  }
  return {
    leveragedType: '',
    leveragedAsset: '',
    leveragedVault: '',
  };
};

export const getEulerV2AggregatedData = ({
  usedAssets, assetsData, network, ...rest
}: { usedAssets: EulerV2UsedAssets, assetsData: EulerV2AssetsData, network: NetworkNumber }) => {
  const payload = {} as EulerV2AggregatedPositionData;
  payload.suppliedUsd = getAssetsTotal(usedAssets, ({ isSupplied }: { isSupplied: boolean }) => isSupplied, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.suppliedCollateralUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ suppliedUsd }: { suppliedUsd: string }) => suppliedUsd);
  payload.borrowedUsd = getAssetsTotal(usedAssets, ({ isBorrowed }: { isBorrowed: boolean }) => isBorrowed, ({ borrowedUsd }: { borrowedUsd: string }) => borrowedUsd);
  payload.borrowLimitUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ vaultAddress, suppliedUsd }: { vaultAddress: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[vaultAddress.toLowerCase()].collateralFactor));
  payload.liquidationLimitUsd = getAssetsTotal(usedAssets, ({ isSupplied, collateral }: { isSupplied: boolean, collateral: boolean }) => isSupplied && collateral, ({ vaultAddress, suppliedUsd }: { vaultAddress: string, suppliedUsd: string }) => new Dec(suppliedUsd).mul(assetsData[vaultAddress.toLowerCase()].liquidationRatio));
  const leftToBorrowUsd = new Dec(payload.borrowLimitUsd).sub(payload.borrowedUsd);
  payload.leftToBorrowUsd = leftToBorrowUsd.lte('0') ? '0' : leftToBorrowUsd.toString();
  payload.ratio = +payload.suppliedUsd ? new Dec(payload.borrowLimitUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  payload.collRatio = +payload.suppliedUsd ? new Dec(payload.suppliedCollateralUsd).div(payload.borrowedUsd).mul(100).toString() : '0';
  const { netApy, incentiveUsd, totalInterestUsd } = calculateNetApy({ usedAssets, assetsData: assetsData as unknown as MMAssetsData });
  payload.netApy = netApy;
  payload.incentiveUsd = incentiveUsd;
  payload.totalInterestUsd = totalInterestUsd;
  payload.minRatio = '100';
  payload.liqRatio = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).toString();
  payload.liqPercent = new Dec(payload.borrowLimitUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  const { leveragedType, leveragedAsset, leveragedVault } = isLeveragedPos(usedAssets);
  payload.leveragedType = leveragedType;
  if (leveragedType !== '') {
    payload.leveragedAsset = leveragedAsset;
    let assetPrice = assetsData[leveragedVault.toLowerCase()].price;
    if (leveragedType === 'lsd-leverage') {
      const ethAsset = Object.values(assetsData).find((asset) => ['WETH', 'ETH'].includes(asset.symbol));
      if (ethAsset) {
        payload.leveragedLsdAssetRatio = new Dec(assetsData[leveragedVault.toLowerCase()].price).div(ethAsset.price).toString();
        assetPrice = new Dec(assetPrice).div(ethAsset.price).toString();
      }
    }
    payload.liquidationPrice = calcLeverageLiqPrice(leveragedType, assetPrice, payload.borrowedUsd, payload.liquidationLimitUsd);
  }
  payload.minCollRatio = new Dec(payload.suppliedCollateralUsd).div(payload.borrowLimitUsd).mul(100).toString();
  payload.collLiquidationRatio = new Dec(payload.suppliedCollateralUsd).div(payload.liquidationLimitUsd).mul(100).toString();
  return payload;
};

export const getEulerV2BorrowRate = (interestRate: string) => {
  const _interestRate = new Dec(interestRate).div(1e27).toString();
  const secondsPerYear = 31556953;
  const a = new Dec(1).plus(_interestRate).pow(secondsPerYear - 1).toString();
  return new Dec(new Dec(a).minus(1)).mul(100).toString();
};

export const getUtilizationRate = (totalBorrows: string, totalAssets: string) => new Dec(totalBorrows).div(totalAssets).toString();

export const getEulerV2SupplyRate = (borrowRate: string, utilizationRate: string, _interestFee: string) => {
  const interestFee = new Dec(_interestFee).div(10000);
  const fee = new Dec(1).minus(interestFee);
  return new Dec(borrowRate).mul(utilizationRate).mul(fee).toString();
};

const getLiquidityChanges = (action: string, amount: string, isBorrowOperation: boolean) => {
  let liquidityAdded;
  let liquidityRemoved;
  if (isBorrowOperation) {
    liquidityAdded = action === 'payback' ? amount : '0';
    liquidityRemoved = action === 'borrow' ? amount : '0';
  } else {
    liquidityAdded = action === 'collateral' ? amount : '0';
    liquidityRemoved = action === 'withdraw' ? amount : '0';
  }
  return { liquidityAdded, liquidityRemoved };
};

export const getApyAfterValuesEstimationEulerV2 = async (actions: { action: string, amount: string, asset: string, vaultAddress: EthAddress }[], provider: EthereumProvider, network: NetworkNumber) => {
  const client = getViemProvider(provider, network, { batch: { multicall: true } });
  const eulerV2ViewContract = EulerV2ViewContractViem(client, network);
  const apyAfterValuesEstimationParams: {
    vault: EthAddress;
    isBorrowOperation: boolean;
    liquidityAdded: BigInt;
    liquidityRemoved: BigInt;
  }[] = [];
  actions.forEach(({
    action, amount, asset, vaultAddress,
  }) => {
    const amountInWei = assetAmountInWei(amount, asset);
    const isBorrowOperation = borrowOperations.includes(action);
    const { liquidityAdded, liquidityRemoved } = getLiquidityChanges(action, amountInWei, isBorrowOperation);
    apyAfterValuesEstimationParams.push({
      vault: vaultAddress,
      isBorrowOperation: borrowOperations.includes(action),
      liquidityAdded: BigInt(liquidityAdded),
      liquidityRemoved: BigInt(liquidityRemoved),
    });
  });

  const res = await Promise.all([
    ...actions.map(({ vaultAddress }) => eulerV2ViewContract.read.getVaultInfoFull([vaultAddress])),
    // @ts-ignore
    eulerV2ViewContract.read.getApyAfterValuesEstimation([apyAfterValuesEstimationParams]),
  ]);
  const numOfActions = actions.length;
  const data: any = {};
  for (let i = 0; i < numOfActions; i += 1) {
    // @ts-ignore
    const _interestRate = res[numOfActions].estimatedBorrowRates[i];
    // @ts-ignore
    const vaultInfo = res[i][0];
    const decimals = vaultInfo.decimals;
    const borrowRate = getEulerV2BorrowRate(_interestRate);

    const amount = new Dec(actions[i].amount).mul(10 ** decimals).toString();
    const action = actions[i].action;
    const isBorrowOperation = borrowOperations.includes(action);
    const { liquidityAdded, liquidityRemoved } = getLiquidityChanges(action, amount, isBorrowOperation);

    const totalBorrows = new Dec(vaultInfo.totalBorrows).add(isBorrowOperation ? liquidityRemoved : '0').sub(isBorrowOperation ? liquidityAdded : '0').toString();
    const totalAssets = new Dec(vaultInfo.totalAssets).add(isBorrowOperation ? '0' : liquidityAdded).sub(isBorrowOperation ? '0' : liquidityRemoved).toString();
    const utilizationRate = getUtilizationRate(totalBorrows, totalAssets);
    data[vaultInfo.vaultAddr.toLowerCase()] = {
      borrowRate,
      supplyRate: getEulerV2SupplyRate(borrowRate, utilizationRate, vaultInfo.interestFee),
    };
  }
  return data;
};

const xorLastByte = (address: string, xorValue: string): EthAddress => {
  // Extract the last byte (2 hex characters)
  const lastByte = address.slice(-2);

  // XOR the last byte with the given xorValue

  // eslint-disable-next-line no-bitwise
  const xorResult = [...lastByte].map((char, i) => (parseInt(char, 16) ^ parseInt(xorValue[i], 16)).toString(16),
  ).join('');

  // Return the full address with the last byte XORed
  return `0x${address.slice(0, -2)}${xorResult.padStart(2, '0')}`;
};

export const getEulerV2SubAccounts = (address: EthAddress): EthAddress[] => {
  // Clean the address by removing "0x"
  const cleanAddress = address.toLowerCase().replace(/^0x/, '');

  // XOR the last byte with 0x01, 0x02, and 0x03
  const xorWith01 = xorLastByte(cleanAddress, '01');
  const xorWith02 = xorLastByte(cleanAddress, '02');
  const xorWith03 = xorLastByte(cleanAddress, '03');

  // Return an array with all three modified addresses
  return [xorWith01, xorWith02, xorWith03];
};