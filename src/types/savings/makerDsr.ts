import { EthAddress } from '../common';

export enum MakerDsrType {
  MakerDsrVault = 'maker_dsr',
}

export interface MakerDsrVault {
  type: MakerDsrType;
  name: string;
  address: EthAddress;
  asset: string;
  deploymentBlock: number;
}