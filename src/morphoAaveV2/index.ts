import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import Dec from 'decimal.js';
import Web3 from 'web3';
import { wethToEthByAddress } from '../services/utils';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import { getStETHApr } from '../staking';
import { MorphoAaveV2ViewContract } from '../contracts';
import {
  AavePositionData,
  AaveVersions, MorphoAaveV2AssetData, MorphoAaveV2AssetsData, MorphoAaveV2MarketData, MorphoAaveV2PositionData,
} from '../types';
import { calculateBorrowingAssetLimit } from '../moneymarket';
import { EMPTY_AAVE_DATA } from '../aaveV3';
import { aaveAnyGetAggregatedPositionData } from '../helpers/aaveHelpers';
import { getEthPrice } from '../services/priceService';

export const getMorphoAaveV2MarketsData = async (web3: Web3, network: NetworkNumber, mainnetWeb3: Web3): Promise<MorphoAaveV2MarketData> => {
  const ethPrice = await getEthPrice(web3);
  const morphoAaveV2ViewContract = MorphoAaveV2ViewContract(web3, network);

  const [contractData, morphoRewardsRes] = await Promise.allSettled([
    morphoAaveV2ViewContract.methods.getAllMarketsInfo().call(),
    fetch('https://api.morpho.xyz/rewards/distribution'),
  ]);

  if (contractData.status !== 'fulfilled') {
    throw new Error('Failed to fetch market data.');
  }

  const { marketInfo, aaveTokenInfo } = contractData.value;

  const morphoRewardsData = morphoRewardsRes.status === 'fulfilled' ? await morphoRewardsRes.value.json() : null;

  const assetsData: MorphoAaveV2AssetData[] = marketInfo.map((market, index) => {
    const aaveInfo = aaveTokenInfo[index];
    const { symbol, address } = getAssetInfoByAddress(wethToEthByAddress(aaveInfo.underlyingTokenAddress));

    const morphoReward = morphoRewardsData?.markets?.[aaveInfo.aTokenAddress.toLowerCase()];

    const supplyRateP2P = new Dec(market.p2pSupplyRate).div(1e25).toString();
    const borrowRateP2P = new Dec(market.p2pBorrowRate).div(1e25).toString();
    const hasDelta = new Dec(borrowRateP2P).minus(supplyRateP2P).gte(0.3);

    return {
      symbol,
      hasDelta,
      aTokenAddress: aaveInfo.aTokenAddress,
      underlyingTokenAddress: address,
      priceInEth: new Dec(aaveInfo.price).div(1e18).toString(),
      price: new Dec(aaveInfo.price).div(1e18).times(ethPrice).toString(),

      supplyRate: new Dec(market.poolSupplyRate).div(1e25).toString(),
      supplyRateP2P,
      borrowRate: new Dec(market.poolBorrowRate).div(1e25).toString(),
      borrowRateP2P,

      totalSupply: assetAmountInEth(aaveInfo.totalSupply, symbol),
      totalBorrow: assetAmountInEth(aaveInfo.totalBorrow, symbol),
      totalSupplyP2P: assetAmountInEth(market.p2pSupplyAmount, symbol),
      totalSupplyPool: assetAmountInEth(market.poolSupplyAmount, symbol),
      totalBorrowP2P: assetAmountInEth(market.p2pBorrowAmount, symbol),
      totalBorrowPool: assetAmountInEth(market.poolBorrowAmount, symbol),

      collateralFactor: new Dec(aaveInfo.collateralFactor).div(10000).toString(),
      liquidationRatio: new Dec(aaveInfo.liquidationRatio).div(10000).toString(),

      isInactive: !aaveInfo.isActive,
      isFrozen: aaveInfo.isFrozen,
      canBeBorrowed:
            aaveInfo.borrowingEnabled
            && !aaveInfo.isFrozen
            && !(market.pauseStatus.isBorrowPaused || market.pauseStatus.isDeprecated),
      canBeWithdrawn: !market.pauseStatus.isWithdrawPaused,
      canBePayBacked: !market.pauseStatus.isRepayPaused,
      canBeSupplied: !aaveInfo.isFrozen && !(market.pauseStatus.isSupplyPaused || market.pauseStatus.isDeprecated),

      reserveFactor: market.reserveFactor,
      pauseStatus: market.pauseStatus,

      incentiveSupplyToken: 'MORPHO',
      incentiveBorrowToken: 'MORPHO',
      incentiveSupplyApy: new Dec(morphoReward?.supplyRate || 0).div(1e18).toString(),
      incentiveBorrowApy: new Dec(morphoReward?.borrowRate || 0).div(1e18).toString(),

      marketLiquidity: assetAmountInEth(new Dec(aaveInfo.totalSupply.toString())
        .sub(aaveInfo.totalBorrow.toString())
        .toString(), symbol),
      utilization: new Dec(aaveInfo.totalBorrow.toString())
        .div(new Dec(aaveInfo.totalSupply.toString()))
        .times(100)
        .toString(),

      totalBorrowVar: '0', // Morpho doesn't have all these, keeping it for compatability
      usageAsCollateralEnabled: false,
      disabledStableBorrowing: false,
      borrowRateStable: '0',
      supplyCap: '0', // V2 doesn't have borrow/supply cap but adding it for compatability with V3
      borrowCap: '0',
    };
  });

  const stEthMarket = assetsData.find(({ symbol }) => symbol === 'stETH');
  if (stEthMarket) {
    stEthMarket.incentiveSupplyApy = await getStETHApr(mainnetWeb3);
    stEthMarket.incentiveSupplyToken = 'stETH';
  }

  const payload: MorphoAaveV2AssetsData = {};
  // Sort by market size
  assetsData
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalSupply).toString();
      const bMarket = new Dec(b.price).times(b.totalSupply).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((assetData: MorphoAaveV2AssetData, i: number) => {
      payload[assetData.symbol] = { ...assetData, sortIndex: i };
    });

  return { assetsData: payload };
};

