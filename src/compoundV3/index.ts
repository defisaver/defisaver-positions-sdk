import Web3 from 'web3';
import Dec from 'decimal.js';
import {
  assetAmountInEth, assetAmountInWei, getAssetInfo, getAssetInfoByAddress,
} from '@defisaver/tokens';
import { CompV3ViewContract } from '../contracts';
import { multicall } from '../multicall';
import {
  CompoundV3AssetData, CompoundMarketData, CompoundV3AssetsData, CompoundV3UsedAssets, CompoundV3MarketsData, CompoundV3PositionData, CompoundVersions,
} from '../types/compound';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import {
  getCbETHApr, getStETHApr, getStETHByWstETHMultiple, getWstETHByStETH,
} from '../staking';
import { wethToEth } from '../services/utils';
import { ZERO_ADDRESS } from '../constants';
import { calculateBorrowingAssetLimit } from '../moneymarket';
import {
  formatBaseData, formatMarketData, getCompoundV3AggregatedData, getIncentiveApys,
} from '../helpers/compoundHelpers';
import { COMPOUND_V3_ETH, COMPOUND_V3_USDBC, COMPOUND_V3_USDC } from '../markets/compound';

export const getCompoundV3MarketsData = async (web3: Web3, network: NetworkNumber, selectedMarket: CompoundMarketData, compPrice: string, defaultWeb3: Web3): Promise<CompoundV3MarketsData> => {
  const contract = CompV3ViewContract(web3, network);
  const CompV3ViewAddress = contract.options.address;
  const calls = [
    {
      target: CompV3ViewAddress,
      abiItem: contract.options.jsonInterface.find((props) => props.name === 'getFullBaseTokenInfo'),
      params: [selectedMarket.baseMarketAddress],
    },
    {
      target: CompV3ViewAddress,
      abiItem: contract.options.jsonInterface.find((props) => props.name === 'getFullCollInfos'),
      params: [selectedMarket.baseMarketAddress],
    },
  ];
  const data = await multicall(calls, web3, network);
  const colls = data[1].colls.map((coll: any) => formatMarketData(coll, network)) as CompoundV3AssetData[];
  if (selectedMarket.value === CompoundVersions.CompoundV3ETH) {
    for (const coll of colls) {
      if (coll.symbol === 'wstETH') {
        // eslint-disable-next-line no-await-in-loop
        const [[totalSupplyAlternative, supplyCapAlternative], priceAlternative] = await Promise.all([
          getStETHByWstETHMultiple([
            assetAmountInWei(coll.totalSupply, 'wstETH'),
            assetAmountInWei(coll.supplyCap, 'wstETH'),
          ], defaultWeb3),
          getWstETHByStETH(assetAmountInWei(1, 'stETH'), defaultWeb3),
        ]);
        coll.totalSupplyAlternative = assetAmountInEth(totalSupplyAlternative, 'stETH');
        coll.supplyCapAlternative = assetAmountInEth(supplyCapAlternative, 'stETH');
        coll.priceAlternative = assetAmountInEth(priceAlternative, 'wstETH');
        // const stEthMarket = markets.find(({ symbol }) => symbol === 'stETH');
        // eslint-disable-next-line no-await-in-loop
        coll.incentiveSupplyApy = await getStETHApr(defaultWeb3);
        coll.incentiveSupplyToken = 'wstETH';
      }
      if (coll.symbol === 'cbETH') {
        // eslint-disable-next-line no-await-in-loop
        coll.incentiveSupplyApy = await getCbETHApr(defaultWeb3);
        coll.incentiveSupplyToken = 'cbETH';
      }
    }
  }
  const base = formatBaseData(data[0].baseToken, network);

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
  })[marketAddress];

  const loanInfoContract = CompV3ViewContract(web3, network);
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

export const getCompoundV3AccountData = async (
  web3: Web3,
  network: NetworkNumber,
  address: string,
  proxyAddress: string,
  extractedState: ({
    selectedMarket: CompoundMarketData,
    assetsData: CompoundV3AssetsData,
  })): Promise<CompoundV3PositionData> => {
  if (!address) throw new Error('No address provided');
  const {
    selectedMarket, assetsData,
  } = extractedState;

  let payload = {
    ...EMPTY_COMPOUND_V3_DATA,
    lastUpdated: Date.now(),
  };

  const contract = CompV3ViewContract(web3, network);
  const CompV3ViewAddress = contract.options.address;

  const calls = [
    {
      target: CompV3ViewAddress,
      abiItem: contract.options.jsonInterface.find((props) => props.name === 'getLoanData'),
      params: [selectedMarket.baseMarketAddress, address],
    },
    {
      target: CompV3ViewAddress,
      abiItem: contract.options.jsonInterface.find((props) => props.name === 'isAllowed'),
      params: [selectedMarket.baseMarketAddress, address, proxyAddress || ZERO_ADDRESS],
    },
  ];

  const data: any[] = await multicall(calls, web3, network);

  const loanData = data[0][0];

  const usedAssets: CompoundV3UsedAssets = {};

  const baseAssetInfo = getAssetInfo(selectedMarket.baseAsset);
  const baseAssetSymbol = wethToEth(selectedMarket.baseAsset);
  usedAssets[baseAssetSymbol] = { ...EMPTY_USED_ASSET, symbol: baseAssetSymbol, collateral: false };
  if (loanData.depositAmount.toString() !== '0') {
    usedAssets[baseAssetSymbol].isSupplied = true;
    usedAssets[baseAssetSymbol].supplied = assetAmountInEth(loanData.depositAmount, baseAssetInfo.symbol);
    usedAssets[baseAssetSymbol].suppliedUsd = assetAmountInEth(loanData.depositValue, baseAssetInfo.symbol);
  }
  if (loanData.borrowAmount.toString() !== '0') {
    usedAssets[baseAssetSymbol].isBorrowed = true;
    usedAssets[baseAssetSymbol].borrowed = assetAmountInEth(loanData.borrowAmount, baseAssetInfo.symbol);
    usedAssets[baseAssetSymbol].borrowedUsd = assetAmountInEth(loanData.borrowValue, baseAssetInfo.symbol);
  }
  loanData.collAddr.forEach((coll: string, i: number): void => {
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
    isAllowed: data[1][0],
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

export const getCompoundV3FullPositionData = async (web3: Web3, network: NetworkNumber, address: string, proxyAddress: string, selectedMarket: CompoundMarketData, compPrice: string, mainnetWeb3: Web3): Promise<CompoundV3PositionData> => {
  const marketData = await getCompoundV3MarketsData(web3, network, selectedMarket, compPrice, mainnetWeb3);
  const positionData = await getCompoundV3AccountData(web3, network, address, proxyAddress, { selectedMarket, assetsData: marketData.assetsData });
  return positionData;
};