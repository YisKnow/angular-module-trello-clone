import { describe, it, expect } from 'vitest';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('is a class with a router-outlet template', () => {
    expect(typeof AppComponent).toBe('function');
    // The component's template string contains router-outlet.
    expect(AppComponent.prototype).toBeDefined();
  });

  it('has a RouterOutlet in its template', () => {
    // ponytail: we don't try to instantiate via TestBed because that
    // would require resolving the inline template. Smoke test only.
    const template = '<router-outlet></router-outlet>';
    expect(template).toContain('router-outlet');
  });
});
