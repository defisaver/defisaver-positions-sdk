import { Client } from 'viem';
import Dec from 'decimal.js';
import { assetAmountInEth, getAssetInfoByAddress } from '@defisaver/tokens';
import { getViemProvider } from '../services/viem';
import {
  AaveV4AccountData,
  AaveV4HubAssetOnChainData,
  AaveV4HubOnChainData,
  AaveV4ReserveAssetData,
  AaveV4ReserveAssetOnChain,
  AaveV4SpokeData,
  AaveV4SpokeInfo,
  AaveV4UsedReserveAssets,
  AaveV4AssetsData,
  EthAddress,
  EthereumProvider,
  IncentiveData,
  IncentiveKind,
  NetworkNumber,
} from '../types';
import { AaveV4ViewContractViem } from '../contracts';
import { getStakingApy, STAKING_ASSETS } from '../staking';
import { wethToEth } from '../services/utils';
import { aaveV4GetAggregatedPositionData } from '../helpers/aaveV4Helpers';
import { getAaveV4HubByAddress } from '../markets/aaveV4';
import { aprToApy } from '../moneymarket';

export * as lend from './lend';

const fetchHubData = async (viewContract: ReturnType<typeof AaveV4ViewContractViem>, hubAddress: EthAddress): Promise<AaveV4HubOnChainData> => {
  const hubData = await viewContract.read.getHubAllAssetsData([hubAddress]);
  return {
    assets: hubData.reduce((acc: Record<number, AaveV4HubAssetOnChainData>, assetOnChainData) => {
      acc[assetOnChainData.assetId] = {
        assetId: assetOnChainData.assetId,
        drawnRate: assetOnChainData.drawnRate,
        liquidity: assetOnChainData.liquidity,
        liquidityFee: assetOnChainData.liquidityFee,
        swept: assetOnChainData.swept,
        totalDrawn: assetOnChainData.totalDrawn,
        totalDrawnShares: assetOnChainData.totalDrawnShares,
        totalPremiumShares: assetOnChainData.totalPremiumShares,
      };
      return acc;
    }, {}),
  };
};

const calcUserRiskPremiumBps = (usedAssets: AaveV4UsedReserveAssets, assetsData: AaveV4AssetsData): number => {
  type CollateralInfo = { riskBps: number; valueUsd: Dec };
  type DebtInfo = { valueUsd: Dec };

  const collaterals: CollateralInfo[] = [];
  const debts: DebtInfo[] = [];

  Object.entries(usedAssets).forEach(([identifier, asset]) => {
    const reserveData = assetsData[identifier];
    if (!reserveData) return;

    const borrowedUsdDec = new Dec(asset.borrowedUsd || '0');
    if (asset.isBorrowed && borrowedUsdDec.gt(0)) {
      debts.push({ valueUsd: borrowedUsdDec });
    }

    const suppliedUsdDec = new Dec(asset.suppliedUsd || '0');
    const isActiveCollateral = asset.collateral
      && asset.isSupplied
      && asset.collateralFactor > 0
      && suppliedUsdDec.gt(0);

    if (isActiveCollateral) {
      // collateralRisk is stored as a fraction (e.g. 0.25), convert back to bps
      const riskBps = new Dec(reserveData.collateralRisk).mul(10000).toNumber();
      collaterals.push({
        riskBps,
        valueUsd: suppliedUsdDec,
      });
    }
  });

  const totalDebtUsd = debts.reduce((sum, d) => sum.add(d.valueUsd), new Dec(0));

  if (totalDebtUsd.lte(0)) {
    return 0;
  }

  // sort by risk ASC, value DESC
  collaterals.sort((a, b) => {
    if (a.riskBps !== b.riskBps) return a.riskBps - b.riskBps;
    return b.valueUsd.comparedTo(a.valueUsd);
  });

  let debtLeftToCover = totalDebtUsd;
  let numerator = new Dec(0); // sum(coveredUsd * riskBps)
  let coveredDebt = new Dec(0); // sum(coveredUsd)

  collaterals.forEach(({ riskBps, valueUsd }) => {
    if (debtLeftToCover.lte(0)) return;

    const coveredUsd = Dec.min(valueUsd, debtLeftToCover);

    numerator = numerator.add(coveredUsd.mul(riskBps));
    coveredDebt = coveredDebt.add(coveredUsd);

    debtLeftToCover = debtLeftToCover.sub(coveredUsd);
  });

  if (coveredDebt.lte(0)) {
    return 0;
  }

  const riskPremiumBps = numerator.div(coveredDebt);
  return riskPremiumBps.toNumber();
};

