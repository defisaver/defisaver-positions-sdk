import { EthAddress } from '../common';

export enum SkySavingsType {
  SkySavings = 'sky_savings',
}

export interface SkySavingsOption {
  type: SkySavingsType;
  name: string;
  asset: string;
  address: EthAddress;
  isLegacy: boolean;
  deploymentBlock: number;
}
