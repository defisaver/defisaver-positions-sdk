import {
  LlamaLendVersions, LlamaLendVersionsType, LLVersionsArb, LLVersionsEth,
} from '../../types';
import { NetworkNumber } from '../../types/common';

type LLAddresses = {
  controllerAddress: string,
  vaultAddress: string
  controllerId: number,
};

const ethAddresses: Record<LLVersionsEth, LLAddresses> = {
  [LlamaLendVersions.LLWstethCrvusd]: {
    controllerId: 0,
    controllerAddress: '0x1E0165DbD2019441aB7927C018701f3138114D71',
    vaultAddress: '0x8cf1DE26729cfB7137AF1A6B2a665e099EC319b5',
  },
  [LlamaLendVersions.LLWstethCrvusd2]: {
    controllerId: 13,
    controllerAddress: '0x5756A035F276a8095A922931F224F4ed06149608',
    vaultAddress: '0x21CF1c5Dc48C603b89907FE6a7AE83EA5e3709aF',
  },
  [LlamaLendVersions.LLSusdeCrvusd]: {
    controllerId: 7,
    controllerAddress: '0x98fc283d6636f6dcff5a817a00ac69a3add96907',
    vaultAddress: '0x52096539ed1391CB50C6b9e4Fd18aFd2438ED23b',
  },
  [LlamaLendVersions.LLSusdeCrvusd2]: {
    controllerId: 11,
    controllerAddress: '0xB536FEa3a01c95Dd09932440eC802A75410139D6',
    vaultAddress: '0x4a7999c55d3a93dAf72EA112985e57c2E3b9e95D',
  },
  [LlamaLendVersions.LLCrvCrvusd]: {
    controllerId: 3,
    controllerAddress: '0xEdA215b7666936DEd834f76f3fBC6F323295110A',
    vaultAddress: '0xCeA18a8752bb7e7817F9AE7565328FE415C0f2cA',
  },
  [LlamaLendVersions.LLCrvusdCrv]: {
    controllerId: 4,
    controllerAddress: '0xC510d73Ad34BeDECa8978B6914461aA7b50CF3Fc',
    vaultAddress: '0x4D2f44B0369f3C20c3d670D2C26b048985598450',
  },
  [LlamaLendVersions.LLTbtcCrvusd]: {
    controllerId: 2,
    controllerAddress: '0x413FD2511BAD510947a91f5c6c79EBD8138C29Fc',
    vaultAddress: '0xb2b23C87a4B6d1b03Ba603F7C3EB9A81fDC0AAC9',
  },
  [LlamaLendVersions.LLCrvusdTbtc]: {
    controllerId: 6,
    controllerAddress: '0xe438658874b0acf4d81c24172e137f0ee00621b8',
    vaultAddress: '0x99Cff9Dc26A44dc2496B4448ebE415b5E894bd30',
  },
  [LlamaLendVersions.LLWethCrvusd]: {
    controllerId: 1,
    controllerAddress: '0xaade9230aa9161880e13a38c83400d3d1995267b',
    vaultAddress: '0x5AE28c9197a4a6570216fC7e53E7e0221D7A0FEF',
  },
  [LlamaLendVersions.LLCrvusdWeth]: {
    controllerId: 5,
    controllerAddress: '0xa5d9137d2a1ee912469d911a8e74b6c77503bac8',
    vaultAddress: '0x46196C004de85c7a75C8b1bB9d54Afb0f8654A45',
  },
  [LlamaLendVersions.LLWethCrvusd2]: {
    controllerId: 12,
    controllerAddress: '0x23F5a668A9590130940eF55964ead9787976f2CC',
    vaultAddress: '0x8fb1c7AEDcbBc1222325C39dd5c1D2d23420CAe3',
  },
  [LlamaLendVersions.LLWbtcCrvusd]: {
    controllerId: 9,
    controllerAddress: '0xcaD85b7fe52B1939DCEebEe9bCf0b2a5Aa0cE617',
    vaultAddress: '0xccd37EB6374Ae5b1f0b85ac97eFf14770e0D0063',
  },
  [LlamaLendVersions.LLPufethCrvusd]: {
    controllerId: 10,
    controllerAddress: '0x4f87158350c296955966059C50263F711cE0817C',
    vaultAddress: '0xff467c6E827ebbEa64DA1ab0425021E6c89Fbe0d',
  },
  [LlamaLendVersions.LLUsdeCrvusd]: {
    controllerId: 14,
    controllerAddress: '0x74f88Baa966407b50c10B393bBD789639EFfE78B',
    vaultAddress: '0xc687141c18F20f7Ba405e45328825579fDdD3195',
  },
};

const arbAddresses: Record<LLVersionsArb, LLAddresses> = {
  [LlamaLendVersions.LLArbCrvusd]: {
    controllerId: 5,
    controllerAddress: '0x76709bc0da299ab0234eec51385e900922ae98f5',
    vaultAddress: '0x65592b1F12c07D434e95c7BF87F4f2f464e950e4',
  },
  [LlamaLendVersions.LLArbCrvusd2]: {
    controllerId: 11,
    controllerAddress: '0xeCF99dE21c31eC75b4Fb97e980F9d084b1d8Da8f',
    vaultAddress: '0xa6C2E6A83D594e862cDB349396856f7FFE9a979B',
  },
  [LlamaLendVersions.LLFxnCrvusd]: {
    controllerId: 7,
    controllerAddress: '0x7adcc491f0b7f9bc12837b8f5edf0e580d176f1f',
    vaultAddress: '0xebA51f6472F4cE1C47668c2474ab8f84B32E1ae7',
  },
  [LlamaLendVersions.LLWbtcCrvusd]: {
    controllerId: 1,
    controllerAddress: '0x013be86e1cdb0f384daf24bd974fe75edffe6b68',
    vaultAddress: '0x60D38b12d22BF423F28082bf396ff8F28cC506B1',
  },
  [LlamaLendVersions.LLWbtcCrvusd2]: {
    controllerId: 10,
    controllerAddress: '0xb9aDddCf4e01c2f64F8F2CD9a050DC35585ea053',
    vaultAddress: '0xe07f1151887b8FDC6800f737252f6b91b46b5865',
  },
  [LlamaLendVersions.LLCrvCrvusd]: {
    controllerId: 4,
    controllerAddress: '0x88f88e937db48bbfe8e3091718576430704e47ab',
    vaultAddress: '0xeEaF2ccB73A01deb38Eca2947d963D64CfDe6A32',
  },
  [LlamaLendVersions.LLWethCrvusd]: {
    controllerId: 0,
    controllerAddress: '0xb5b6f0e69c283aa32425fa18220e64283b51f0a4',
    vaultAddress: '0x49014A8eB1585cBee6A7a9A50C3b81017BF6Cc4d',
  },
  [LlamaLendVersions.LLWethCrvusd2]: {
    controllerId: 9,
    controllerAddress: '0xB5c6082d3307088C98dA8D79991501E113e6365d',
    vaultAddress: '0xd3cA9BEc3e681b0f578FD87f20eBCf2B7e0bb739',
  },
};

export const getLLamaLendAddresses = (networkId: NetworkNumber, version: LlamaLendVersionsType) => {
  let addresses: LLAddresses | undefined;
  if (networkId === NetworkNumber.Eth) {
    addresses = ethAddresses[version as any as LLVersionsEth];
  } else if (networkId === NetworkNumber.Arb) {
    addresses = arbAddresses[version as any as LLVersionsArb];
  } else {
    throw new Error(`Invalid LlamaLend network ${networkId} for version ${version}`);
  }
  return addresses;
};


