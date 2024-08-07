const path = require('path');
const Web3 = require('web3');
const { loadFile, writeFile, detectCodeFormat } = require('magicast');
const differenceWith = require('lodash/differenceWith');
const { getAssetInfoByAddress } = require('@defisaver/tokens');

const {
  AaveProtocolDataProvider,
  AaveV3ProtocolDataProvider,
  SparkProtocolDataProvider,
  MorphoAaveV2View,
  CompV3View,
  cUSDbCv3,
  cUSDCev3,
  cUSDCv3,
  cETHv3,
  MorphoAaveV3ProxyEthMarket,
  cUSDTv3,
} = require('../../src/config/contracts');

const getWeb3 = (chainId) => new Web3(({
  1: process.env.RPC,
  10: process.env.RPCOPT,
  8453: process.env.RPCBASE,
  42161: process.env.RPCARB,
})[chainId]);

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
      const web3 = getWeb3(chainId);
      const protocolDataProviderContract = new web3.eth.Contract(
        AaveProtocolDataProvider.abi, AaveProtocolDataProvider.networks[chainId].address,
      );
      const reserveTokens = await protocolDataProviderContract.methods.getAllReservesTokens().call();

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
      const web3 = getWeb3(chainId);
      const protocolDataProviderContract = new web3.eth.Contract(
        AaveV3ProtocolDataProvider.abi, AaveV3ProtocolDataProvider.networks[chainId].address,
      );
      const reserveTokens = await protocolDataProviderContract.methods.getAllReservesTokens().call();

      return separateAssetsByExistence(reserveTokens, chainId, { addressExtractingMethod: a => a.tokenAddress });
    },
  },
};

const morphoAave = {
  V2: {
    fileName: aaveFile,
    variableName: {
      1: 'morphoAaveV2AssetDefaultMarket',
    },
    networks: [1],
    getter: async (chainId) => {
      const web3 = getWeb3(chainId);
      const morphoAaveV2ViewContract = new web3.eth.Contract(
        MorphoAaveV2View.abi, MorphoAaveV2View.networks[chainId].address,
      );
      const reserveTokens = await morphoAaveV2ViewContract.methods.getAllMarketsInfo().call();

      return separateAssetsByExistence(reserveTokens.marketInfo, chainId, { addressExtractingMethod: a => a.underlying });
    },
  },
  V3: {
    fileName: aaveFile,
    variableName: {
      1: 'morphoAaveV3AssetEthMarket',
    },
    networks: [1],
    getter: async (chainId) => {
      const web3 = getWeb3(chainId);
      const morphoAaveV3ProxyEthContract = new web3.eth.Contract(
        MorphoAaveV3ProxyEthMarket.abi, MorphoAaveV3ProxyEthMarket.networks[chainId].address,
      );
      const reserveTokens = await morphoAaveV3ProxyEthContract.methods.marketsCreated().call();

      return separateAssetsByExistence(reserveTokens, chainId);
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
    networks: [1, 8453, 42161],
    getter: async (chainId, { marketAddress }) => {
      const web3 = getWeb3(chainId);
      const compV3ViewContract = new web3.eth.Contract(
        CompV3View.abi, CompV3View.networks[chainId].address,
      );
      const tokens = await compV3ViewContract.methods.getFullCollInfos(marketAddress).call();

      return separateAssetsByExistence(tokens, chainId, { addressExtractingMethod: (a) => a.tokenAddr });
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
      const web3 = getWeb3(chainId);
      const protocolDataProviderContract = new web3.eth.Contract(
        SparkProtocolDataProvider.abi, SparkProtocolDataProvider.networks[chainId].address,
      );
      const reserveTokens = await protocolDataProviderContract.methods.getAllReservesTokens().call();

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

  const newSymbols = differenceWith(assets, currValues);

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
      morphoAaveV2: await formatResponse(morphoAave.V2),
      morphoAaveV3: await formatResponse(morphoAave.V3),
      compoundV3: await formatResponse(compound.V3),
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
