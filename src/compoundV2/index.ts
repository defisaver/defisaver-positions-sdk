import { assetAmountInEth, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import Dec from 'decimal.js';
import Web3 from 'web3';
import { BLOCKS_IN_A_YEAR } from '../constants';
import { aprToApy } from '../moneymarket';
import { compareAddresses, handleWbtcLegacy } from '../services/utils';
import { NetworkNumber } from '../types/common';
import { CompoundLoanInfoContract } from '../contracts';
import { compoundV2CollateralAssets } from '../markets/compound/marketsAssets';
import { CompoundV2AssetsData, CompoundV2MarketsData } from '../compoundV3';

const compAddress = '0xc00e94cb662c3520282e6f5717214004a7f26888';

export const getCompoundV2MarketsData = async (web3: Web3, network: NetworkNumber): Promise<CompoundV2MarketsData> => {
  const cAddresses = compoundV2CollateralAssets.map(a => a.address);

  const loanInfoContract = CompoundLoanInfoContract(web3, network);
  const loanInfo = await loanInfoContract.methods.getFullTokensInfo(cAddresses).call();

  const compPrice = loanInfo.find(m => compareAddresses(m.underlyingTokenAddress, compAddress))!.price.toString();

  const assetsData = loanInfo
    .map((market, i) => {
      let symbol = getAssetInfoByAddress(cAddresses[i]).underlyingAsset;
      let isWbtcLegacy = false;
      const totalSupply = new Dec(market.totalSupply.toString()).div(1e18).times(market.exchangeRate.toString());
      const totalBorrow = market.totalBorrow.toString();
      const borrowCap = market.borrowCap.toString();
      const compSupplySpeeds = market.compSupplySpeeds.toString();
      const compBorrowSpeeds = market.compBorrowSpeeds.toString();
      const assetPrice = market.price.toString();

      const pricePrecisionDiff = 18 - getAssetInfo(getAssetInfoByAddress(cAddresses[i]).underlyingAsset).decimals;

      // compSupplySpeeds/compBorrowSpeeds is per block per market (borrow & supply are separate markets)
      const incentiveSupplyApy = aprToApy((100 * BLOCKS_IN_A_YEAR * +compSupplySpeeds * +compPrice) / +assetPrice / +totalSupply).toString();
      const incentiveBorrowApy = aprToApy((100 * BLOCKS_IN_A_YEAR * +compBorrowSpeeds * +compPrice) / +assetPrice / +totalBorrow).toString();

      if (cAddresses[i].toLowerCase() === '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4'.toLowerCase()) {
        symbol = 'WBTC Legacy';
        isWbtcLegacy = true;
      }
      return {
        symbol,
        underlyingTokenAddress: market.underlyingTokenAddress,
        supplyRate: aprToApy(new Dec(BLOCKS_IN_A_YEAR).times(market.supplyRate.toString()).div(1e16).toString()).toString(),
        borrowRate: aprToApy(new Dec(BLOCKS_IN_A_YEAR).times(market.borrowRate.toString()).div(1e16).toString()).toString(),
        incentiveSupplyToken: 'COMP',
        incentiveBorrowToken: 'COMP',
        incentiveSupplyApy,
        incentiveBorrowApy,
        collateralFactor: new Dec(market.collateralFactor.toString()).div(1e18).toString(),
        marketLiquidity: assetAmountInEth(market.marketLiquidity.toString(), handleWbtcLegacy(symbol)),
        utilization: new Dec(market.totalBorrow.toString()).div(totalSupply).times(100).toString(),
        totalSupply: assetAmountInEth(totalSupply, handleWbtcLegacy(symbol)),
        totalBorrow: assetAmountInEth(totalBorrow, handleWbtcLegacy(symbol)),
        exchangeRate: new Dec(market.exchangeRate.toString()).div(1e28).toString(),
        borrowCap: assetAmountInEth(borrowCap, handleWbtcLegacy(symbol)),
        canBeBorrowed: market.canBorrow,
        canBeSupplied: market.canMint,
        price: new Dec(market.price.toString()).div(10 ** (18 + pricePrecisionDiff)).toString(),
      };
    });

  const payload = {} as CompoundV2AssetsData;
  // Sort by market size
  assetsData
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalSupply).toString();
      const bMarket = new Dec(b.price).times(b.totalSupply).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((market, i) => { payload[market.symbol] = { ...market, sortIndex: i }; });

  return { assetsData: payload };
};