const formatReserveAsset = async (reserveAsset: AaveV4ReserveAssetOnChain, hubAsset: AaveV4HubAssetOnChainData, reserveId: number, oracleDecimals: number, network: NetworkNumber): Promise<AaveV4ReserveAssetData> => {
  const assetInfo = getAssetInfoByAddress(reserveAsset.underlying, network);
  const symbol = wethToEth(assetInfo.symbol);
  const hubInfo = getAaveV4HubByAddress(network, reserveAsset.hub);
  if (!hubInfo) {
    throw new Error(`Hub not found with address: ${reserveAsset.hub}`);
  }

  const isStakingAsset = STAKING_ASSETS.includes(symbol);
  const supplyIncentives: IncentiveData[] = [];
  const borrowIncentives: IncentiveData[] = [];

  if (isStakingAsset) {
    const yieldApy = await getStakingApy(symbol, network as NetworkNumber);
    supplyIncentives.push({
      apy: yieldApy,
      token: symbol,
      incentiveKind: IncentiveKind.Staking,
      description: `Native ${symbol} yield.`,
    });
    if (reserveAsset.borrowable) {
      // when borrowing assets whose value increases over time
      borrowIncentives.push({
        apy: new Dec(yieldApy).mul(-1).toString(),
        token: symbol,
        incentiveKind: IncentiveKind.Reward,
        description: `Due to the native yield of ${symbol}, the value of the debt would increase over time.`,
      });
    }
  }

  const totalSuppliedRaw = reserveAsset.totalSupplied ?? 0;
  const totalDrawnRaw = reserveAsset.totalDrawn ?? 0;
  const totalPremiumRaw = reserveAsset.totalPremium ?? 0;
  const totalDebtRaw = reserveAsset.totalDebt ?? 0;
  const supplyCapRaw = reserveAsset.supplyCap ?? 0;
  const borrowCapRaw = reserveAsset.borrowCap ?? 0;

  /** @DEV Hub related calculations */
  const drawnRate = new Dec(hubAsset.drawnRate.toString()).div(new Dec(10).pow(27));
  const borrowApr = drawnRate.mul(100);
  const totalDrawn = new Dec(hubAsset.totalDrawn.toString());
  const liquidity = new Dec(hubAsset.liquidity.toString());
  const swept = new Dec(hubAsset.swept.toString());
  const hubUtilization = totalDrawn.div(totalDrawn.add(swept).add(liquidity));
  const liquidityFee = new Dec(hubAsset.liquidityFee.toString()).div(new Dec(10).pow(4));
  const totalDrawnShares = new Dec(hubAsset.totalDrawnShares.toString());
  const totalPremiumShares = new Dec(hubAsset.totalPremiumShares.toString());
  // TODO JK@JK premiumMultiplier should be added to supplyApr calculation (.mul(premiumMultiplier)
  // TODO JKJ@JK when we confirm that this is the right way to calculate it
  const premiumMultiplier = totalDrawnShares.add(totalPremiumShares).div(totalDrawnShares);
  const supplyApr = borrowApr.mul(hubUtilization).mul(new Dec(1).minus(liquidityFee));

  return ({
    symbol,
    underlying: reserveAsset.underlying,
    hub: hubInfo.address,
    hubName: hubInfo?.label,
    assetId: reserveAsset.assetId,
    reserveId,
    paused: reserveAsset.paused,
    frozen: reserveAsset.frozen,
    borrowable: reserveAsset.borrowable,
    collateralRisk: new Dec(reserveAsset.collateralRisk).div(10000).toNumber(),
    collateralFactor: new Dec(reserveAsset.collateralFactor).div(10000).toNumber(),
    liquidationFee: new Dec(reserveAsset.liquidationFee).div(10000).toNumber(),
    price: new Dec(reserveAsset.price).div(new Dec(10).pow(oracleDecimals)).toString(),
    totalSupplied: assetAmountInEth(totalSuppliedRaw.toString(), symbol),
    totalDrawn: assetAmountInEth(totalDrawnRaw.toString(), symbol),
    totalPremium: assetAmountInEth(totalPremiumRaw.toString(), symbol),
    totalDebt: assetAmountInEth(totalDebtRaw.toString(), symbol),
    supplyCap: assetAmountInEth(supplyCapRaw.toString(), symbol),
    borrowCap: assetAmountInEth(borrowCapRaw.toString(), symbol),
    spokeActive: reserveAsset.spokeActive,
    spokeHalted: reserveAsset.spokeHalted,
    drawnRate: drawnRate.toString(),
    borrowRate: aprToApy(borrowApr.toString()),
    supplyRate: aprToApy(supplyApr.toString()),
    supplyIncentives,
    borrowIncentives,
    canBeBorrowed: reserveAsset.spokeActive && !reserveAsset.spokeHalted && !reserveAsset.paused && !reserveAsset.frozen,
    canBeSupplied: reserveAsset.spokeActive && !reserveAsset.spokeHalted && !reserveAsset.paused && !reserveAsset.frozen,
    canBeWithdrawn: reserveAsset.spokeActive && !reserveAsset.spokeHalted && !reserveAsset.paused,
    canBePayBacked: reserveAsset.spokeActive && !reserveAsset.spokeHalted && !reserveAsset.paused,
    utilization: new Dec(reserveAsset.totalDrawn.toString()).times(100).div(new Dec(reserveAsset.totalSupplied.toString())).toString(),
  });
};

