import 'dotenv/config';

import * as sdk from '../src';

import { EthereumProvider, NetworkNumber } from '../src/types/common';
import { getProvider } from './utils/getProvider';

const { assert } = require('chai');

describe('Portfolio', () => {
  let provider: EthereumProvider;
  let providerBase: EthereumProvider;
  let providerOpt: EthereumProvider;
  let providerArb: EthereumProvider;
  let providerLinea: EthereumProvider;
  let providerPlasma: EthereumProvider;
  before(async () => {
    provider = getProvider('RPC');
    providerOpt = getProvider('RPCOPT');
    providerBase = getProvider('RPCBASE');
    providerArb = getProvider('RPCARB');
    providerLinea = getProvider('RPCLINEA');
    providerPlasma = getProvider('RPCPLASMA');
  });

  const fetchPortfolioData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const portfolioData = await sdk.portfolio.getPortfolioData(_provider, network, provider, ['0xE86F331FB370c5Bbff0f7C81B29D64fA58e0c9c9', '0x21dc459fba0b1ea037cd221d35b928be1c26141a']);
    return portfolioData;
  };

  it('can fetch portfolio data for Ethereum', async function () {
    this.timeout(20000);
    const network = NetworkNumber.Eth;

    const portfolioData = await fetchPortfolioData(network, provider);
    // console.log('Portfolio Data:', portfolioData);
  });

  it('can fetch portfolio data for Arbitrum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Arb;

    const portfolioData = await fetchPortfolioData(network, providerArb);
  });

  it('can fetch portfolio data for Optimism', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Opt;

    const portfolioData = await fetchPortfolioData(network, providerOpt);
  });

  it('can fetch portfolio data for Base', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Base;

    const portfolioData = await fetchPortfolioData(network, providerBase);
  });

  it('can fetch portfolio data for Linea', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Linea;

    const portfolioData = await fetchPortfolioData(network, providerLinea);
  });

  it('can fetch portfolio data for Plasma', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Plasma;

    const portfolioData = await fetchPortfolioData(network, providerPlasma);
  });

  const fetchShifterPortfolioData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const portfolioData = await sdk.portfolio.getShifterPortfolioData(_provider, network, provider, ['0xE86F331FB370c5Bbff0f7C81B29D64fA58e0c9c9', '0x21dc459fba0b1ea037cd221d35b928be1c26141a']);
    assert.hasAllKeys(portfolioData, ['positions', 'markets']);
    assert.containsAllKeys(portfolioData.markets, ['fluidMarketsData', 'makerMarketsData']);
    return portfolioData;
  };

  it('can fetch shifter portfolio data for Ethereum', async function () {
    this.timeout(30000);
    const network = NetworkNumber.Eth;

    const portfolioData = await fetchShifterPortfolioData(network, provider);

    assert.isNotEmpty(portfolioData.markets.fluidMarketsData);
    assert.containsAllKeys(portfolioData.markets.makerMarketsData, ['ETH-A', 'ETH-B', 'ETH-C', 'WSTETH-A', 'WSTETH-B', 'WBTC-A', 'WBTC-B', 'WBTC-C']);
    const ethA = portfolioData.markets.makerMarketsData['ETH-A'];
    assert.hasAllKeys(ethA, [
      'ilkLabel', 'currentRate', 'futureRate', 'minDebt', 'globalDebtCeiling', 'globalDebtCurrent',
      'assetPrice', 'liqRatio', 'liqPercent', 'stabilityFee', 'liquidationFee', 'creatableDebt',
    ]);
    assert.equal(ethA.ilkLabel, 'ETH-A');
    assert.isAbove(+ethA.assetPrice, 0);
    assert.isAbove(+ethA.liqRatio, 1);
    assert.isAbove(+ethA.minDebt, 0);
    // console.log('Shifter Portfolio Data:', portfolioData);
  });

  it('can fetch shifter portfolio data for Arbitrum', async function () {
    this.timeout(15000);
    const network = NetworkNumber.Arb;

    const portfolioData = await fetchShifterPortfolioData(network, providerArb);
    assert.isNotEmpty(portfolioData.markets.fluidMarketsData);
    assert.isEmpty(portfolioData.markets.makerMarketsData);
  });

  it('can fetch shifter portfolio data for Optimism', async function () {
    this.timeout(15000);
    const network = NetworkNumber.Opt;

    const portfolioData = await fetchShifterPortfolioData(network, providerOpt);
    assert.isEmpty(portfolioData.markets.fluidMarketsData);
    assert.isEmpty(portfolioData.markets.makerMarketsData);
  });

  it('can fetch shifter portfolio data for Base', async function () {
    this.timeout(15000);
    const network = NetworkNumber.Base;

    const portfolioData = await fetchShifterPortfolioData(network, providerBase);
    assert.isNotEmpty(portfolioData.markets.fluidMarketsData);
  });

  it('can fetch shifter portfolio data for Plasma', async function () {
    this.timeout(15000);
    const network = NetworkNumber.Plasma;

    await fetchShifterPortfolioData(network, providerPlasma);
  });
});