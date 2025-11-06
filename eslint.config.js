import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.min.js',
      '**/*.log',
      '**/.env*',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
      '**/*.tsbuildinfo',
      '**/coverage/**',
      '**/.nyc_output/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/.husky/**',
      '**/.git/**',
      'commitlint.config.js',
      'jest.config.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
        },
      ],

      // General code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'no-implicit-coercion': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Best practices
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],
      'default-case': 'error',
      'default-case-last': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-empty': 'error',
      'no-implicit-globals': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-multi-assign': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-return-assign': 'error',
      'no-return-await': 'error',
      'no-sequences': 'error',
      'no-shadow': 'off', // Disable base rule
      '@typescript-eslint/no-shadow': ['error', { ignoreTypeValueShadow: true }],
      'no-undef-init': 'error',
      'no-undefined': 'off',
      'no-unused-labels': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'require-await': 'off', // Disable base rule
      '@typescript-eslint/require-await': 'error',
      yoda: 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettierConfig // Must be last to override conflicting rules
);
