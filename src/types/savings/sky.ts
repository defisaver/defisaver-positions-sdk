export enum SkySavingsType {
  SkySavings = 'sky_savings',
  SkyUpgradeSavings = 'sky_upgrade_savings',
}

export interface SkySavingsOption {
  type: SkySavingsType;
  name: string;
  asset: string;
}
