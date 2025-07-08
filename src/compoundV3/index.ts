import Web3 from 'web3';
import Dec from 'decimal.js';
import {
  assetAmountInEth, assetAmountInWei, getAssetInfo, getAssetInfoByAddress,
} from '@defisaver/tokens';
import { Client, createPublicClient } from 'viem';
import { CompV3ViewContract, CompV3ViewContractViem } from '../contracts';
import { multicall } from '../multicall';
import {
  CompoundV3AssetData, CompoundMarketData, CompoundV3AssetsData, CompoundV3UsedAssets, CompoundV3MarketsData, CompoundV3PositionData,
} from '../types';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  getStakingApy, STAKING_ASSETS,
} from '../staking';
import { ethToWeth, wethToEth } from '../services/utils';
import { ZERO_ADDRESS } from '../constants';
import { calculateBorrowingAssetLimit } from '../moneymarket';
import {
  formatBaseData, formatMarketData, getCompoundV3AggregatedData, getIncentiveApys,
} from '../helpers/compoundHelpers';
import {
  COMPOUND_V3_ETH, COMPOUND_V3_USDBC, COMPOUND_V3_USDC, COMPOUND_V3_USDCe, COMPOUND_V3_USDT,
} from '../markets/compound';
import {
  getEthPrice, getCompPrice, getUSDCPrice, getWstETHPrice,
} from '../services/priceService';

const getSupportedAssetsAddressesForMarket = (selectedMarket: CompoundMarketData, network: NetworkNumber) => selectedMarket.collAssets.map(asset => getAssetInfo(ethToWeth(asset), network)).map(addr => addr.address.toLowerCase());

const getBaseAssetPriceFunction = (asset: string) => {
  switch (asset) {
    case 'wstETH':
      return getWstETHPrice;
    case 'ETH':
      return getEthPrice;
    default:
      return getUSDCPrice;
  }
};

export const _getCompoundV3MarketsData = async (provider: Client, network: NetworkNumber, selectedMarket: CompoundMarketData, defaultProvider: Client): Promise<CompoundV3MarketsData> => {
  const contract = CompV3ViewContractViem(provider, network);

  const [baseAssetPrice, compPrice, baseTokenInfo, collInfos] = await Promise.all([
    getBaseAssetPriceFunction(selectedMarket.baseAsset)(defaultProvider),
    getCompPrice(defaultProvider),
    contract.read.getFullBaseTokenInfo([selectedMarket.baseMarketAddress]),
    contract.read.getFullCollInfos([selectedMarket.baseMarketAddress]),
  ]);

  const supportedAssetsAddresses = getSupportedAssetsAddressesForMarket(selectedMarket, network);

  const colls = collInfos
    .filter((coll: any) => supportedAssetsAddresses.includes(coll.tokenAddr.toLowerCase()))
    .map((coll: any) => formatMarketData(coll, network, baseAssetPrice)) as CompoundV3AssetData[];

  for (const coll of colls) {
    if (STAKING_ASSETS.includes(coll.symbol)) {
      coll.incentiveSupplyApy = await getStakingApy(coll.symbol);
      coll.incentiveSupplyToken = coll.symbol;
    }
  }
  const base = formatBaseData(baseTokenInfo, network, baseAssetPrice);

  const payload: CompoundV3AssetsData = {};

  const baseObj = { ...base, ...getIncentiveApys(base, compPrice) };
  const allAssets = [baseObj, ...colls];

  allAssets
    .sort((a, b) => {
      const aMarket = new Dec(a.price).times(a.totalSupply).toString();
      const bMarket = new Dec(b.price).times(b.totalSupply).toString();

      return new Dec(bMarket).minus(aMarket).toNumber();
    })
    .forEach((market, i) => {
      payload[market.symbol] = { ...market, sortIndex: i };
    });

  return { assetsData: payload };
};