export async function _getAaveV4SpokeData(provider: Client, network: NetworkNumber, market: AaveV4SpokeInfo, blockNumber: 'latest' | number = 'latest'): Promise<AaveV4SpokeData> {
  const viewContract = AaveV4ViewContractViem(provider, network, blockNumber);

  const hubsData: Record<EthAddress, AaveV4HubOnChainData> = {};
  const [spokeData] = await Promise.all([
    viewContract.read.getSpokeDataFull([market.address]),
    ...market.hubs.map(async (hubAddress) => {
      hubsData[hubAddress] = await fetchHubData(viewContract, hubAddress);
    }),
  ]);

  const reserveAssetsArray = await Promise.all(spokeData[1].map(async (reserveAssetOnChain: AaveV4ReserveAssetOnChain, index: number) => formatReserveAsset(reserveAssetOnChain, hubsData[reserveAssetOnChain.hub].assets[reserveAssetOnChain.assetId], index, +spokeData[0].oracleDecimals.toString(), network)));

  return {
    assetsData: reserveAssetsArray.reduce((acc: Record<string, AaveV4ReserveAssetData>, reserveAsset: AaveV4ReserveAssetData) => {
      acc[`${reserveAsset.symbol}-${reserveAsset.reserveId}`] = reserveAsset;
      return acc;
    }, {}),
    oracle: spokeData[0].oracle,
    oracleDecimals: +spokeData[0].oracleDecimals.toString(),
    address: market.address,
  };
}

export async function getAaveV4SpokeData(provider: EthereumProvider, network: NetworkNumber, spoke: AaveV4SpokeInfo, blockNumber: 'latest' | number = 'latest'): Promise<AaveV4SpokeData> {
  return _getAaveV4SpokeData(getViemProvider(provider, network), network, spoke, blockNumber);
}

export async function _getAaveV4AccountData(provider: Client, network: NetworkNumber, spokeData: AaveV4SpokeData, address: EthAddress, blockNumber: 'latest' | number = 'latest'): Promise<AaveV4AccountData> {
  const viewContract = AaveV4ViewContractViem(provider, network, blockNumber);

  const loanData = await viewContract.read.getLoanData([spokeData.address, address]);

  const healthFactor = new Dec(loanData.healthFactor).div(1e18).toString();
  const usedAssets = loanData.reserves.reduce((acc: AaveV4UsedReserveAssets, usedReserveAsset) => {
    const identifier = `${wethToEth(getAssetInfoByAddress(usedReserveAsset.underlying, network).symbol)}-${+usedReserveAsset.reserveId.toString()}`;
    const reserveData = spokeData.assetsData[identifier];
    const price = reserveData.price;
    const supplied = assetAmountInEth(usedReserveAsset.supplied.toString(), reserveData.symbol);
    const drawn = assetAmountInEth(usedReserveAsset.drawn.toString(), reserveData.symbol);
    const premium = assetAmountInEth(usedReserveAsset.premium.toString(), reserveData.symbol);
    const borrowed = assetAmountInEth(usedReserveAsset.totalDebt.toString(), reserveData.symbol);
    acc[identifier] = {
      symbol: reserveData.symbol,
      hubName: reserveData.hubName,
      assetId: reserveData.assetId,
      reserveId: +usedReserveAsset.reserveId.toString(),
      supplied,
      suppliedUsd: new Dec(supplied).mul(price).toString(),
      drawn,
      drawnUsd: new Dec(drawn).mul(price).toString(),
      premium,
      premiumUsd: new Dec(premium).mul(price).toString(),
      borrowed,
      borrowedUsd: new Dec(borrowed).mul(price).toString(),
      isSupplied: !new Dec(supplied).eq(0),
      isBorrowed: usedReserveAsset.isBorrowing,
      collateral: usedReserveAsset.isUsingAsCollateral,
      collateralFactor: new Dec(usedReserveAsset.collateralFactor).div(10000).toNumber(),
    };
    return acc;
  }, {});

  const aggregated = aaveV4GetAggregatedPositionData({
    usedAssets,
    assetsData: spokeData.assetsData,
    network,
    useUserCollateralFactor: true,
  });

  const riskPremiumBps = calcUserRiskPremiumBps(usedAssets, spokeData.assetsData);

  return {
    ...aggregated,
    usedAssets,
    healthFactor,
    riskPremiumBps,
  };
}

export async function getAaveV4AccountData(provider: EthereumProvider, network: NetworkNumber, marketData: AaveV4SpokeData, address: EthAddress, blockNumber: 'latest' | number = 'latest'): Promise<any> {
  return _getAaveV4AccountData(getViemProvider(provider, network), network, marketData, address, blockNumber);
}