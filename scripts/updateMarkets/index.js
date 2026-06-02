import 'dotenv/config';
import path from 'path';
import { createRequire } from 'module';
import { loadFile, writeFile, detectCodeFormat } from 'magicast';
import lodash from 'lodash';
import { getAssetInfoByAddress } from '@defisaver/tokens';
import {
  arbitrum, base, mainnet, optimism, linea, plasma,
} from 'viem/chains';

import { createPublicClient, http, getContract } from 'viem';
import {
  AaveProtocolDataProvider,
  AaveV3ProtocolDataProvider,
  SparkProtocolDataProvider,
  CompV3View,
  cUSDbCv3,
  cUSDCev3,
  cUSDCv3,
  cETHv3,
  cUSDTv3,
// eslint-disable-next-line import/extensions
} from '../../esm/config/contracts.js';

const require = createRequire(import.meta.url);
const { AaveV4View } = require('../../cjs/config/contracts.js');

// Keep in sync with `src/markets/aaveV4/index.ts`
const AAVE_V4_SPOKES_ETH = [
  { label: 'Bluechip', address: '0x973a023A77420ba610f06b3858aD991Df6d85A08' },
  { label: 'Ethena Correlated', address: '0x58131E79531caB1d52301228d1f7b842F26B9649' },
  { label: 'Ethena Ecosystem', address: '0xba1B3D55D249692b669A164024A838309B7508AF' },
  { label: 'Etherfi', address: '0xbF10BDfE177dE0336aFD7fcCF80A904E15386219' },
  { label: 'Forex', address: '0xD8B93635b8C6d0fF98CbE90b5988E3F2d1Cd9da1' },
  { label: 'Gold', address: '0x65407b940966954b23dfA3caA5C0702bB42984DC' },
  { label: 'Kelp', address: '0x3131FE68C4722e726fe6B2819ED68e514395B9a4' },
  { label: 'Lido', address: '0xe1900480ac69f0B296841Cd01cC37546d92F35Cd' },
  { label: 'Lombard BTC', address: '0x7EC68b5695e803e98a21a9A05d744F28b0a7753D' },
  { label: 'Main', address: '0x94e7A5dCbE816e498b89aB752661904E2F56c485' },
];

const getViemChain = (chainId) => {
  switch (chainId) {
    case 1:
      return mainnet;
    case 10:
      return optimism;
    case 42161:
      return arbitrum;
    case 8453:
      return base;
    case 59144:
      return linea;
    case 9745:
      return plasma;
    default:
      throw new Error(`Unsupported network: ${chainId}`);
  }
};

const getRpc = (chainId) => {
  switch (chainId) {
    case 1:
      return process.env.RPC;
    case 10:
      return process.env.RPCOPT;
    case 42161:
      return process.env.RPCARB;
    case 8453:
      return process.env.RPCBASE;
    case 59144:
      return process.env.RPCLINEA;
    case 9745:
      return process.env.RPCPLASMA;
    default:
      throw new Error(`Unsupported network: ${chainId}`);
  }
};


const getViem = (chainId) => createPublicClient({
  transport: http(getRpc(chainId)),
  chain: getViemChain(chainId),
});

const separateAssetsByExistence = (tokens, chainId, { addressExtractingMethod } = { addressExtractingMethod: (a) => a }) => {
  const checkExistence = (a) => getAssetInfoByAddress(a, chainId).symbol !== '?';

  const existent = tokens.filter((a) => checkExistence(addressExtractingMethod(a)))
    .map(a => getAssetInfoByAddress(addressExtractingMethod(a), chainId).symbol.replace(/^WETH$/, 'ETH'));
  const nonexistent = tokens.filter((a) => !checkExistence(addressExtractingMethod(a)));

  return { existent, nonexistent };
};

const aaveFile = 'aave/marketAssets.ts';