export const getCompoundV3MarketsData = async (provider: Web3, network: NetworkNumber, selectedMarket: CompoundMarketData, defaultProvider: Web3): Promise<CompoundV3MarketsData> => {
  const client = createPublicClient({
    // @ts-ignore
    transport: http(provider._provider.host),
  });
  const defaultClient = createPublicClient({
    // @ts-ignore
    transport: http(defaultProvider._provider.host),
  });
  return _getCompoundV3MarketsData(client, network, selectedMarket, defaultClient);
};

export const EMPTY_COMPOUND_V3_DATA = {
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
  isAllowed: false,
  lastUpdated: Date.now(),
};

export const EMPTY_USED_ASSET = {
  isSupplied: false,
  isBorrowed: false,
  supplied: '0',
  suppliedUsd: '0',
  borrowed: '0',
  borrowedUsd: '0',
  symbol: '',
  collateral: true,
  debt: '0',
};

export const getCompoundV3AccountBalances = async (web3: Web3, network: NetworkNumber, block: Blockish, addressMapping: boolean, address: EthAddress, marketAddress: EthAddress): Promise<PositionBalances> => {
  let balances: PositionBalances = {
    collateral: {},
    debt: {},
  };

  if (!address) {
    return balances;
  }

  const market = ({
    [COMPOUND_V3_ETH(network).baseMarketAddress.toLowerCase()]: COMPOUND_V3_ETH(network),
    [COMPOUND_V3_USDC(network).baseMarketAddress.toLowerCase()]: COMPOUND_V3_USDC(network),
    [COMPOUND_V3_USDBC(network).baseMarketAddress.toLowerCase()]: COMPOUND_V3_USDBC(network),
    [COMPOUND_V3_USDT(network).baseMarketAddress.toLowerCase()]: COMPOUND_V3_USDT(network),
    [COMPOUND_V3_USDCe(network).baseMarketAddress.toLowerCase()]: COMPOUND_V3_USDCe(network),
  })[marketAddress.toLowerCase()];

  const loanInfoContract = CompV3ViewContract(web3, network, block);
  const loanInfo = await loanInfoContract.methods.getLoanData(market.baseMarketAddress, address).call({}, block);
  const baseAssetInfo = getAssetInfo(wethToEth(market.baseAsset), network);

  balances = {
    collateral: {
      [addressMapping ? baseAssetInfo.address.toLowerCase() : baseAssetInfo.symbol]: loanInfo.depositAmount,
    },
    debt: {
      [addressMapping ? baseAssetInfo.address.toLowerCase() : baseAssetInfo.symbol]: loanInfo.borrowAmount,
    },
  };

  loanInfo.collAddr.forEach((coll: string, i: number): void => {
    const symbol = wethToEth(getAssetInfoByAddress(coll, network).symbol);
    balances = {
      ...balances,
      collateral: {
        ...balances.collateral,
        [addressMapping ? getAssetInfo(symbol, network).address.toLowerCase() : symbol]: loanInfo.collAmounts[i].toString(),
      },
    };
  });

  return balances;
};

