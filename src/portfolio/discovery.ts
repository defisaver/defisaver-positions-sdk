import Dec from 'decimal.js';
import {
  Blockish, EthAddress, EthereumProvider, NetworkNumber, PositionBalances,
} from '../types/common';
import { getViemProvider, setViemBlockNumber } from '../services/viem';
import {
  AaveMarkets,
  AaveV4Spokes,
  CompoundMarkets,
  CrvUsdMarkets,
  LlamaLendMarkets,
  MorphoBlueMarkets,
  SparkMarkets,
} from '../markets';
import { AaveVersions, CompoundVersions } from '../types';
import { _getAaveV4AccountBalances } from '../aaveV4';
import { _getCompoundV2AccountBalances } from '../compoundV2';
import { _getCompoundV3AccountBalances } from '../compoundV3';
import { _getCrvUsdAccountBalances } from '../curveUsd';
import { _getLlamaLendAccountBalances } from '../llamaLend';
import { _getMorphoBlueAccountBalances } from '../morphoBlue';

// Aave-style `Pool.getUserAccountData(user)` — shared by Aave V2/V3(+Lido/Etherfi) and Spark.
// A single aggregate read per market, far cheaper than enumerating reserve token balances.
const AAVE_POOL_ABI = [{
  type: 'function',
  name: 'getUserAccountData',
  stateMutability: 'view',
  inputs: [{ name: 'user', type: 'address' }],
  outputs: [
    { name: 'totalCollateralBase', type: 'uint256' },
    { name: 'totalDebtBase', type: 'uint256' },
    { name: 'availableBorrowsBase', type: 'uint256' },
    { name: 'currentLiquidationThreshold', type: 'uint256' },
    { name: 'ltv', type: 'uint256' },
    { name: 'healthFactor', type: 'uint256' },
  ],
}] as const;

const hasAnyBalance = (balances: PositionBalances): boolean => (
  [balances.collateral, balances.debt].some(
    (group) => Object.values(group || {}).some((amount) => new Dec((amount as string) || '0').gt(0)),
  )
);

/**
 * Cheap "does this address have a position here" check across all money-market protocols,
 * keyed by each market/spoke's `.value`. Built for UI flows (e.g. Loan Shifter) that need to
 * know *which* markets to show, without paying for a full manage-data fetch of every market.
 *
 * Uses one shared, multicall-batched viem client (same pattern as getPortfolioData) so all
 * per-market reads collapse into a handful of RPC round trips.
 *
 * Not covered: Maker, Liquity, Liquity V2, Fluid, Euler V2 — these already expose cheap,
 * user-scoped discovery entry points elsewhere in the SDK (e.g. _getUserCdps, _getUserPositionsPortfolio).
 */
export async function getUserPositionsExistence(
  provider: EthereumProvider,
  network: NetworkNumber,
  address: EthAddress,
  isSim = false,
): Promise<Record<string, boolean>> {
  const existence: Record<string, boolean> = {};
  if (!address) return existence;

  const client = getViemProvider(provider, network, { batch: { multicall: { batchSize: isSim ? 500_000 : 2_500_000 } } });
  const block: Blockish = 'latest';

  const tasks: Promise<void>[] = [];

  const aaveV3Markets = [AaveVersions.AaveV2, AaveVersions.AaveV3, AaveVersions.AaveV3Lido, AaveVersions.AaveV3Etherfi]
    .map((version) => AaveMarkets(network)[version])
    .filter((market) => market.chainIds.includes(network) && market.lendingPoolAddress);
  const sparkMarkets = Object.values(SparkMarkets(network)).filter((market) => market.chainIds.includes(network));

  [...aaveV3Markets, ...sparkMarkets].forEach((market) => {
    tasks.push(
      client.readContract({
        address: market.lendingPoolAddress as EthAddress,
        abi: AAVE_POOL_ABI,
        functionName: 'getUserAccountData',
        args: [address],
        ...setViemBlockNumber(block),
      }).then(([totalCollateral, totalDebt]) => {
        existence[market.value] = new Dec(totalCollateral.toString()).gt(0) || new Dec(totalDebt.toString()).gt(0);
      }).catch(() => { existence[market.value] = true; }),
    );
  });

  const balanceTask = (key: string, getBalances: () => Promise<PositionBalances>) => getBalances()
    .then((balances) => { existence[key] = hasAnyBalance(balances); })
    .catch(() => { existence[key] = true; });

  Object.values(AaveV4Spokes(network)).filter((spoke) => spoke.chainIds.includes(network)).forEach((spoke) => {
    tasks.push(balanceTask(spoke.value, () => _getAaveV4AccountBalances(client, network, block, false, address, spoke.address)));
  });

  const compoundV3Markets = Object.values(CompoundMarkets(network)).filter((market) => market.chainIds.includes(network) && market.value !== CompoundVersions.CompoundV2);
  const compoundV2Markets = [CompoundVersions.CompoundV2].map((version) => CompoundMarkets(network)[version]).filter((market) => market.chainIds.includes(network));

  compoundV2Markets.forEach((market) => {
    tasks.push(balanceTask(market.value, () => _getCompoundV2AccountBalances(client, network, block, false, address)));
  });
  compoundV3Markets.forEach((market) => {
    tasks.push(balanceTask(market.value, () => _getCompoundV3AccountBalances(client, network, block, false, address, market.baseMarketAddress)));
  });

  if (network === NetworkNumber.Eth) {
    Object.values(CrvUsdMarkets(network)).filter((market) => market.chainIds.includes(network)).forEach((market) => {
      tasks.push(balanceTask(market.value, () => _getCrvUsdAccountBalances(client, network, block, false, address, market.controllerAddress)));
    });
  }

  const llamaLendMarkets = [NetworkNumber.Eth, NetworkNumber.Arb].includes(network) ? Object.values(LlamaLendMarkets(network)).filter((market) => market.chainIds.includes(network)) : [];
  llamaLendMarkets.forEach((market) => {
    tasks.push(balanceTask(market.value, () => _getLlamaLendAccountBalances(client, network, block, false, address, market.controllerAddress)));
  });

  Object.values(MorphoBlueMarkets(network)).filter((market) => market.chainIds.includes(network)).forEach((market) => {
    tasks.push(balanceTask(market.value, () => _getMorphoBlueAccountBalances(client, network, block, false, address, market)));
  });

  await Promise.all(tasks);
  return existence;
}
