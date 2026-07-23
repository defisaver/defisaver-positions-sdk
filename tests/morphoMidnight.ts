import 'dotenv/config';
import Dec from 'decimal.js';

import * as sdk from '../src';

import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { MorphoMidnightMarketData, MorphoMidnightMarketInfo } from '../src/types';
import { getProvider } from './utils/getProvider';
import { getViemProvider } from '../src/services/viem';
import { MorphoMidnightViewContractViem } from '../src/contracts';

const { assert } = require('chai');

// Known Base positions in the cbBTC/USDC market (0x168e31...), used to validate the getters against
// live on-chain state. Assertions are written to stay green even if these positions later change.
const BORROWER = '0x37A87cA1ef98Ea3Fc6bDa550538d9aEd38D77E99';
const LENDER = '0xD1373084D7c99d8C20C11371e2eA968a7B90e5d6';

const isPositive = (value: bigint): boolean => new Dec(value.toString()).gt(0);

// Rebuild the on-chain Market struct from the hardcoded config so we can recompute its id.
const marketToStruct = (market: MorphoMidnightMarketData, network: NetworkNumber) => ({
  chainId: BigInt(network),
  midnight: market.midnight as `0x${string}`,
  loanToken: market.loanToken as `0x${string}`,
  collateralParams: market.collaterals.map((c) => ({
    token: c.token as `0x${string}`,
    lltv: BigInt(new Dec(c.lltv).mul(1e18).toFixed(0)),
    liquidationCursor: BigInt(c.liquidationCursor),
    oracle: c.oracle as `0x${string}`,
  })),
  maturity: BigInt(market.maturity),
  rcfThreshold: BigInt(market.rcfThreshold),
  enterGate: market.enterGate as `0x${string}`,
  liquidatorGate: market.liquidatorGate as `0x${string}`,
});

describe('Morpho Midnight', function midnightSuite() {
  this.timeout(60000);
  const network = NetworkNumber.Base;
  let provider: EthereumProvider;

  before(() => {
    provider = getProvider('RPCBASE');
  });

  const markets = () => Object.values(sdk.markets.MorphoMidnightMarkets(network)) as MorphoMidnightMarketData[];

  const fetchMarketData = async (selectedMarket: MorphoMidnightMarketData): Promise<MorphoMidnightMarketInfo> => {
    const marketData = await sdk.morphoMidnight.getMorphoMidnightMarketData(provider, network, selectedMarket);

    assert.containsAllKeys(marketData, ['assetsData', 'maturity', 'isMatured', 'totalDebt', 'withdrawable', 'tickSpacing']);
    assert.isAbove(marketData.maturity, 0);
    assert.isNumber(marketData.tickSpacing);

    // loan token + every collateral must be present in assetsData with the standard fields
    const expectedSymbols = [marketData.loanToken, ...marketData.collaterals];
    assert.containsAllKeys(marketData.assetsData, expectedSymbols);
    for (const symbol of expectedSymbols) {
      const tokenData = marketData.assetsData[symbol];
      for (const key of ['symbol', 'price', 'supplyRate', 'borrowRate'] as const) {
        assert.isDefined(tokenData[key], `${key} is undefined for ${symbol}`);
      }
    }
    // collateral prices come from the market oracle (prices[]) and should be positive
    for (const collSymbol of marketData.collaterals) {
      assert.isTrue(new Dec(marketData.assetsData[collSymbol].price).gt(0), `collateral ${collSymbol} price should be > 0`);
    }
    return marketData;
  };

  it('fetches market data for every curated market', async () => {
    for (const market of markets()) {
      await fetchMarketData(market);
    }
  });

  it('has marketIds that match MidnightView.toId(struct)', async () => {
    const client = getViemProvider(provider, network);
    const view = MorphoMidnightViewContractViem(client, network);
    for (const market of markets()) {
      const id = await view.read.toId([marketToStruct(market, network)]);
      assert.strictEqual(id.toLowerCase(), market.marketId.toLowerCase(), `toId mismatch for ${market.value}`);
    }
  });

  it('reads a borrower position consistently with on-chain state', async () => {
    const market = sdk.markets.MorphoMidnightMarkets(network)[sdk.MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base];
    const marketInfo = await fetchMarketData(market);

    const client = getViemProvider(provider, network);
    const view = MorphoMidnightViewContractViem(client, network);
    const onChain = await view.read.getPositionInfo([market.marketId as `0x${string}`, BORROWER as `0x${string}`]);

    const accData = await sdk.morphoMidnight.getMorphoMidnightAccountData(provider, network, BORROWER as any, market, marketInfo);

    assert.isTrue(new Dec(accData.debt).gte(0));
    assert.strictEqual(new Dec(accData.borrowedUsd).gt(0), isPositive(onChain.debt));

    if (isPositive(onChain.debt)) {
      // computed ratio (%) must match the on-chain ratio (1e18-scaled) to within rounding
      const onChainRatioPct = new Dec(onChain.ratio.toString()).div(1e18).mul(100);
      assert.approximately(+accData.ratio, onChainRatioPct.toNumber(), 0.5, 'computed ratio should match on-chain ratio');
      assert.isTrue(new Dec(accData.usedAssets.cbBTC.supplied).gt(0), 'borrower should have cbBTC collateral');
      assert.isFalse(accData.usedAssets.USDC.isSupplied);
      assert.isTrue(accData.usedAssets.USDC.isBorrowed);
    }
  });

  it('reads a lender (credit) earn position', async () => {
    const market = sdk.markets.MorphoMidnightMarkets(network)[sdk.MorphoMidnightVersions.MorphoMidnightCbBTCUSDC_860_20260731_Base];
    const marketInfo = await fetchMarketData(market);

    const client = getViemProvider(provider, network);
    const view = MorphoMidnightViewContractViem(client, network);
    const onChain = await view.read.getPositionInfo([market.marketId as `0x${string}`, LENDER as `0x${string}`]);

    const earn = await sdk.morphoMidnight.getMorphoMidnightEarn(client, network, LENDER as any, market, marketInfo);
    assert.containsAllKeys(earn, ['apy', 'amount', 'amountUsd']);
    assert.strictEqual(new Dec(earn.amount).gt(0), isPositive(onChain.credit));

    if (isPositive(onChain.credit)) {
      assert.isTrue(new Dec(earn.amountUsd).gt(0));
      const accData = await sdk.morphoMidnight.getMorphoMidnightAccountData(provider, network, LENDER as any, market, marketInfo);
      assert.isTrue(accData.usedAssets.USDC.isSupplied, 'lender should have supplied USDC (credit)');
      assert.isFalse(accData.usedAssets.USDC.isBorrowed);
    }
  });
});