export const _getCompoundV3AccountData = async (
  provider: Client,
  network: NetworkNumber,
  address: EthAddress,
  proxyAddress: EthAddress,
  extractedState: ({
    selectedMarket: CompoundMarketData,
    assetsData: CompoundV3AssetsData,
  }),
): Promise<CompoundV3PositionData> => {
  if (!address) throw new Error('No address provided');
  const {
    selectedMarket, assetsData,
  } = extractedState;

  let payload = {
    ...EMPTY_COMPOUND_V3_DATA,
    lastUpdated: Date.now(),
  };

  const contract = CompV3ViewContractViem(provider, network);


  const [loanData, isAllowed] = await Promise.all([
    contract.read.getLoanData([selectedMarket.baseMarketAddress, address]),
    contract.read.isAllowed([selectedMarket.baseMarketAddress, address, (proxyAddress || ZERO_ADDRESS)]),
  ]);

  const usedAssets: CompoundV3UsedAssets = {};

  const baseAssetInfo = getAssetInfo(selectedMarket.baseAsset);
  const baseAssetSymbol = wethToEth(selectedMarket.baseAsset);
  usedAssets[baseAssetSymbol] = { ...EMPTY_USED_ASSET, symbol: baseAssetSymbol, collateral: false };
  if (loanData.depositAmount.toString() !== '0') {
    usedAssets[baseAssetSymbol].isSupplied = true;
    usedAssets[baseAssetSymbol].supplied = assetAmountInEth(loanData.depositAmount.toString(), baseAssetInfo.symbol);
    usedAssets[baseAssetSymbol].suppliedUsd = new Dec(assetAmountInEth(loanData.depositValue.toString(), baseAssetInfo.symbol)).mul(assetsData[baseAssetSymbol].price).toString();
  }
  if (loanData.borrowAmount.toString() !== '0') {
    usedAssets[baseAssetSymbol].isBorrowed = true;
    usedAssets[baseAssetSymbol].borrowed = assetAmountInEth(loanData.borrowAmount.toString(), baseAssetInfo.symbol);
    usedAssets[baseAssetSymbol].borrowedUsd = new Dec(
      assetAmountInEth(loanData.borrowValue.toString(), baseAssetInfo.symbol),
    )
      .mul(assetsData[baseAssetSymbol].price)
      .toString();
  }
  const supportedAssetsAddresses = getSupportedAssetsAddressesForMarket(selectedMarket, network);

  loanData.collAddr.forEach((coll: string, i: number): void => {
    // not filtering collAddr because there is no way of knowing how to filter loanData.collAmounts
    if (!supportedAssetsAddresses.includes(coll.toLowerCase())) return;
    const assetInfo = getAssetInfoByAddress(coll, network);
    const symbol = wethToEth(assetInfo.symbol);
    const supplied = assetAmountInEth(loanData.collAmounts[i].toString(), symbol);
    const isSupplied = supplied !== '0';
    const price = assetsData[symbol].price;
    const suppliedUsd = new Dec(supplied).mul(price).toString();
    usedAssets[symbol] = {
      ...usedAssets[symbol],
      borrowed: '0',
      borrowedUsd: '0',
      isSupplied,
      supplied,
      suppliedUsd,
      isBorrowed: false,
      symbol,
      collateral: true,
    };
  });

  payload = {
    ...payload,
    usedAssets,
    ...getCompoundV3AggregatedData({
      usedAssets, assetsData, network, selectedMarket,
    }),
    isAllowed,
  };

  // Calculate borrow limits per asset
  Object.values(payload.usedAssets).forEach((item: any) => {
    if (item.isBorrowed) {
      // eslint-disable-next-line no-param-reassign
      item.limit = calculateBorrowingAssetLimit(item.borrowedUsd, payload.borrowLimitUsd);
    }
  });

  return payload;
};

export const getCompoundV3AccountData = async (
  provider: Web3,
  network: NetworkNumber,
  address: EthAddress,
  proxyAddress: EthAddress,
  extractedState: ({
    selectedMarket: CompoundMarketData,
    assetsData: CompoundV3AssetsData,
  }),
): Promise<CompoundV3PositionData> => {
  const client = createPublicClient({
    // @ts-ignore
    transport: http(provider._provider.host),
  });
  return _getCompoundV3AccountData(client, network, address, proxyAddress, extractedState);
};

export const getCompoundV3FullPositionData = async (web3: Web3, network: NetworkNumber, address: EthAddress, proxyAddress: EthAddress, selectedMarket: CompoundMarketData, mainnetWeb3: Web3): Promise<CompoundV3PositionData> => {
  const marketData = await getCompoundV3MarketsData(web3, network, selectedMarket, mainnetWeb3);
  const positionData = await getCompoundV3AccountData(web3, network, address, proxyAddress, { selectedMarket, assetsData: marketData.assetsData });
  return positionData;
};
