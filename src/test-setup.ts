import '@angular/compiler';

import { TestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

import { configure } from '@testing-library/angular';
import '@testing-library/jest-dom/vitest';

// Angular TestBed for component tests
TestBed.initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);

// Global ATL defaults — common imports every component test may need
configure({
  defaultImports: [],
  dom: {
    testIdAttribute: 'data-testid',
  },
});
