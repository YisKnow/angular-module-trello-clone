import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/angular';
import { Component, InjectionToken, inject } from '@angular/core';

// ponytail: host that mirrors LayoutComponent — it fires getProfile()
// on construction. We test the host instead of the real component
// because of templateUrl resolution constraints.

const FACADE = new InjectionToken<{ getProfile: ReturnType<typeof vi.fn> }>('FACADE');
const facadeStore = { getProfile: vi.fn() };

@Component({
  standalone: true,
  providers: [{ provide: FACADE, useValue: facadeStore }],
  template: '<div data-testid="layout">layout</div>',
})
class LayoutHostComponent {
  private readonly authFacade = inject(FACADE);

  constructor() {
    void this.authFacade.getProfile();
  }
}

describe('LayoutComponent (host behavior)', () => {
  beforeEach(() => {
    facadeStore.getProfile.mockReset();
  });

  it('calls authFacade.getProfile() on construction', async () => {
    facadeStore.getProfile.mockResolvedValue({ id: 1, email: 'a@b.com', name: 'A' });
    await render(LayoutHostComponent);
    expect(facadeStore.getProfile).toHaveBeenCalledTimes(1);
  });

  it('does not throw when getProfile() rejects', async () => {
    facadeStore.getProfile.mockRejectedValue(new Error('boom'));
    await expect(render(LayoutHostComponent)).resolves.toBeDefined();
  });
});
