
module.exports = {
  extends: ['@defisaver/eslint-config/base-config'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    es6: true,
    browser: true,
    mocha: true,
  },
  ignorePatterns: ['esm/', 'cjs/'],
  overrides: [{
    files: ['*.ts', '*.tsx'],
    extends: ['@defisaver/eslint-config/base-config-typescript'],
    parser: '@typescript-eslint/parser',
    parserOptions: { project: ['./tsconfig.json'] },
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
