import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // React Hooks linting for the renderer. Previously the codebase carried
    // `eslint-disable react-hooks/exhaustive-deps` comments but the plugin was
    // never installed, so ESLint errored "rule not found" AND hooks-deps
    // linting never actually ran. rules-of-hooks catches conditional/looped
    // hook calls; exhaustive-deps runs as a warning so existing disables are
    // honoured without failing the gate.
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // Node-run build/setup scripts (plain .js/.mjs, not the bundled app) use
    // process/console/__dirname etc. Give them the Node global environment so
    // they don't trip `no-undef`.
    files: ['scripts/**/*.{js,mjs,cjs}', '**/*.config.{js,mjs,cjs}', 'apps/*/scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/dist_bak_claude/**',
      '**/out/**',
      '**/out-types/**',
      '**/node_modules/**',
      '**/build/**',
      '.claude/**',
    ],
  },
);
