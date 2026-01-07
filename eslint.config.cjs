const js = require('@eslint/js');
const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const { defineConfig, globalIgnores } = require('eslint/config');

module.exports = defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', '**/*.min.js', 'Frontend/dist', 'Backend/**', 'Frontend/coverage/**']),
  {
    files: ['Frontend/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-useless-escape': 'warn',
    },
  },
  {
    files: ['Frontend/src/components/common/*.{js,jsx}', 'Frontend/src/utils/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'readonly',
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-useless-escape': 'warn',
    },
  },
  {
    files: ['**/*.{test,spec}.{js,jsx}', '**/__tests__/**/*.{js,jsx}', 'test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        global: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-useless-escape': 'warn',
    },
  },
  {
    files: ['babel.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        module: 'readonly',
      },
    },
  },
]);

