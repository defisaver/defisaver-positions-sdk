import * as sdk from '../src';
import { keccak256 } from 'viem';

const { assert } = require('chai');

// DEV-13004: offline validation of the 38 newly added Morpho Blue markets.
// Recomputes each Morpho marketId as keccak256(abi.encode(MarketParams)), where
// MarketParams = (loanToken, collateralToken, oracle, irm, lltv). Asserting the
// derived id equals the ticket marketId proves every address/oracle/irm/lltv is exact.

interface NewMarket { value: string; chainId: number; marketId: string; lltv: number; lltvWadHex: string; }

const NEW_MARKETS: NewMarket[] = [
  { value: 'morphoblueusdeusdc_915_base', chainId: 8453, marketId: '0x54cf9be57fdfa6457a660991907434ff9d295c465a603a50126ff647d50b7354', lltv: 0.915, lltvWadHex: '0000000000000000000000000000000000000000000000000cb2bba6f17b8000' },
  { value: 'morphobluecbethusdc_770_base', chainId: 8453, marketId: '0x0ca10126f6c94cbd9cf0a48cc9516ae5e3dec5aa68303e6d988ee37c5149bf0d', lltv: 0.77, lltvWadHex: '0000000000000000000000000000000000000000000000000aaf96eb9d0d0000' },
  { value: 'morphobluecbxrpusdc_625_base', chainId: 8453, marketId: '0xd4a903dc6d949519060c7707f9604fdc9772c046e05c2e3a8fce0bd7196e4109', lltv: 0.625, lltvWadHex: '00000000000000000000000000000000000000000000000008ac7230489e8000' },
  { value: 'morphoblueprimepyusd_860', chainId: 1, marketId: '0x41c41d0c9aadbf4751f5ee215ed5a16954a4b34e1b70fca5393d4b08858fa3fa', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluekbtcrlusd_860', chainId: 1, marketId: '0x15bb2a6af0c909eed19fb1f2ceeead34ecbdcba626de752c6b09389ee14eec32', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluekbtcpyusd_860', chainId: 1, marketId: '0xe51f9aaad25d0e755429cf77076b3c2d37cb1228ed81f8a5482f2102c220eef5', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluewstethusdc_860', chainId: 1, marketId: '0x7e585a933ffe8443c371b4f8cfeb4430f5f6a14c2f32a898c26662c67a1cb8b8', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluesyrupusdcpyusd_915', chainId: 1, marketId: '0xc9629945524f3fde56c7e8854a6c3d48e76b9d97236abbe73c750fcc7aeb8501', lltv: 0.915, lltvWadHex: '0000000000000000000000000000000000000000000000000cb2bba6f17b8000' },
  { value: 'morphobluewbtcusdc_860', chainId: 1, marketId: '0x09dc9e7eb5d8fc54b2bc41d1135fd4e99057a580f680321faeb90c7a21e631c1', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluecbbtcusdc_860_bc99de6a', chainId: 1, marketId: '0xbc99de6a88904cd0e69042ad6f266e63182801f030c636507c3caf590ffd84fe', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphoblueweethrlusd_860', chainId: 1, marketId: '0xea4bfb18df0ee6bffb7b3f0270899a8adb92ab6b684709634c8276128813cfd4', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphoblueweethpyusd_860', chainId: 1, marketId: '0x85d59152eeeab7ca024804895b358868d8dd1e134171be400d7792d5604a212c', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluecbbtcusdt_860', chainId: 1, marketId: '0x4fe72543c5c95cd6b5f3cb516cd235ba882e2e705fe3424db6f99dfe5811d0d3', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluelbtcpyusd_860', chainId: 1, marketId: '0x6a7e36eb088bd501d73f7ab4c5b8671358559341a78ce521c9e499dc0bc642b9', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluesusdepyusd_915', chainId: 1, marketId: '0x90ef0c5a0dc7c4de4ad4585002d44e9d411d212d2f6258e94948beecf8b4c0d5', lltv: 0.915, lltvWadHex: '0000000000000000000000000000000000000000000000000cb2bba6f17b8000' },
  { value: 'morphobluewbtcusdt_860', chainId: 1, marketId: '0x3c5a244b778095e1e1b2e44b7c2ecc9bf4fda9cd85cc22740e09205a7a4bf510', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluewstethusdt_860', chainId: 1, marketId: '0x6a57d77b9a173c5ed10d432e7009dd1ee9a97fac62a7bc970b4bd715e2fff5c8', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluesyrupusdcrlusd_915', chainId: 1, marketId: '0xc0ae375fd761ff19b3f04de5534c0f1ec110f80e1c2ede27c42c1c43c3040394', lltv: 0.915, lltvWadHex: '0000000000000000000000000000000000000000000000000cb2bba6f17b8000' },
  { value: 'morphoblueweethusdc_770', chainId: 1, marketId: '0x34377fc4f617c51818e92c79df31ff270c6a91bc94ad32e367fdf59b9f4ac5dd', lltv: 0.77, lltvWadHex: '0000000000000000000000000000000000000000000000000aaf96eb9d0d0000' },
  { value: 'morphoblueethusdc_860_94b823e6', chainId: 1, marketId: '0x94b823e6bd8ea533b4e33fbc307faea0b307301bc48763acc4d4aa4def7636cd', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphoblueusd3usdc_915', chainId: 1, marketId: '0xe3df58f9d3011b7481ff36b939fa5f8da642f34ea5792d25d3958dbf1efa26d7', lltv: 0.915, lltvWadHex: '0000000000000000000000000000000000000000000000000cb2bba6f17b8000' },
  { value: 'morphobluestusdsusdc_860', chainId: 1, marketId: '0xd570c19c0dc0fbe4ab7faf4a37c4150e1c141c8aada8ca3e1b4b6c1b712af93d', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluecbbtcrlusd_860', chainId: 1, marketId: '0xffd010618ed3cb39bb2c5de0e3e58d3d2ec9f52187a180f29723c31756a939bc', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluewbtceth_915', chainId: 1, marketId: '0x62aad0b7cfadc9d66eafe559ecd2a084f74062f396c193973b124db9fee481c4', lltv: 0.915, lltvWadHex: '0000000000000000000000000000000000000000000000000cb2bba6f17b8000' },
  { value: 'morphobluecbbtceth_915_12dbf493', chainId: 1, marketId: '0x12dbf4937132ff2c6445212519295ce9afbee3c765ba626af5b197fe6c3941a0', lltv: 0.915, lltvWadHex: '0000000000000000000000000000000000000000000000000cb2bba6f17b8000' },
  { value: 'morphoblueweethusdt_860', chainId: 1, marketId: '0xc2c53d2b868e163da71de14a5113cc2743fc9b5ad7488334720ed2846566a8f6', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluesyrupusdtusdt_915', chainId: 1, marketId: '0xa4774e3e693fff2ebd1dcbbd69b1b0a5b9bb0ccc753bfda5dd07bdac97c4818a', lltv: 0.915, lltvWadHex: '0000000000000000000000000000000000000000000000000cb2bba6f17b8000' },
  { value: 'morphobluecbbtcpyusd_860', chainId: 1, marketId: '0xd8a8e6667f58aa9229e8979bd619742b1660ee856c200a93e407dbccb7222323', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphoblueweethusdt_770', chainId: 1, marketId: '0x19cc9b90c4ecde78f4644f4d5ebc938fbadf30f6e4cae95485192f038b23e1f3', lltv: 0.77, lltvWadHex: '0000000000000000000000000000000000000000000000000aaf96eb9d0d0000' },
  { value: 'morphoblueethusdt_860', chainId: 1, marketId: '0x3758a9e2abbd67b5621f23ec482608f2f98b3c792874661ce49df7843aadcfd2', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluewbtcrlusd_860', chainId: 1, marketId: '0xa128dddc761075df9a9a60689f3a41a989b245aad506352c509c0c3a76a9ec6b', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluewbtcpyusd_860', chainId: 1, marketId: '0xbe50eed784490d6c32f398902b55eb5e1bd5af89e1f554993ad5fea899be090b', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphoblueweethusdc_860_arb', chainId: 42161, marketId: '0xd09404e9512e1341321c8ae3bd663fab7087582142ac61486635a6c072c2af12', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluesusdsusdt0_945_arb', chainId: 42161, marketId: '0xde895fd4a9d1ca693485fcfc2ee47d8c3b47f810bbce3c965c60d97b855d4ed2', lltv: 0.945, lltvWadHex: '0000000000000000000000000000000000000000000000000d1d507e40be8000' },
  { value: 'morphoblueweethusdt0_860_arb', chainId: 42161, marketId: '0xe0432ceb599fbe41defbd62fe8e914824af9d891a0a92c39de7063176c8e480b', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphoblueethusdt0_860_arb', chainId: 42161, marketId: '0xac6a118134cc4208a22534b041a83f4ac5ca42e2ab9ea732ee53c44b7deebc62', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluewstethusdt0_860_arb', chainId: 42161, marketId: '0x209fa1520640f664f59f7c1f955d52e8b81ead826edf439b48254d21d24b97a9', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
  { value: 'morphobluewbtcusdt0_860_arb', chainId: 42161, marketId: '0xed06d9e82d7c35ca80d3983194e15462a96202bd875800af18183321f4611868', lltv: 0.86, lltvWadHex: '0000000000000000000000000000000000000000000000000bef55718ad60000' },
];

const word = (addr: string) => addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');

const deriveMarketId = (m: sdk.MorphoBlueMarketData, lltvWadHex: string): string => keccak256(
  (`0x${word(m.loanToken)}${word(m.collateralToken)}${word(m.oracle)}${word(m.irm)}${lltvWadHex}`) as `0x${string}`,
);

describe('Morpho Blue — DEV-13004 new markets', () => {
  it('adds exactly 38 new markets', () => {
    assert.equal(NEW_MARKETS.length, 38);
  });

  for (const { value, chainId, marketId, lltv, lltvWadHex } of NEW_MARKETS) {
    it(`registers ${value} (chain ${chainId}) with a correctly derived marketId`, () => {
      const market = sdk.markets.MorphoBlueMarkets(chainId)[value as sdk.MorphoBlueVersions];
      assert.isDefined(market, `market ${value} is not registered in MorphoBlueMarkets`);
      assert.equal(market.value, value, 'market.value mismatch');
      assert.include(market.chainIds, chainId, 'chainIds does not include the market network');
      assert.equal(market.oracleType, sdk.MorphoBlueOracleType.MARKET_RATE);
      assert.equal(market.protocolName, 'morpho-blue');
      assert.equal(Number(market.lltv), lltv, 'lltv mismatch');
      for (const addr of [market.loanToken, market.collateralToken, market.oracle, market.irm]) {
        assert.match(addr, /^0x[0-9a-fA-F]{40}$/, `invalid address ${addr}`);
        assert.notEqual(addr.toLowerCase(), '0x0000000000000000000000000000000000000000');
      }
      assert.equal(market.marketId.toLowerCase(), marketId.toLowerCase(), 'stored marketId mismatch');
      assert.equal(deriveMarketId(market, lltvWadHex).toLowerCase(), marketId.toLowerCase(), 'keccak-derived marketId mismatch');
    });
  }

  it('has unique urls and values across the whole Morpho catalog', () => {
    const seenUrl = new Map<string, string>();
    const seenVal = new Set<string>();
    for (const net of [1, 8453, 42161]) {
      for (const market of Object.values(sdk.markets.MorphoBlueMarkets(net))) {
        const prev = seenUrl.get(market.url);
        if (prev !== undefined && prev !== market.value) {
          assert.fail(`duplicate url ${market.url} shared by ${market.value} and ${prev}`);
        }
        seenUrl.set(market.url, market.value);
        seenVal.add(market.value);
      }
    }
    for (const { value } of NEW_MARKETS) assert.isTrue(seenVal.has(value), `${value} missing from catalog`);
  });
});
