import { assetAmountInEth, getAssetInfo, getAssetInfoByAddress } from '@defisaver/tokens';
import Dec from 'decimal.js';
import { Client } from 'viem';
import { BLOCKS_IN_A_YEAR } from '../constants';
import { aprToApy } from '../moneymarket';
import { compareAddresses, handleWbtcLegacy, wethToEth } from '../services/utils';
import {
  Blockish, EthAddress, EthereumProvider, IncentiveKind, NetworkNumber, PositionBalances,
} from '../types/common';
import { CompoundLoanInfoContractViem, ComptrollerContractViem } from '../contracts';
import { compoundV2CollateralAssets } from '../markets';
import {
  CompoundV2AssetsData, CompoundV2MarketsData, CompoundV2PositionData, CompoundV2UsedAsset, CompoundV2UsedAssets,
} from '../types';
import { getCompoundV2AggregatedData } from '../helpers/compoundHelpers';
import { getViemProvider, setViemBlockNumber } from '../services/viem';

const compAddress = '0xc00e94cb662c3520282e6f5717214004a7f26888';

export const _getCompoundV2MarketsData = async (provider: Client, network: NetworkNumber): Promise<CompoundV2MarketsData> => {
  const cAddresses = compoundV2CollateralAssets.map(a => a.address);

  const loanInfoContract = CompoundLoanInfoContractViem(provider, network);
  const loanInfo = await loanInfoContract.read.getFullTokensInfo([cAddresses as EthAddress[]]);

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

      if (cAddresses[i].toLowerCase() === '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4'.toLowerCase()) {
        symbol = 'WBTC Legacy';
        isWbtcLegacy = true;
      }
      return {
        symbol,
        underlyingTokenAddress: market.underlyingTokenAddress,
        supplyRate: aprToApy(new Dec(BLOCKS_IN_A_YEAR).times(market.supplyRate.toString()).div(1e16).toString()).toString(),
        borrowRate: aprToApy(new Dec(BLOCKS_IN_A_YEAR).times(market.borrowRate.toString()).div(1e16).toString()).toString(),
        supplyIncentives: [{
          token: 'COMP',
          apy: aprToApy((100 * BLOCKS_IN_A_YEAR * +compSupplySpeeds * +compPrice) / +assetPrice / +totalSupply).toString(),
          incentiveKind: IncentiveKind.Reward,
          description: 'Eligible for protocol-level COMP incentives.',
        }],
        borrowIncentives: [{
          token: 'COMP',
          apy: aprToApy((100 * BLOCKS_IN_A_YEAR * +compBorrowSpeeds * +compPrice) / +assetPrice / +totalBorrow).toString(),
          incentiveKind: IncentiveKind.Reward,
          description: 'Eligible for protocol-level COMP incentives.',
        }],
        collateralFactor: new Dec(market.collateralFactor.toString()).div(1e18).toString(),
        marketLiquidity: assetAmountInEth(market.marketLiquidity.toString(), handleWbtcLegacy(symbol)),
        utilization: new Dec(market.totalBorrow.toString()).div(totalSupply).times(100).toString(),
        totalSupply: assetAmountInEth(totalSupply, handleWbtcLegacy(symbol)),
        totalBorrow: assetAmountInEth(totalBorrow, handleWbtcLegacy(symbol)),
        exchangeRate: new Dec(market.exchangeRate.toString()).div(1e28).mul(10 ** pricePrecisionDiff).toString(),
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

export const getCompoundV2MarketsData = async (provider: EthereumProvider, network: NetworkNumber): Promise<CompoundV2MarketsData> => _getCompoundV2MarketsData(getViemProvider(provider, network), network);

export const EMPTY_COMPOUND_DATA = {
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
  borrowStableSupplyUnstable: false,
  exposure: 'N/A',
};

const getCollateralAssetsAddresses = async (provider: Client, network: NetworkNumber, account: EthAddress) => {
  const contract = ComptrollerContractViem(provider, network);

  return contract.read.getAssetsIn([account]);
};

const getAllMarketAddresses = async (provider: Client, network: NetworkNumber, block: Blockish) => {
  const contract = ComptrollerContractViem(provider, network);

  return contract.read.getAllMarkets(setViemBlockNumber(block));
};


export const _getCompoundV2AccountBalances = async (provider: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const assets = await getAllMarketAddresses(provider, network, block);
  const assetInfo = assets.map(a => getAssetInfoByAddress(a, network));
  const loanInfoContract = CompoundLoanInfoContractViem(provider, network, block);
  const loanInfo = await loanInfoContract.read.getTokenBalances([address, assets], setViemBlockNumber(block));

  loanInfo[0].forEach((weiAmount: any, i: number) => {
    const asset = wethToEth(
      assetInfo[i].symbol === 'cWBTC Legacy'
        ? `${assetInfo[i].underlyingAsset} Legacy`
        : assetInfo[i].underlyingAsset,
    );

    balances = {
      collateral: {
        ...balances.collateral,
        [addressMapping ? getAssetInfo(asset, network).address.toLowerCase() : asset]: weiAmount.toString(),
      },
    };
  });
  loanInfo[1].forEach((weiAmount: any, i: number) => {
    const asset = wethToEth(
      assetInfo[i].symbol === 'cWBTC Legacy'
        ? `${assetInfo[i].underlyingAsset} Legacy`
        : assetInfo[i].underlyingAsset,
    );

    balances = {
      ...balances,
      debt: {
        ...balances.debt,
        [addressMapping ? getAssetInfo(asset, network).address.toLowerCase() : asset]: weiAmount.toString(),
      },
    };
  });

  return balances;
};

export const getCompoundV2AccountBalances = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  block: Blockish,
  addressMapping: boolean,
  address: EthAddress,
): Promise<PositionBalances> => _getCompoundV2AccountBalances(getViemProvider(provider, network), network, block, addressMapping, address);

export const _getCompoundV2AccountData = async (provider: Client, network: NetworkNumber, address: EthAddress, assetsData: CompoundV2AssetsData): Promise<CompoundV2PositionData> => {
  if (!address) throw new Error('No address provided');

  let payload = { ...EMPTY_COMPOUND_DATA, lastUpdated: Date.now() };

  const loanInfoContract = CompoundLoanInfoContractViem(provider, network);
  const [loanInfo, collateralAssetsAddresses] = await Promise.all([
    loanInfoContract.read.getTokenBalances([address, compoundV2CollateralAssets.map(a => a.address) as EthAddress[]]),
    getCollateralAssetsAddresses(provider, network, address),
  ]);

  const usedAssets = {} as CompoundV2UsedAssets;

  loanInfo[0].forEach((weiAmount: BigInt, i: number) => {
    const asset = compoundV2CollateralAssets[i].symbol === 'cWBTC Legacy'
      ? `${compoundV2CollateralAssets[i].underlyingAsset} Legacy`
      : compoundV2CollateralAssets[i].underlyingAsset;
    const amount = assetAmountInEth(weiAmount.toString(), asset);
    const collateral = !!collateralAssetsAddresses.find(a => compareAddresses(a, compoundV2CollateralAssets[i].address));
    if (weiAmount.toString() === '0' && !collateral) return;
    if (!usedAssets[asset]) usedAssets[asset] = {} as CompoundV2UsedAsset;
    usedAssets[asset] = {
      ...usedAssets[asset],
      symbol: asset,
      supplied: amount,
      suppliedUsd: new Dec(amount).mul(assetsData[handleWbtcLegacy(asset)].price).toString(),
      isSupplied: +amount > 0,
      collateral,
    };
  });

  loanInfo[1].forEach((weiAmount, i) => {
    if (weiAmount.toString() === '0') return;
    const asset = compoundV2CollateralAssets[i].symbol === 'cWBTC Legacy'
      ? `${compoundV2CollateralAssets[i].underlyingAsset} Legacy`
      : compoundV2CollateralAssets[i].underlyingAsset;
    const amount = assetAmountInEth(weiAmount.toString(), asset);
    if (!usedAssets[asset]) usedAssets[asset] = {} as CompoundV2UsedAsset;
    usedAssets[asset] = {
      ...usedAssets[asset],
      symbol: asset,
      borrowed: amount,
      borrowedUsd: new Dec(amount).mul(assetsData[handleWbtcLegacy(asset)].price).toString(),
      isBorrowed: true,
      collateral: !!usedAssets[asset].collateral,
    };
  });

  payload = {
    ...payload,
    usedAssets,
    ...getCompoundV2AggregatedData({
      usedAssets, assetsData,
    }),
  };

  return payload;
};

export const getCompoundV2AccountData = async (
  provider: EthereumProvider,
  network: NetworkNumber,
  address: EthAddress,
  assetsData: CompoundV2AssetsData,
): Promise<CompoundV2PositionData> => _getCompoundV2AccountData(getViemProvider(provider, network), network, address, assetsData);

export const getCompoundV2FullPositionData = async (provider: EthereumProvider, network: NetworkNumber, address: EthAddress): Promise<CompoundV2PositionData> => {
  const marketData = await getCompoundV2MarketsData(provider, network);
  const positionData = await getCompoundV2AccountData(provider, network, address, marketData.assetsData);
  return positionData;
};
