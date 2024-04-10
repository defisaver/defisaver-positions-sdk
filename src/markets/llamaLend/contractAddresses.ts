import {LlamaLendVersions, LlamaLendVersionsType, LLVersionsArb, LLVersionsEth} from "../../types";
import {NetworkNumber} from "../../types/common";

type LLAddresses = {
  controllerAddress: string,
  vaultAddress: string
}
const ethAddresses: Record<LLVersionsEth, LLAddresses> = {
  [LlamaLendVersions.LLWstethCrvusd]: {
    controllerAddress: '0x1E0165DbD2019441aB7927C018701f3138114D71',
    vaultAddress: '0x8cf1DE26729cfB7137AF1A6B2a665e099EC319b5',
  },
  [LlamaLendVersions.LLSusdeCrvusd]: {
    controllerAddress: '0x98fc283d6636f6dcff5a817a00ac69a3add96907',
    vaultAddress: '0x52096539ed1391CB50C6b9e4Fd18aFd2438ED23b',
  },
  [LlamaLendVersions.LLCrvCrvusd]: {
    controllerAddress: '0xEdA215b7666936DEd834f76f3fBC6F323295110A',
    vaultAddress: '0xCeA18a8752bb7e7817F9AE7565328FE415C0f2cA',
  },
  [LlamaLendVersions.LLCrvusdCrv]: {
    controllerAddress: '0xC510d73Ad34BeDECa8978B6914461aA7b50CF3Fc',
    vaultAddress: '0x4D2f44B0369f3C20c3d670D2C26b048985598450',
  },
  [LlamaLendVersions.LLTbtcCrvusd]: {
    controllerAddress: '0x413FD2511BAD510947a91f5c6c79EBD8138C29Fc',
    vaultAddress: '0xb2b23C87a4B6d1b03Ba603F7C3EB9A81fDC0AAC9',
  },
  [LlamaLendVersions.LLCrvusdTbtc]: {
    controllerAddress: '0xe438658874b0acf4d81c24172e137f0ee00621b8',
    vaultAddress: '0x99Cff9Dc26A44dc2496B4448ebE415b5E894bd30',
  },
  [LlamaLendVersions.LLWethCrvusd]: {
    controllerAddress: '0xaade9230aa9161880e13a38c83400d3d1995267b',
    vaultAddress: '0x5AE28c9197a4a6570216fC7e53E7e0221D7A0FEF',
  },
  [LlamaLendVersions.LLCrvusdWeth]: {
    controllerAddress: '0xa5d9137d2a1ee912469d911a8e74b6c77503bac8',
    vaultAddress: '0x46196C004de85c7a75C8b1bB9d54Afb0f8654A45',
  },
}

const arbAddresses: Record<LLVersionsArb, LLAddresses> = {
  [LlamaLendVersions.LLArbCrvusd]: {
    controllerAddress: '0x76709bc0da299ab0234eec51385e900922ae98f5',
    vaultAddress: '0x65592b1F12c07D434e95c7BF87F4f2f464e950e4',
  },
  [LlamaLendVersions.LLFxnCrvusd]: {
    controllerAddress: '0x7adcc491f0b7f9bc12837b8f5edf0e580d176f1f',
    vaultAddress: '0xebA51f6472F4cE1C47668c2474ab8f84B32E1ae7',
  },
  [LlamaLendVersions.LLWbtcCrvusd]: {
    controllerAddress: '0x013be86e1cdb0f384daf24bd974fe75edffe6b68',
    vaultAddress: '0x60D38b12d22BF423F28082bf396ff8F28cC506B1',
  },
  [LlamaLendVersions.LLCrvCrvusd]: {
    controllerAddress: '0x88f88e937db48bbfe8e3091718576430704e47ab',
    vaultAddress: '0xeEaF2ccB73A01deb38Eca2947d963D64CfDe6A32',
  },
  [LlamaLendVersions.LLWethCrvusd]: {
    controllerAddress: '0xb5b6f0e69c283aa32425fa18220e64283b51f0a4',
    vaultAddress: '0x49014A8eB1585cBee6A7a9A50C3b81017BF6Cc4d',
  }
}

export const getLLamaLendAddresses = (networkId: NetworkNumber, version: LlamaLendVersionsType) => {
  let addresses: LLAddresses | undefined;
  if (networkId === NetworkNumber.Eth) {
    addresses = ethAddresses[version as any as LLVersionsEth];
  } else if (networkId === NetworkNumber.Arb) {
    addresses = arbAddresses[version as any as LLVersionsArb];
  } else {
    throw new Error(`Invalid LlamaLend network ${networkId} for version ${version}`);
  }

  if(!addresses) {
    throw new Error(`Invalid LlamaLend version ${version} for network ${networkId}`);
  }
  return addresses;
}


