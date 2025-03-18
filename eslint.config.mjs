import { defineConfig } from 'eslint/config';
import { typescriptConfig } from '@defisaver/eslint-config';

export default defineConfig(
  {
    extends: typescriptConfig,
    files: ['src/**/*.{js,ts}', 'tests/**/*.{js,ts}', 'scripts/**/*.{js,ts}'],
    ignores: [],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    }
  },
)
