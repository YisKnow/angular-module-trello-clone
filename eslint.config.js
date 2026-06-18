// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Project decision: keep NgModule architecture (not standalone) — disable standalone preference
      '@angular-eslint/prefer-standalone': 'off',
      // Project decision: keep constructor injection in services — disable inject() preference
      '@angular-eslint/prefer-inject': 'off',
      // Empty constructors are common in Angular DI services
      '@typescript-eslint/no-empty-function': 'off',
      // Empty ngOnInit is a common Angular pattern (interface placeholder)
      '@angular-eslint/no-empty-lifecycle-method': 'off',
      // Allow unused parameters in callbacks (response, error handlers) and interface stubs
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'none', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Out of scope: keep *ngIf/*ngFor directives (new control flow migration is a separate change)
      '@angular-eslint/template/prefer-control-flow': 'off',
      // Pre-existing a11y gaps tracked separately
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
    },
  }
);
