import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { NetworkNumber } from '../types/common';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import {
  compareAddresses, getEthAmountForDecimals, isMaxuint, wethToEth, wethToEthByAddress,
} from '../services/utils';
import {
  EulerV2AssetData,
  EulerV2AssetsData,
  EulerV2FullMarketData,
  EulerV2Market,
  EulerV2MarketInfoData,
  EulerV2PositionData,
  EulerV2UsedAssets,
  EulerV2VaultType,
} from '../types';
import {
  getEulerV2AggregatedData,
  getEulerV2BorrowRate,
  getEulerV2SupplyRate,
  getUtilizationRate,
} from '../helpers/eulerHelpers';
import { ZERO_ADDRESS } from '../constants';
import { EulerV2ViewContract } from '../contracts';

export const EMPTY_USED_ASSET = {
  isSupplied: false,
  isBorrowed: false,
  supplied: '0',
  suppliedUsd: '0',
  borrowed: '0',
  borrowedUsd: '0',
  symbol: '',
  collateral: false,
  vaultAddress: '',
};

const UnitOfAccountUSD = '0x0000000000000000000000000000000000000348';

export const getEulerV2MarketsData = async (web3: Web3, network: NetworkNumber, selectedMarket: EulerV2Market, defaultWeb3: Web3): Promise<EulerV2FullMarketData> => {
  const contract = EulerV2ViewContract(web3, network);

  const data = await contract.methods.getVaultInfoFull(selectedMarket.marketAddress).call();
  const isInUSD = compareAddresses(UnitOfAccountUSD, data.unitOfAccount);

  const usdPrice = getEthAmountForDecimals(data.unitOfAccountInUsd, 8);

  // parse collateral tokens
  // imma use address as key for assetsData because there can be more collateral vaults with the same name
  const colls: EulerV2AssetData[] = data.collaterals.map((collateral) => {
    const decimals = collateral.decimals;
    const assetInfo = getAssetInfoByAddress(collateral.assetAddr);
    const borrowRate = getEulerV2BorrowRate(collateral.interestRate);
    const utilizationRate = getUtilizationRate(collateral.totalBorrows, new Dec(collateral.totalBorrows).plus(collateral.cash).toString());

    const supplyRate = getEulerV2SupplyRate(borrowRate, utilizationRate, collateral.interestFee);

    const isEscrow = collateral.isEscrowed;
    const isGoverned = !compareAddresses(collateral.governorAdmin, ZERO_ADDRESS);

    const vaultType = isEscrow
      ? EulerV2VaultType.Escrow
      : (
        isGoverned ? EulerV2VaultType.Governed : EulerV2VaultType.Ungoverned
      );
    return ({
      vaultAddress: collateral.vaultAddr,
      assetAddress: wethToEthByAddress(collateral.assetAddr),
      symbol: wethToEth(assetInfo.symbol),
      vaultSymbol: collateral.vaultSymbol,
      name: collateral.name,
      vaultType,
      decimals,
      liquidationRatio: new Dec(collateral.liquidationLTV).div(10_000).toString(),
      collateralFactor: new Dec(collateral.borrowLTV).div(10_000).toString(),
      totalBorrow: getEthAmountForDecimals(collateral.totalBorrows, decimals), // parse
      cash: getEthAmountForDecimals(collateral.cash, decimals),
      supplyCap: isMaxuint(collateral.supplyCap) ? collateral.supplyCap : getEthAmountForDecimals(collateral.supplyCap, decimals),
      borrowCap: '0',
      price: isInUSD ? assetAmountInEth(collateral.assetPriceInUnit) : new Dec(assetAmountInEth(collateral.assetPriceInUnit)).mul(usdPrice).toString(), // 1e18 -> price in unitOfAccount (so it could be USD or any other token)
      canBeBorrowed: false,
      canBeSupplied: true,
      borrowRate,
      supplyRate,
      utilization: new Dec(utilizationRate).mul(100).toString(),
      governorAdmin: collateral.governorAdmin,
    });
  });
  for (const coll of colls) {
    if (STAKING_ASSETS.includes(coll.symbol)) {
      coll.incentiveSupplyApy = await getStakingApy(coll.symbol, defaultWeb3);
      coll.incentiveSupplyToken = coll.symbol;
    }
  }
  const isEscrow = data.collaterals.length === 0;
  const isGoverned = !compareAddresses(data.governorAdmin, ZERO_ADDRESS);

  const vaultType = isEscrow ? EulerV2VaultType.Escrow : (
    isGoverned ? EulerV2VaultType.Governed : EulerV2VaultType.Ungoverned
  );
  const decimals = data.decimals;

  // (1 + SPY/10**27) ** secondsPerYear - 1

  const interestRate = data.interestRate;

  const borrowRate = getEulerV2BorrowRate(interestRate);

  const utilizationRate = getUtilizationRate(data.totalBorrows, data.totalAssets);
  const supplyRate = getEulerV2SupplyRate(borrowRate, utilizationRate, data.interestFee);

  const marketAsset = {
    assetAddress: data.assetAddr,
    vaultAddress: data.vaultAddr,
    symbol: selectedMarket.asset,
    vaultSymbol: selectedMarket.shortLabel,
    decimals,
    totalBorrow: getEthAmountForDecimals(data.totalBorrows, decimals), // parse
    cash: getEthAmountForDecimals(data.cash, decimals),
    supplyCap: isMaxuint(data.supplyCap) ? data.supplyCap : getEthAmountForDecimals(data.supplyCap, decimals),
    borrowCap: isMaxuint(data.supplyCap) ? data.borrowCap : getEthAmountForDecimals(data.borrowCap, decimals),
    price: isInUSD ? assetAmountInEth(data.assetPriceInUnit) : new Dec(assetAmountInEth(data.assetPriceInUnit)).mul(usdPrice).toString(), // 1e18 -> price in unitOfAccount (so it could be USD or any other token)
    sortIndex: 0,
    canBeBorrowed: true,
    canBeSupplied: false,
    borrowRate,
    supplyRate,
    collateralFactor: '0',
    liquidationRatio: '0',
    utilization: new Dec(utilizationRate).mul(100).toString(),
    governorAdmin: data.governorAdmin,
    vaultType,
    name: data.name,
  };

  const assetsData: EulerV2AssetsData = {
    [data.vaultAddr.toLowerCase()]: marketAsset,
  };

  colls
    .sort((coll1, coll2) => {
      const aMarket = new Dec(coll1.price).times(coll1.totalBorrow).toString();
      const bMarket = new Dec(coll2.price).times(coll2.totalBorrow).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((market, i) => {
      assetsData[market.vaultAddress.toLowerCase()] = { ...market, sortIndex: i + 1 };
    });

  const marketData: EulerV2MarketInfoData = {
    name: data.name,
    symbol: data.symbol,
    decimals: data.decimals,
    irm: data.irm,
    creator: data.creator,
    governorAdmin: data.governorAdmin,
    unitOfAccount: data.unitOfAccount,
    unitOfAccountUsdPrice: usdPrice,
    isInUSD,
    oracle: data.oracle,
    collaterals: data.collaterals.map((collateral) => collateral.vaultAddr),
    isEscrow,
    isGoverned,
    vaultType,
    vaultAddress: data.vaultAddr,
  };

  return {
    marketData,
    assetsData,
  };
};

// export const getEulerV2AccountBalances = async (
//     web3: Web3,
//     network: NetworkNumber,
//     selectedMarket: EulerV2MarketData
// ): Promise<> => {
//
// }

export const EMPTY_EULER_V2_DATA = {
  usedAssets: {},
  suppliedUsd: '0',
  borrowedUsd: '0',
  borrowLimitUsd: '0',
  leftToBorrowUsd: '0',
  ratio: '0',
  minRatio: '0',
  netApy: '0',
  incentiveUsd: '0',
  totalInterestUsd: '0',
  isSubscribedToAutomation: false,
  automationResubscribeRequired: false,
  borrowVault: '',
  borrowAmountInUnit: '0',
  inLockDownMode: false,
  inPermitDisabledMode: false,
  lastUpdated: Date.now(),
  hasBorrowInDifferentVault: false,
  addressSpaceTakenByAnotherAccount: false,
};

export const getEulerV2AccountData = async (
  web3: Web3,
  network: NetworkNumber,
  addressForPosition: string,
  ownerAddress: string,
  extractedState: ({
    selectedMarket: EulerV2Market,
    assetsData: EulerV2AssetsData,
    marketData: EulerV2MarketInfoData,
  }),
): Promise<EulerV2PositionData> => {
  if (!addressForPosition) throw new Error('No address provided');

  const {
    selectedMarket, assetsData, marketData,
  } = extractedState;

  let payload = {
    ...EMPTY_EULER_V2_DATA,
    lastUpdated: Date.now(),
  };

  const isInUSD = marketData.isInUSD;

  const parsingDecimals = isInUSD ? 18 : getAssetInfoByAddress(marketData.unitOfAccount).decimals;
  const contract = EulerV2ViewContract(web3, network);

  const loanData = await contract.methods.getUserData(addressForPosition).call();
  const usedAssets: EulerV2UsedAssets = {};
  // there is no user position check for a specific market, only global check
  // but we need to make sure it works for the UI and show position only for the selected market
  if (!compareAddresses(loanData.borrowVault, selectedMarket.marketAddress)) {
    payload = {
      ...payload,
      borrowVault: ZERO_ADDRESS,
      borrowAmountInUnit: '0',
      inLockDownMode: false,
      inPermitDisabledMode: false,
      hasBorrowInDifferentVault: !compareAddresses(loanData.borrowVault, ZERO_ADDRESS),
      addressSpaceTakenByAnotherAccount: !compareAddresses(loanData.owner, ownerAddress) && !compareAddresses(loanData.owner, ZERO_ADDRESS),
    };
  } else {
    payload = {
      ...payload,
      borrowVault: loanData.borrowVault,
      borrowAmountInUnit: loanData.borrowAmountInUnit,
      inLockDownMode: loanData.inLockDownMode,
      inPermitDisabledMode: loanData.inPermitDisabledMode,
      addressSpaceTakenByAnotherAccount: !compareAddresses(loanData.owner, ownerAddress) && !compareAddresses(loanData.owner, ZERO_ADDRESS),
    };

    const borrowedInUnit = getEthAmountForDecimals(loanData.borrowAmountInUnit, parsingDecimals);
    const borrowedInAsset = getEthAmountForDecimals(loanData.borrowAmountInAsset, marketData.decimals);
    const borrowVault = loanData.borrowVault;

    if (borrowVault && !compareAddresses(ZERO_ADDRESS, borrowVault) && borrowedInUnit) {
      const borrowInfo = assetsData[borrowVault.toLowerCase()];
      usedAssets[borrowVault.toLowerCase()] = {
        ...EMPTY_USED_ASSET,
        isBorrowed: true,
        borrowed: borrowedInAsset,
        borrowedUsd: isInUSD ? borrowedInUnit : new Dec(borrowedInUnit).mul(marketData.unitOfAccountUsdPrice).toString(),
        vaultAddress: loanData.borrowVault,
        symbol: borrowInfo.symbol,
      };
    }
  }

  loanData.collaterals.forEach((collateral, i) => {
    const key = collateral.collateralVault.toLowerCase();
    const collInfo = assetsData[key];

    if (!collInfo || !marketData.collaterals.map(a => a.toLowerCase()).includes(key)) return; // this is a token supplied but not being used as a collateral for the market

    const suppliedInUnit = getEthAmountForDecimals(collateral.collateralAmountInUnit, parsingDecimals);
    const suppliedInAsset = getEthAmountForDecimals(collateral.collateralAmountInAsset, collInfo.decimals);
    const collateralAmountInUSD = getEthAmountForDecimals(collateral.collateralAmountInUSD, 18);
    usedAssets[key] = {
      ...EMPTY_USED_ASSET,
      collateral: true,
      isSupplied: !new Dec(suppliedInAsset).eq(0),
      supplied: suppliedInAsset,
      suppliedUsd: collateralAmountInUSD,
      vaultAddress: collateral.collateralVault,
      symbol: collInfo.symbol,
    };
  });

  payload = {
    ...payload,
    usedAssets,
    ...getEulerV2AggregatedData({
      usedAssets, assetsData, network,
    }),
  };

  return payload;
};