const aave = {
  V2: {
    fileName: aaveFile,
    variableName: {
      1: 'aaveV2AssetsDefaultMarket',
    },
    networks: [1],
    getter: async (chainId) => {
      const client = getViem(chainId);
      const protocolDataProviderContract = getContract({
        address: AaveProtocolDataProvider.networks[chainId].address,
        abi: AaveProtocolDataProvider.abi,
        client,
      });
      const reserveTokens = await protocolDataProviderContract.read.getAllReservesTokens();

      return separateAssetsByExistence(reserveTokens, chainId, { addressExtractingMethod: a => a.tokenAddress });
    },
  },
  V3: {
    fileName: aaveFile,
    variableName: {
      1: 'aaveV3AssetsDefaultMarketEth',
      10: 'aaveV3AssetsDefaultMarketOpt',
      8453: 'aaveV3AssetsDefaultMarketBase',
      42161: 'aaveV3AssetsDefaultMarketArb',
    },
    networks: [1, 10, 8453, 42161],
    getter: async (chainId) => {
      const client = getViem(chainId);
      const protocolDataProviderContract = getContract({
        address: AaveV3ProtocolDataProvider.networks[chainId].address,
        abi: AaveV3ProtocolDataProvider.abi,
        client,
      });
      const reserveTokens = await protocolDataProviderContract.read.getAllReservesTokens();

      return separateAssetsByExistence(reserveTokens, chainId, { addressExtractingMethod: a => a.tokenAddress });
    },
  },
};

const compound = {
  V3: {
    hasMultipleMarkets: true,
    fileName: 'compound/marketsAssets.ts',
    variableName: {
      1: {
        [cETHv3.networks[1].address.toLowerCase()]: 'v3ETHCollAssetsEth',
        [cUSDCv3.networks[1].address.toLowerCase()]: 'v3USDCCollAssetsEth',
        [cUSDTv3.networks[1].address.toLowerCase()]: 'v3USDTCollAssetsEth',
      },
      10: {
        [cUSDCv3.networks[10].address.toLowerCase()]: 'v3USDCCollAssetsOpt',
        [cUSDTv3.networks[10].address.toLowerCase()]: 'v3USDTCollAssetsOpt',
        [cETHv3.networks[10].address.toLowerCase()]: 'v3ETHCollAssetsOpt',
      },
      8453: {
        [cETHv3.networks[8453].address.toLowerCase()]: 'v3ETHCollAssetsBase',
        [cUSDbCv3.networks[8453].address.toLowerCase()]: 'v3USDbCCollAssetsBase',
        [cUSDCv3.networks[8453].address.toLowerCase()]: 'v3USDCCollAssetsBase',
      },
      42161: {
        [cUSDCev3.networks[42161].address.toLowerCase()]: 'v3USDCeCollAssetsArb',
        [cUSDCv3.networks[42161].address.toLowerCase()]: 'v3USDCCollAssetsArb',
        [cETHv3.networks[42161].address.toLowerCase()]: 'v3ETHCollAssetsArb',
        [cUSDTv3.networks[42161].address.toLowerCase()]: 'v3USDTCollAssetsArb',
      },
    },
    networks: [1, 10, 8453, 42161],
    getter: async (chainId, { marketAddress }) => {
      const client = getViem(chainId);
      const compV3ViewContract = getContract({
        address: CompV3View.networks[chainId].address,
        abi: CompV3View.abi,
        client,
      });
      const tokens = await compV3ViewContract.read.getFullCollInfos([marketAddress]);

      return separateAssetsByExistence(tokens, chainId, { addressExtractingMethod: (a) => a.tokenAddr });
    },
  },
};

const aaveV4 = {
  V1: {
    networks: [1],
    getter: async (chainId, { spokeAddress }) => {
      const client = getViem(chainId);
      const viewContract = getContract({
        address: AaveV4View.networks[chainId].address,
        abi: AaveV4View.abi,
        client,
      });
      const spokeData = await viewContract.read.getSpokeDataFull([spokeAddress]);
      const underlyings = spokeData[1].map((reserve) => reserve.underlying);

      return separateAssetsByExistence(underlyings, chainId);
    },
  },
};

const spark = {
  V1: {
    fileName: 'spark/marketAssets.ts',
    variableName: {
      1: 'sparkAssetsDefaultMarketEth',
    },
    networks: [1],
    getter: async (chainId) => {
      const client = getViem(chainId);
      const protocolDataProviderContract = getContract({
        address: SparkProtocolDataProvider.networks[chainId].address,
        abi: SparkProtocolDataProvider.abi,
        client,
      });
      const reserveTokens = await protocolDataProviderContract.read.getAllReservesTokens();

      return separateAssetsByExistence(reserveTokens, chainId, { addressExtractingMethod: a => a.tokenAddress });
    },
  },
};

