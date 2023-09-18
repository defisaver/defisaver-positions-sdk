import Web3 from 'web3';
import Dec from 'decimal.js';
import { assetAmountInEth, assetAmountInWei } from '@defisaver/tokens';
import { CompV3ViewContract } from '../contracts';
import { multicall } from '../multicall';
import {
  CompoundV3AssetData, BaseAdditionalAssetData, CompoundMarketData, CompoundVersions, CompoundV3AssetsData, CompoundV3MarketData,
} from '../types/compound';
import { NetworkNumber } from '../types/common';
import {
  getCbETHApr, getStETHApr, getStETHByWstETHMultiple, getWstETHByStETH,
} from '../staking';
import { formatBaseData, formatMarketData, getIncentiveApys } from './helpers';

export { CompoundMarkets } from './markets';
export * from '../types/compound';
export * from './helpers';

export const getCompoundV3MarketsData = async (web3: Web3, network: NetworkNumber, selectedMarket: CompoundMarketData, compPrice: string): Promise<CompoundV3MarketData> => {
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
  const colls = data[1].colls.map(formatMarketData) as CompoundV3AssetData[];
  if (selectedMarket.value === CompoundVersions.CompoundV3ETH) {
    for (const coll of colls) {
      if (coll.symbol === 'wstETH') {
        // eslint-disable-next-line no-await-in-loop
        const [[totalSupplyAlternative, supplyCapAlternative], priceAlternative] = await Promise.all([
          getStETHByWstETHMultiple([
            assetAmountInWei(coll.totalSupply, 'wstETH'),
            assetAmountInWei(coll.supplyCap, 'wstETH'),
          ]),
          getWstETHByStETH(assetAmountInWei(1, 'stETH')),
        ]);
        coll.totalSupplyAlternative = assetAmountInEth(totalSupplyAlternative, 'stETH');
        coll.supplyCapAlternative = assetAmountInEth(supplyCapAlternative, 'stETH');
        coll.priceAlternative = assetAmountInEth(priceAlternative, 'wstETH');
        // const stEthMarket = markets.find(({ symbol }) => symbol === 'stETH');
        // eslint-disable-next-line no-await-in-loop
        coll.incentiveSupplyApy = await getStETHApr();
        coll.incentiveSupplyToken = 'wstETH';
      }
      if (coll.symbol === 'cbETH') {
        // eslint-disable-next-line no-await-in-loop
        coll.incentiveSupplyApy = await getCbETHApr();
        coll.incentiveSupplyToken = 'cbETH';
      }
    }
  }
  const base = formatBaseData(data[0].baseToken);

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