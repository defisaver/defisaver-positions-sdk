import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import Dec from 'decimal.js';
import Web3 from 'web3';
import { wethToEthByAddress } from '../services/utils';
import { NetworkNumber } from '../types/common';
import { getStETHApr } from '../staking';
import { MorphoAaveV2ViewContract } from '../contracts';
import { MorphoAaveV2AssetData, MorphoAaveV2AssetsData, MorphoAaveV2MarketData } from '../types';

export const getMorphoAaveV2MarketsData = async (web3: Web3, network: NetworkNumber, ethPrice: string, mainnetWeb3: Web3): Promise<MorphoAaveV2MarketData> => {
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