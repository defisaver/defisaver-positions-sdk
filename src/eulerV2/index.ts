import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { NetworkNumber } from '../types/common';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { compareAddresses, getEthAmountForDecimals, isMaxuint } from '../services/utils';
import {
  EulerV2AssetData,
  EulerV2AssetsData,
  EulerV2FullMarketData,
  EulerV2Market,
  EulerV2MarketData,
  EulerV2MarketInfoData,
  EulerV2PositionData,
  EulerV2UsedAssets,
  EulerV2VaultType,
} from '../types';
import { getEulerV2AggregatedData } from '../helpers/eulerHelpers';
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
  vaultAddr: '',
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
    return ({
      vaultAddr: collateral.vaultAddr,
      assetAddr: collateral.assetAddr,
      symbol: assetInfo.symbol,
      vaultSymbol: collateral.vaultSymbol,
      decimals,
      liquidationRatio: new Dec(collateral.liquidationLTV).div(100).toString(),
      collateralFactor: new Dec(collateral.borrowLTV).div(100).toString(),
      totalBorrow: getEthAmountForDecimals(collateral.totalBorrows, decimals), // parse
      cash: getEthAmountForDecimals(collateral.cash, decimals),
      supplyCap: isMaxuint(collateral.supplyCap) ? collateral.supplyCap : getEthAmountForDecimals(collateral.supplyCap, decimals),
      borrowCap: '0',
      price: isInUSD ? assetAmountInEth(collateral.assetPriceInUnit) : new Dec(assetAmountInEth(collateral.assetPriceInUnit)).mul(usdPrice).toString(), // 1e18 -> price in unitOfAccount (so it could be USD or any other token)
      canBeBorrowed: false,
      canBeSupplied: true,
      borrowRate: '0',
      supplyRate: '0',
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
  const a = new Dec(interestRate).div(1e27);

  const secondsPerYear = 31556953;
  const borrowRate = new Dec(1).plus(a).pow(secondsPerYear - 1).toString();
  // totalBorrows / totalAssets

  const utilizationRate = new Dec(data.totalBorrows).div(data.totalAssets).toString();

  const interestFee = new Dec(data.interestFee).div(1000);
  const fee = new Dec(1).minus(interestFee);
  const supplyRate = new Dec(borrowRate).mul(utilizationRate).mul(fee).toString();

  const marketAsset = {
    assetAddr: data.assetAddr,
    vaultAddr: data.vaultAddr,
    symbol: data.symbol,
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
  };

  const assetsData: EulerV2AssetsData = {
    [data.vaultAddr.toLowerCase()]: marketAsset,
  };

  colls
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalBorrow).toString();
      const bMarket = new Dec(b.price).times(b.totalBorrow).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((market, i) => {
      assetsData[market.vaultAddr.toLowerCase()] = { ...market, sortIndex: i + 1 };
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
    vaultAddr: data.vaultAddr,
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
};

export const getEulerV2AccountData = async (
  web3: Web3,
  network: NetworkNumber,
  address: string,
  extractedState: ({
    selectedMarket: EulerV2MarketData,
    assetsData: EulerV2AssetsData,
    marketData: EulerV2MarketInfoData,
  }),
): Promise<EulerV2PositionData> => {
  if (!address) throw new Error('No address provided');

  const {
    selectedMarket, assetsData, marketData,
  } = extractedState;

  let payload = {
    ...EMPTY_EULER_V2_DATA,
    lastUpdated: Date.now(),
  };

  const isInUSD = marketData.isInUSD;

  // TODO: maybe not the best practice to get decimals from tokens package
  const parsingDecimals = isInUSD ? 18 : getAssetInfoByAddress(marketData.unitOfAccount).decimals;
  const contract = EulerV2ViewContract(web3, network);

  const loanData = await contract.methods.getUserData(address).call();

  payload = {
    ...payload,
    borrowVault: loanData.borrowVault,
    borrowAmountInUnit: loanData.borrowAmountInUnit,
    inLockDownMode: loanData.inLockDownMode,
    inPermitDisabledMode: loanData.inPermitDisabledMode,
  };

  const usedAssets: EulerV2UsedAssets = {};
  const borrowedInUnit = getEthAmountForDecimals(loanData.borrowAmountInUnit, parsingDecimals);
  const borrowedInAsset = getEthAmountForDecimals(loanData.borrowAmountInAsset, marketData.decimals);
  const borrowVault = loanData.borrowVault;
  if (borrowVault && borrowedInUnit) {
    usedAssets[borrowVault.toLowerCase()] = {
      ...EMPTY_USED_ASSET,
      isBorrowed: true,
      borrowed: borrowedInAsset,
      borrowedUsd: isInUSD ? borrowedInUnit : new Dec(borrowedInUnit).mul(marketData.unitOfAccountUsdPrice).toString(),
      vaultAddr: loanData.borrowVault,
    };

    loanData.collaterals.forEach((collateral, i) => {
      const key = collateral.toLowerCase();
      const collInfo = assetsData[key];
      if (!collInfo) return; // this is a token supplied but not being used as a collateral for the market

      const suppliedInUnit = getEthAmountForDecimals(loanData.collateralAmountsInUnit[i], parsingDecimals);
      const suppliedInAsset = getEthAmountForDecimals(loanData.collateralAmountsInAsset[i], collInfo.decimals);
      usedAssets[key] = {
        ...EMPTY_USED_ASSET,
        collateral: true,
        isSupplied: true,
        supplied: suppliedInAsset,
        suppliedUsd: isInUSD ? suppliedInUnit : new Dec(suppliedInUnit).mul(marketData.unitOfAccountUsdPrice).toString(),
        vaultAddr: collateral,
      };
    });
  }

  payload = {
    ...payload,
    usedAssets,
    ...getEulerV2AggregatedData({
      usedAssets, assetsData, network,
    }),
  };

  return payload;
};