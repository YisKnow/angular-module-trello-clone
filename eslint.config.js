// @ts-check
const tseslint = require('typescript-eslint');
const { configs, processInlineTemplates } = require('angular-eslint');

// ponytail: angular presets + NgModule overrides, merged in one pass
module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [...configs.tsRecommended],
    processor: processInlineTemplates,
    rules: {
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/prefer-inject': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...configs.templateRecommended],
    rules: { '@angular-eslint/template/prefer-control-flow': 'off' },
  },
);
