require('dotenv').config();
const { assert } = require('chai');
const Web3 = require('web3');

const sdk = require('../cjs');
const { NetworkNumber } = require('../cjs/types/common');

describe('Maker', () => {
  let web3;
  before(async () => {
    web3 = new Web3(process.env.RPC);
  });


  it('can fetch cdp data for Ethereum', async function () {
    this.timeout(10000);
    const network = NetworkNumber.Eth;

    const cdpInfo = await sdk.maker.getMakerCdpData(web3, network, '30126');
    // console.log(cdpInfo);
    assert.containsAllKeys(cdpInfo, [
      'owner',
      'userAddress',
      'id',
      'urn',
      'type',
      'ilk',
      'ilkLabel',
      'asset',
      'collateral',
      'collateralUsd',
      'futureDebt',
      'debtDai',
      'debtUsd',
      'debtInAsset',
      'debtAssetPrice',
      'debtAssetMarketPrice',
      'liquidationPrice',
      'ratio',
      'liqRatio',
      'liqPercent',
      'assetPrice',
      'daiLabel',
      'debtAsset',
      'unclaimedCollateral',
      'debtTooLow',
      'minDebt',
      'stabilityFee',
      'creatableDebt',
      'globalDebtCeiling',
      'globalDebtCurrent',
      'liquidationFee',
      'lastUpdated',
    ]);
  });
});