import 'dotenv/config';
import { parseAbi, getAddress } from 'viem';
import * as sdk from '../src';
import { NetworkNumber } from '../src/types/common';
import { getViemProvider } from '../src/services/viem';
import { getProvider } from './utils/getProvider';

// Direct on-chain probe of Rajko's AaveV3View — bypasses the SDK fetch. Resolves each input EOA's
// DSProxy via BOTH the Maker and DFS proxy registries (the address that usually OWNS the Aave position
// in DFS) and probes those too. Run: `npx mocha tests/ltv0Probe.ts`.
const VIEW_ABI = parseAbi([
  'function getSafetyRatio(address,address) view returns (uint256)',
  'function getSafetyRatioWithLtvZeroFallback(address,address) view returns (uint256)',
]);

const ZERO = '0x0000000000000000000000000000000000000000';
const MAKER_REGISTRY = '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4';
const DFS_REGISTRY = '0x29474FdaC7142f9aB7773B8e38264FA15E3805ed'; // DFS proxy registry (mainnet)
const MAKER_ABI = parseAbi(['function proxies(address) view returns (address)']);
const DFS_ABI = parseAbi(['function getAllProxies(address) view returns (address, address[])']);

const NETS = [
  { n: NetworkNumber.Eth, addr: '0x3C901d26a72055Df113309af8A104A13A1E3b77c', rpc: 'RPC', markets: [sdk.AaveVersions.AaveV3, sdk.AaveVersions.AaveV3Lido, sdk.AaveVersions.AaveV3Etherfi] },
  { n: NetworkNumber.Opt, addr: '0xcc3E5093383f99F1a0766E75644960bfbb90c033', rpc: 'RPCOPT', markets: [sdk.AaveVersions.AaveV3] },
  { n: NetworkNumber.Arb, addr: '0x552e7f9f2D7348e2F4467F0cD04949c267050232', rpc: 'RPCARB', markets: [sdk.AaveVersions.AaveV3] },
  { n: NetworkNumber.Base, addr: '0x013831ACd6dE51EF9969727cDE90d4bb22B4Aa7d', rpc: 'RPCBASE', markets: [sdk.AaveVersions.AaveV3] },
];

const EOAS = [
  '0x2f6c2c5ec912449a914930442522368ee99fa845',
  '0x1d768128b0a8d4ce1cc72e872b3ccdc871518d8e',
];

describe('LTV-0 probe — direct on-chain AaveV3View (+ DSProxy resolution)', () => {
  it('reads getSafetyRatio + fallback for EOA and its DSProxies', async function () {
    this.timeout(180000);

    let ethProvider: any;
    try { ethProvider = getProvider('RPC'); } catch { /* skip */ }
    const targets: { label: string, addr: `0x${string}` }[] = [];

    for (const eoa of EOAS) {
      const user = getAddress(eoa);
      targets.push({ label: `EOA ${user}`, addr: user });
      if (!ethProvider) continue;
      const client = getViemProvider(ethProvider, NetworkNumber.Eth);
      const found = new Set<string>();
      try {
        const p = await client.readContract({ address: MAKER_REGISTRY as `0x${string}`, abi: MAKER_ABI, functionName: 'proxies', args: [user] }) as string;
        if (p && p !== ZERO) found.add(getAddress(p));
      } catch (e: any) { console.log(`Maker proxies(${user}) ERR: ${e?.shortMessage || e?.message}`); }
      try {
        const res = await client.readContract({ address: DFS_REGISTRY as `0x${string}`, abi: DFS_ABI, functionName: 'getAllProxies', args: [user] }) as [string, readonly string[]];
        const main = res[0];
        const others = res[1] || [];
        if (main && main !== ZERO) found.add(getAddress(main));
        for (const o of others) if (o && o !== ZERO) found.add(getAddress(o));
      } catch (e: any) { console.log(`DFS getAllProxies(${user}) ERR: ${e?.shortMessage || e?.message}`); }

      if (found.size === 0) console.log(`${user}: no DSProxy in Maker or DFS registry (likely a Safe smart wallet)`);
      for (const p of found) targets.push({ label: `DSProxy of ${user} -> ${p}`, addr: p as `0x${string}` });
    }

    for (const t of targets) {
      console.log(`\n=== ${t.label} ===`);
      for (const net of NETS) {
        let provider;
        try { provider = getProvider(net.rpc); } catch { continue; }
        const client = getViemProvider(provider, net.n);
        for (const v of net.markets) {
          const market = (sdk.markets.AaveMarkets(net.n) as any)[v];
          const mkt = getAddress(market.providerAddress);
          try {
            const [s, f] = await Promise.all([
              client.readContract({ address: net.addr as `0x${string}`, abi: VIEW_ABI, functionName: 'getSafetyRatio', args: [mkt, t.addr] }),
              client.readContract({ address: net.addr as `0x${string}`, abi: VIEW_ABI, functionName: 'getSafetyRatioWithLtvZeroFallback', args: [mkt, t.addr] }),
            ]) as [bigint, bigint];
            if (s !== BigInt(0) || f !== BigInt(0)) {
              const tag = (s !== f) ? '   <-- DIFFERS (LTV-0 present!)' : '';
              console.log(`  [${net.n}/${String(v)}] getSafetyRatio=${s.toString()}  fallback=${f.toString()}${tag}`);
            }
          } catch (e: any) {
            console.log(`  [${net.n}/${String(v)}] ERR ${e?.shortMessage || e?.message}`);
          }
        }
      }
    }
  });
});
