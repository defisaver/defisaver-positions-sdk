
module.exports = {
  extends: ['@defisaver/eslint-config/base-config'],
  plugins: ['import', '@typescript-eslint'],
  // parser: '@babel/eslint-parser',
  parserOptions: {
    // requireConfigFile: false,
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    es6: true,
    browser: true,
    mocha: true,
  },
  ignorePatterns: ['esm/', 'umd/'],
  overrides: [{
    // these are overrides for .ts files, meaning these are only applied to .ts files
    files: ['*.ts', '*.tsx'],
    extends: ['@defisaver/eslint-config/base-config-typescript'],
    parser: '@typescript-eslint/parser',
    parserOptions: { project: ['./tsconfig.json'] },
    // typescript rules must be added here to work
  }],
  rules: {
    'max-len': 0,
  },
  settings: {
    // 'import/resolver': {
    //   node: {
    //     extensions: ['.js', '.ts'],
    //   },
    //   typescript: {
    //     alwaysTryTypes: true,
    //     project: ['./tsconfig.json'],
    //   },
    // },
  },
};