async function setSymbolsToFile(fileName, variableName, assets, missingAddresses) {
  const constantsDirectory = path.resolve(process.cwd(), '../../src/markets');
  const filePath = `${constantsDirectory}/${fileName}`;

  const mod = await loadFile(filePath);

  let currValues = Object.values(mod.exports[variableName]);
  currValues = currValues.slice(1); // Magicast will return length of the array on 0 index, so we need to remove the first item from `currValues`

  const newSymbols = lodash.differenceWith(assets, currValues);

  if (newSymbols.length > 0) {
    mod.exports[variableName] = assets;

    await writeFile(mod, filePath, detectCodeFormat(mod.$code));
  }

  return {
    newSymbols,
    missingAddresses,
  };
}

async function formatResponse(protocol) {
  const responses = await Promise.all(protocol.networks.map((chainId) => {
    if (!protocol.hasMultipleMarkets) {
      return async () => ({
        chainId,
        fileName: protocol.fileName,
        variableName: protocol.variableName[chainId],
        data: await protocol.getter(chainId),
      });
    }
    return Object.entries(protocol.variableName[chainId]).map(([marketAddress, variableName]) => async () => ({
      chainId,
      variableName,
      fileName: protocol.fileName,
      data: await protocol.getter(chainId, { marketAddress }),
    }));
  }).flat().map(a => a()));

  const data = [];
  for (const res of responses) {
    const writeStatus = await setSymbolsToFile(res.fileName, res.variableName, res.data.existent, res.data.nonexistent);

    data.push({
      ...writeStatus,
      variableName: res.variableName,
      fileName: res.fileName,
      chainId: res.chainId,
    });
  }

  return data;
}

/** Aave V4 has no marketAssets arrays to auto-update; only report missing tokens in the GH PR. */
async function formatAaveV4Response(protocol) {
  const chainId = protocol.networks[0];
  const spokes = chainId === 1 ? AAVE_V4_SPOKES_ETH : [];
  const data = [];

  for (const spoke of spokes) {
    const { nonexistent } = await protocol.getter(chainId, { spokeAddress: spoke.address });
    if (nonexistent.length === 0) continue;

    data.push({
      newSymbols: [],
      missingAddresses: nonexistent,
      variableName: spoke.label,
      fileName: `aaveV4 spoke (${spoke.address})`,
      chainId,
    });
  }

  return data;
}

function createContent(data) {
  let description = '';
  let hasNewSymbols = false;
  let hasMissingTokens = false;

  Object.values(data).forEach((item) => {
    item.forEach(i => {
      if (i.newSymbols.length === 0 && i.missingAddresses.length === 0) {
        return;
      }

      description += `File: ${i.fileName}; Variable: ${i.variableName}; Chain ID: ${i.chainId}`;

      if (i.newSymbols.length > 0) {
        description += `\n - Added symbols: ${i.newSymbols.join(', ')}`;
        hasNewSymbols = true;
      }
      if (i.missingAddresses.length > 0) {
        description += `\n - Missing addresses: ${i.missingAddresses.join(', ')}`;
        hasMissingTokens = true;
      }
      description += '\n\n';
    });
  });

  return { description, hasNewSymbols, hasMissingTokens };
}

(async () => {
  try {
    const data = {
      spark: await formatResponse(spark.V1),
      aaveV2: await formatResponse(aave.V2),
      aaveV3: await formatResponse(aave.V3),
      compoundV3: await formatResponse(compound.V3),
      aaveV4: await formatAaveV4Response(aaveV4.V1),
    };

    const { description, hasNewSymbols, hasMissingTokens } = createContent(data);

    const payload = JSON.stringify({
      description,
      hasNewSymbols,
      hasMissingTokens,
    }, null, 2);

    // Do not delete log, we use it to store data in variable during the GH action
    console.log(payload);
    return payload;
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
})();