export const getMorphoAaveV2AccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const morphoAaveV2ViewContract = MorphoAaveV2ViewContract(web3, network, block);

  const { userBalances } = await morphoAaveV2ViewContract.methods.getUserInfo(address).call({}, block);

  if (userBalances.length === 0) {
    return balances;
  }

  userBalances.forEach((balance: any) => {
    const assetAddr = wethToEthByAddress(balance.underlying, network).toLowerCase();
    const { symbol } = getAssetInfoByAddress(assetAddr, network);

    balances = {
      collateral: {
        ...balances.collateral,
        [addressMapping ? assetAddr : symbol]: new Dec(balance.supplyBalanceInP2P).add(balance.supplyBalanceOnPool).toString(),
      },
      debt: {
        ...balances.debt,
        [addressMapping ? assetAddr : symbol]: new Dec(balance.borrowBalanceInP2P).add(balance.borrowBalanceOnPool).toString(),
      },
    };
  });

  return balances;
};

export const getMorphoAaveV2AccountData = async (web3: Web3, network: NetworkNumber, address: string, assetsData: MorphoAaveV2AssetsData): Promise<MorphoAaveV2PositionData> => {
  if (!address) {
    throw new Error('Address is required.');
  }

  let payload: MorphoAaveV2PositionData = {
    ...EMPTY_AAVE_DATA,
    usedAssets: {},
    minRatio: '100',
    lastUpdated: Date.now(),
  };

  const morphoAaveV2ViewContract = MorphoAaveV2ViewContract(web3, network);

  const { userBalances } = await morphoAaveV2ViewContract.methods.getUserInfo(address).call();

  if (userBalances.length === 0) {
    return payload;
  }

  userBalances.forEach((market) => {
    const { symbol } = getAssetInfoByAddress(wethToEthByAddress(market.underlying));
    const suppliedP2P = assetAmountInEth(market.supplyBalanceInP2P, symbol);
    const suppliedPool = assetAmountInEth(market.supplyBalanceOnPool, symbol);
    const supplied = new Dec(suppliedP2P).add(suppliedPool).toString();
    const suppliedMatched = new Dec(suppliedP2P).div(supplied).mul(100).toDP(2)
      .toString();

    const assetAavePrice = assetsData[symbol].price;
    const borrowedP2P = assetAmountInEth(market.borrowBalanceInP2P, symbol);
    const borrowedPool = assetAmountInEth(market.borrowBalanceOnPool, symbol);
    const borrowed = new Dec(borrowedP2P).add(borrowedPool).toString();
    const borrowedMatched = new Dec(borrowedP2P).div(borrowed).mul(100).toDP(2)
      .toString();
    const borrowedUsd = new Dec(borrowed).mul(assetAavePrice).toString();

    payload.usedAssets[symbol] = {
      symbol,
      supplied,
      suppliedP2P,
      suppliedPool,
      suppliedMatched,
      borrowed,
      borrowedP2P,
      borrowedPool,
      borrowedMatched,
      suppliedUsd: new Dec(supplied).mul(assetAavePrice).toString(),
      suppliedP2PUsd: new Dec(suppliedP2P).mul(assetAavePrice).toString(),
      suppliedPoolUsd: new Dec(suppliedPool).mul(assetAavePrice).toString(),
      borrowedUsd,
      borrowedP2PUsd: new Dec(borrowedP2P).mul(assetAavePrice).toString(),
      borrowedPoolUsd: new Dec(borrowedPool).mul(assetAavePrice).toString(),
      borrowedVariable: borrowed,
      borrowedUsdVariable: borrowedUsd,
      isSupplied: new Dec(supplied).gt(0),
      isBorrowed: new Dec(borrowed).gt(0),
      supplyRate: new Dec(market.userSupplyRate).div(1e25).toString(),
      borrowRate: new Dec(market.userBorrowRate).div(1e25).toString(),
      limit: '0',

      collateral: true, // Morpho doesn't have all these, keeping it for compatability
      eModeCategory: 0,
      interestMode: '',
      stableBorrowRate: '0',
      borrowedStable: '0',
      borrowedUsdStable: '0',
      stableLimit: '0',
      variableLimit: '0',
    };
  });

  payload = {
    ...payload,
    ...aaveAnyGetAggregatedPositionData({
      usedAssets: payload.usedAssets, assetsData, eModeCategory: 0, selectedMarket: { value: AaveVersions.MorphoAaveV2 },
    }),
  };

  // Calculate borrow limits per asset
  Object.values(payload.usedAssets).forEach((item) => {
    if (item.isBorrowed) {
      // eslint-disable-next-line no-param-reassign
      item.limit = calculateBorrowingAssetLimit(item.borrowedUsd, payload.borrowLimitUsd);
    }
  });

  return payload;
};

export const getMorphoAaveV2FullPositionData = async (web3: Web3, network: NetworkNumber, address: string, mainnetWeb3: Web3): Promise<MorphoAaveV2PositionData> => {
  const marketData = await getMorphoAaveV2MarketsData(web3, network, mainnetWeb3);
  const positionData = await getMorphoAaveV2AccountData(web3, network, address, marketData.assetsData);
  return positionData;
};
