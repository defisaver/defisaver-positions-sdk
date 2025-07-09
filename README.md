# DeFi Saver Positions SDK

Supported protocols: 
- [Maker](https://github.com/defisaver/defisaver-positions-sdk/tree/main/src/maker)
- [Spark](https://github.com/defisaver/defisaver-positions-sdk/tree/main/src/spark)
- [CrvUSD](https://github.com/defisaver/defisaver-positions-sdk/tree/main/src/curveUsd)
- [Aave V2](https://github.com/defisaver/defisaver-positions-sdk/tree/main/src/aaveV2)
- [Aave V3](https://github.com/defisaver/defisaver-positions-sdk/tree/main/src/aaveV3)
- [Compound V2](https://github.com/defisaver/defisaver-positions-sdk/tree/main/src/compoundV2)
- [Compound V3](https://github.com/defisaver/defisaver-positions-sdk/tree/main/src/compoundV3)
- [Liquity](https://github.com/defisaver/defisaver-positions-sdk/tree/main/src/liquity)

## Setup
Supported Node version is v10.

- run `npm install` (first time)
- run `npm run build`

`build` command will generate contracts and build ejs and esm folders

## How to use
[All available imports](https://github.com/defisaver/defisaver-positions-sdk/blob/main/src/index.ts)

This is a Compound V3 example, and every other protocol is similar
```js
import { compoundV3 } from '@defisaver/positions-sdk';


// every protocol has market data and user data getters
const {
    getCompoundV3MarketsData,
    getCompoundV3AccountData,
} = compoundV3;

const provider = 'Your RPC provider';

const user = '0x123...';

const { assetsData } = await getCompoundV3MarketsData(
    provider, // rpc for the network you are using (note: can be tenderly or any other testnet rpc)
    1, // network
    selectedMarket, // market object like in /src/markets/compound/index.ts
    provider, // this must be mainnet rpc - used for getting prices onchain and calculating apys
);

const userData = await getCompoundV3AccountData(
    provider,
    1, // network
    userAddress, // EOA or DSProxy
    '', // proxy address of the user, or just empty string if checking for EOA
    {
        selectedMarket, // market object as in /src/markets/compound/index.ts
        assetsData,
    }
);
```

More examples found [here](https://github.com/defisaver/defisaver-positions-sdk/tree/main/tests)

## Testing

`npm run test` - Run all tests

`npm run test-single --name=your_test_name` - Run single test for specified name e.g. for MyTest.js test name is MyTest
