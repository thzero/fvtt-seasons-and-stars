/**
 * ESLint Configuration for Seasons & Stars
 * Uses shared foundry-dev-tools configuration
 */

import foundryConfig from '@rayners/foundry-dev-tools/eslint';

export default [
  // Use the shared Foundry VTT configuration
  ...foundryConfig,

  // Project-specific overrides
  {
    files: ['**/*.{js,ts}'],
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.js', '*.mjs'],
    rules: {
      // Temporarily relax some rules for migration
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      'no-case-declarations': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },
];
