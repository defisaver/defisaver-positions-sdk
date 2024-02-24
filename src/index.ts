import './setup';

import * as aaveV3 from './aaveV3';
import * as morphoAaveV3 from './morphoAaveV3';
import * as aaveV2 from './aaveV2';
import * as morphoAaveV2 from './morphoAaveV2';
import * as compoundV3 from './compoundV3';
import * as compoundV2 from './compoundV2';
import * as spark from './spark';
import * as curveUsd from './curveUsd';
import * as liquity from './liquity';
import * as maker from './maker';
import * as staking from './staking';
import * as multicall from './multicall';
import * as moneymarket from './moneymarket';
import * as assets from './assets';
import * as markets from './markets';
import * as helpers from './helpers';
import * as chickenBonds from './chickenBonds';
import * as exchange from './exchange';
import * as morphoBlue from './morphoBlue';
import * as llamaLend from './llamaLend';

export * from './types';

export {
  aaveV2,
  aaveV3,
  morphoAaveV2,
  morphoAaveV3,
  compoundV2,
  compoundV3,
  spark,
  curveUsd,
  liquity,
  maker,
  chickenBonds,
  exchange,
  staking,
  multicall,
  moneymarket,
  markets,
  helpers,
  morphoBlue,
  llamaLend,
};
