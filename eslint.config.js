/**
 * ESLint Configuration for Seasons & Stars
 * Local configuration based on foundry-dev-tools patterns
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Base JS rules
  eslint.configs.recommended,
  
  // TypeScript rules for TS files
  ...tseslint.configs.recommended,
  
  // Custom Foundry VTT configuration
  {
    files: ['**/*.{js,ts}'],
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.js', '*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Core Foundry globals
        game: "readonly",
        canvas: "readonly", 
        ui: "readonly",
        Hooks: "readonly",
        CONFIG: "readonly",
        foundry: "readonly",
        
        // Template functions
        renderTemplate: "readonly",
        loadTemplates: "readonly",
        
        // Application classes
        Dialog: "readonly",
        Application: "readonly",
        FormApplication: "readonly",
        DocumentSheet: "readonly",
        ActorSheet: "readonly",
        ItemSheet: "readonly",
        
        // Document classes
        JournalEntry: "readonly",
        User: "readonly",
        Folder: "readonly",
        Actor: "readonly",
        Item: "readonly",
        Scene: "readonly",
        Playlist: "readonly",
        Macro: "readonly",
        
        // Additional common globals
        CONST: "readonly",
        duplicate: "readonly",
        mergeObject: "readonly",
        setProperty: "readonly",
        getProperty: "readonly",
        hasProperty: "readonly",
        expandObject: "readonly",
        flattenObject: "readonly",
        isObjectEmpty: "readonly"
      }
    },
    rules: {
      // Custom rules for FoundryVTT modules
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
      
      // TypeScript-specific relaxed rules for Foundry development
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn", 
      "no-case-declarations": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
    }
  }
);
