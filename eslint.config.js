import { tanstackConfig } from '@tanstack/eslint-config';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Global ignores - these apply to ALL rules
  {
    ignores: [
      '**/node_modules/**',
      'node_modules/**',
      '**/node_modules/',
      'node_modules/',
      'eslint.config.js',
      'tailwind.config.js',
      'babel.config.js',
      'metro.config.js',
      'app.config.ts',
      'package-lock.json',
      'build/**',
      'dist/**',
      'ios/**',
      'android/**',
      '.expo/**',
      '**/*.config.js',
      '**/*.config.ts',
      'Pods/**',
      'keys/**',
      'migrations/**',
      'scripts/builtVersions.json',
    ],
  },
  ...tanstackConfig,
  {
    files: [
      'api/**/*.{js,ts,tsx}',
      'app/**/*.{js,ts,tsx}',
      'components/**/*.{js,ts,tsx}',
      'config/**/*.{js,ts,tsx}',
      'constants/**/*.{js,ts,tsx}',
      'hooks/**/*.{js,ts,tsx}',
      'model/**/*.{js,ts,tsx}',
      'store/**/*.{js,ts,tsx}',
      'scripts/**/*.{js,ts,tsx}',
      'types/**/*.{js,ts,tsx}',
      'utils/**/*.{js,ts,tsx}',
    ],
    // Additional ignores specifically for this rule set
    ignores: ['**/node_modules/**', 'node_modules/**'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      react: reactPlugin,
      importPlugin: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      'react/jsx-sort-props': [
        'warn',
        {
          locale: 'auto',
          callbacksLast: true,
          shorthandFirst: true,
        },
      ],
      'import/order': [
        'warn',
        {
          groups: [
            ['builtin', 'external'],
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: 'react-native',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: 'expo/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: 'expo-**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@**/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: './**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
