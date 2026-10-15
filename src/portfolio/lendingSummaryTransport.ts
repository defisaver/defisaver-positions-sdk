import {
  decodeFunctionData, decodeFunctionResult, encodeFunctionData, encodeFunctionResult, multicall3Abi,
} from 'viem';
import { EthereumProvider } from '../types/common';

const errorText = (error: unknown) => {
  const detail = error as { message?: string; code?: number; status?: number };
  return `${detail?.message || String(error)} ${detail?.code || ''} ${detail?.status || ''}`;
};
const logRangeLimit = (error: unknown) => /block range|too many (results|logs)|query returned|response.*size|range.*limit/i.test(errorText(error));
const oversized = (error: unknown) => /413|request.*(large|size)|response.*(large|size)|out of gas|gas (required|limit)|exceeds.*gas|execution.*limit/i.test(errorText(error));

export const isLendingSummaryRateLimit = (error: unknown): boolean => !oversized(error) && !logRangeLimit(error) && /429|rate.?limit|too many requests|compute units|limit exceeded/i.test(errorText(error));

/** One limiter for all reads, including split multicalls. No retries after cancellation/429. */
export function lendingSummaryTransport(provider: EthereumProvider, signal?: AbortSignal, blockNumber?: bigint, maxCalldataBytes = 32_000) {
  let pinnedBlock = blockNumber;
  let active = 0;
  let rateLimit: unknown;
  const waiting: (() => void)[] = [];
  const check = () => {
    if (signal?.aborted) throw new Error('Lending summary cancelled');
    // Keep the provider's original error code/message, including plain RPC error objects.
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    if (rateLimit !== undefined) throw rateLimit;
  };
  const send = async (args: Parameters<EthereumProvider['request']>[0]) => {
    if (active >= 4) await new Promise<void>(resolve => { waiting.push(resolve); });
    else active++;
    try {
      check();
      return await provider.request(args);
    } catch (error) {
      if (isLendingSummaryRateLimit(error)) rateLimit = error;
      throw error;
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  };
  const request: EthereumProvider['request'] = async (args) => {
    check();
    const params = [...(args.params || [])] as any[];
    if (pinnedBlock !== undefined) {
      const block = `0x${pinnedBlock.toString(16)}`;
      if (args.method === 'eth_blockNumber') return block;
      if (['eth_call', 'eth_getCode'].includes(args.method)) params[1] = block;
    }
    const call = params[0];
    const isMulticall = args.method === 'eth_call' && call?.data?.startsWith('0x82ad56cb');
    const splitMulticall = async (error: unknown) => {
      const { args: [calls] } = decodeFunctionData({ abi: multicall3Abi, data: call.data });
      if (!calls || calls.length < 2) throw error;
      // Sequential halves keep the same concurrency bound and retain per-call failures.
      const results = [];
      for (const half of [calls.slice(0, Math.ceil(calls.length / 2)), calls.slice(Math.ceil(calls.length / 2))]) {
        const data = encodeFunctionData({ abi: multicall3Abi, functionName: 'aggregate3', args: [half] });
        const encoded = await request({ ...args, params: [{ ...call, data }, ...params.slice(1)] });
        results.push(...decodeFunctionResult({ abi: multicall3Abi, functionName: 'aggregate3', data: encoded }));
      }
      return encodeFunctionResult({ abi: multicall3Abi, functionName: 'aggregate3', result: results });
    };
    // Viem's batch size counts inner calls only. Also bound the fully encoded calldata.
    if (isMulticall && (call.data.length - 2) / 2 > maxCalldataBytes) return splitMulticall(new Error('Single call exceeds summary calldata limit'));
    try {
      return await send({ ...args, params });
    } catch (error) {
      check();
      if (args.method === 'eth_getLogs' && logRangeLimit(error)) {
        const from = BigInt(call.fromBlock);
        const to = BigInt(call.toBlock);
        if (from >= to) throw error;
        const middle = (from + to) / BigInt(2);
        const first = await request({ ...args, params: [{ ...call, toBlock: `0x${middle.toString(16)}` }] });
        const last = await request({ ...args, params: [{ ...call, fromBlock: `0x${(middle + BigInt(1)).toString(16)}` }] });
        return [...first, ...last];
      }
      if (!isMulticall || !oversized(error)) throw error;
      return splitMulticall(error);
    }
  };
  return { provider: { request } as EthereumProvider, isRateLimited: () => rateLimit !== undefined, pinBlock: (value: bigint) => { pinnedBlock = value; } };
}
