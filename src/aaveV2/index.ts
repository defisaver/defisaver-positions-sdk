import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import { NetworkNumber } from '../types/common';
import { getStETHApr } from '../staking';
import { ethToWeth } from '../services/utils';
import { AaveLoanInfoV2Contract } from '../contracts';
import { AaveMarketInfo, AaveV2AssetData, AaveV2AssetsData } from '../aaveV3';

export const getAaveV2MarketsData = async (web3: Web3, network: NetworkNumber, selectedMarket: AaveMarketInfo, ethPrice: string, mainnetWeb3: Web3) => {
  const _addresses = selectedMarket.assets.map(a => getAssetInfo(ethToWeth(a)).address);
  const loanInfoContract = AaveLoanInfoV2Contract(web3, network);
  const marketAddress = selectedMarket.providerAddress;
  const loanInfo = await loanInfoContract.methods.getFullTokensInfo(marketAddress, _addresses).call();
  const markets = loanInfo
    .map((market, i) => ({
      symbol: selectedMarket.assets[i],
      underlyingTokenAddress: market.underlyingTokenAddress,
      supplyRate: new Dec(market.supplyRate.toString()).div(1e25).toString(),
      borrowRate: new Dec(market.borrowRateVariable.toString()).div(1e25).toString(),
      borrowRateStable: new Dec(market.borrowRateStable.toString()).div(1e25).toString(),
      collateralFactor: new Dec(market.collateralFactor.toString()).div(10000).toString(),
      liquidationRatio: new Dec(market.liquidationRatio.toString()).div(10000).toString(),
      marketLiquidity: assetAmountInEth(new Dec(market.totalSupply.toString())
        .sub(market.totalBorrow.toString())
        .toString(), selectedMarket.assets[i]),
      utilization: new Dec(market.totalBorrow.toString())
        .div(new Dec(market.totalSupply.toString()))
        .times(100)
        .toString(),
      usageAsCollateralEnabled: market.usageAsCollateralEnabled,
      supplyCap: '0',
      borrowCap: '0', // v2 doesnt have borrow cap but adding it for compatability with v3
      totalSupply: assetAmountInEth(market.totalSupply.toString(), selectedMarket.assets[i]),
      isInactive: !market.isActive,
      isFrozen: market.isFrozen,
      canBeBorrowed: market.isActive && market.borrowingEnabled && !market.isFrozen,
      canBeSupplied: market.isActive && !market.isFrozen,
      canBeWithdrawn: market.isActive,
      canBePayBacked: market.isActive,
      disabledStableBorrowing: !market.stableBorrowRateEnabled,
      totalBorrow: assetAmountInEth(market.totalBorrow.toString(), selectedMarket.assets[i]),
      totalBorrowVar: assetAmountInEth(market.totalBorrowVar.toString(), selectedMarket.assets[i]),
      priceInEth: new Dec(market.price.toString()).div(1e18).toString(),
      incentiveSupplyToken: 'AAVE',
      incentiveBorrowToken: 'AAVE',
      incentiveSupplyApy: '0',
      price: new Dec(market.price.toString()).div(1e18).mul(ethPrice).toString(),
    }));

  const stEthMarket = markets.find(({ symbol }) => symbol === 'stETH');
  if (stEthMarket) {
    stEthMarket.incentiveSupplyApy = await getStETHApr(mainnetWeb3);
    stEthMarket.incentiveSupplyToken = 'stETH';
  }

  const payload: AaveV2AssetsData = {};
  // Sort by market size
  markets
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalSupply).toString();
      const bMarket = new Dec(b.price).times(b.totalSupply).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((assetData: AaveV2AssetData, i) => {
      payload[assetData.symbol] = { ...assetData, sortIndex: i };
    });

  return { assetsData: payload };
};