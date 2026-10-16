import Dec from 'decimal.js';
import { getAssetInfoByAddress } from '@defisaver/tokens';
import { Client } from 'viem';
import { AaveMarketInfo, SparkMarketData } from '../types';
import {
  Blockish, EthAddress, NetworkNumber, PositionBalances,
} from '../types/common';
import { createViemContractFromConfigFunc } from '../contracts';
import { setViemBlockNumber } from '../services/viem';
import { wethToEth, wethToEthByAddress } from '../services/utils';

/** Raw token balances shared by Aave/Spark getters and lending previews. */
export async function getAaveLikeBalances(
  client: Client, network: NetworkNumber, block: Blockish, addressMapping: boolean,
  address: EthAddress, market: Pick<AaveMarketInfo | SparkMarketData, 'providerAddress' | 'protocolData' | 'protocolDataAddress'>,
  view: 'AaveLoanInfoV2' | 'AaveV3View' | 'SparkView', tokens?: EthAddress[],
): Promise<PositionBalances> {
  const balances: PositionBalances = { collateral: {}, debt: {} };
  if (!address) return balances;
  let reserves: { tokenAddress: EthAddress; symbol: string }[];
  if (tokens) reserves = tokens.map(tokenAddress => ({ tokenAddress, symbol: getAssetInfoByAddress(tokenAddress, network).symbol }));
  else {
    if (!market.protocolData) throw new Error('Missing protocol data provider');
    reserves = [...await createViemContractFromConfigFunc(market.protocolData, market.protocolDataAddress as EthAddress)(client, network)
      .read.getAllReservesTokens(setViemBlockNumber(block))];
  }
  const addresses = reserves.map(token => token.tokenAddress);
  const contract = createViemContractFromConfigFunc(view)(client, network, block);
  const middle = tokens ? Math.ceil(addresses.length / 2) : Math.floor(addresses.length / 2);
  // Preserve legacy V2 single-call and V3/Spark two-call behavior.
  const parts = !tokens && view === 'AaveLoanInfoV2' ? [addresses] : [addresses.slice(0, middle), addresses.slice(middle)];
  const data = (await Promise.all((tokens ? parts.filter(part => part.length) : parts)
    .map(part => contract.read.getTokenBalances([market.providerAddress, address, part], setViemBlockNumber(block))))).flat();
  data.forEach((token, i) => {
    // The views leave token.token unset; input order identifies the reserve.
    const key = addressMapping ? wethToEthByAddress(reserves[i].tokenAddress, network).toLowerCase() : wethToEth(reserves[i].symbol);
    balances.collateral![key] = token.balance.toString();
    balances.debt![key] = new Dec(token.borrowsStable.toString()).add(token.borrowsVariable.toString()).toString();
  });
  return balances;
}
