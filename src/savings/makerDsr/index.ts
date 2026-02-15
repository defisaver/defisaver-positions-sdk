import { Client } from 'viem';
import Dec from 'decimal.js';
import { getViemProvider } from '../../services/viem';
import { MakerDsrType, SavingsVaultData } from '../../types';
import { EthAddress, EthereumProvider, NetworkNumber } from '../../types/common';
import * as makerDsrOptions from './options';
import { MakerDsrContractViem } from '../../contracts';

export {
  makerDsrOptions,
};

export const _getMakerDsrData = async (provider: Client, network: NetworkNumber, accounts: EthAddress[]): Promise<SavingsVaultData> => {
  const contract = MakerDsrContractViem(provider, network);

  const pieAmounts: Record<EthAddress, bigint> = {};

  const [Pie, chi] = await Promise.all([
    contract.read.Pie(),
    contract.read.chi(),
    ...accounts.map(async (account) => {
      const pieAmount = await contract.read.pie([account]) as bigint;
      pieAmounts[account] = pieAmount;
    }),
  ]);

  const totalSupplyRad = new Dec(Pie as bigint).mul(chi as bigint).toString();
  const poolSize = new Dec(totalSupplyRad).div(1e45).toString();

  const supplied: Record<EthAddress, string> = {};
  accounts.forEach((account) => {
    const pie = pieAmounts[account] || BigInt(0);
    const radAmount = new Dec(pie).mul(chi as bigint).toString();
    supplied[account.toLowerCase() as EthAddress] = new Dec(radAmount).div(1e45).toString();
  });

  return {
    poolSize,
    liquidity: poolSize,
    supplied,
    asset: 'DAI',
    optionType: MakerDsrType.MakerDsrVault,
  };
};

export async function getMakerDsrData(provider: EthereumProvider, network: NetworkNumber, accounts: EthAddress[]): Promise<SavingsVaultData> {
  return _getMakerDsrData(getViemProvider(provider, network, {
    batch: {
      multicall: {
        batchSize: 2500000,
      },
    },
  }), network, accounts);
}