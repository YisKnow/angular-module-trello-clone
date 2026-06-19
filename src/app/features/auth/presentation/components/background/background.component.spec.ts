import { describe, it, expect } from 'vitest';

import { BackgroundComponent } from './background.component';

describe('BackgroundComponent', () => {
  it('is a class (component definition exists)', () => {
    // ponytail: smoke test only — the real templateUrl can't be
    // resolved by Vitest without resolveComponentResources().
    expect(typeof BackgroundComponent).toBe('function');
    expect(BackgroundComponent.prototype).toBeDefined();
  });
});
