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
  before(async () => {
    provider = getProvider('RPC');
    providerOpt = getProvider('RPCOPT');
    providerBase = getProvider('RPCBASE');
    providerArb = getProvider('RPCARB');
  });

  const fetchPortfolioData = async (network: NetworkNumber, _provider: EthereumProvider) => {
    const portfolioData = await sdk.portfolio.getPortfolioData(_provider, network, provider, ['0xE86F331FB370c5Bbff0f7C81B29D64fA58e0c9c9', '0x21dc459fba0b1ea037cd221d35b928be1c26141a']);
    return portfolioData;
  };

  it('can fetch portfolio data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const portfolioData = await fetchPortfolioData(network, provider);
    console.log('Portfolio Data:', portfolioData);
  });

  it('can fetch portfolio slower data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const portfolioData = await sdk.portfolio.getPortfolioDataSlower(provider, network, ['0xE86F331FB370c5Bbff0f7C81B29D64fA58e0c9c9', '0xb4d3bea9d824c4dd7ded7ccc93e6212e3f0b186a']);
    console.log('Portfolio Slower Data:', portfolioData);
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
});