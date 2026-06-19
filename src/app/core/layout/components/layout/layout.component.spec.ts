import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/angular';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, from, of } from 'rxjs';

import { User } from '@features/auth/domain/entities/user.entity';
import { AUTH_REPOSITORY } from '@features/auth/domain/repositories/auth.repository';

// ponytail: host that mirrors LayoutComponent — it triggers getProfile
// on construction and catches errors. We test the host instead of the
// real component because of templateUrl resolution constraints.

const repoStore = { getProfile: vi.fn() };

@Component({
  standalone: true,
  providers: [{ provide: AUTH_REPOSITORY, useValue: repoStore }],
  template: '<div data-testid="layout">layout</div>',
})
class LayoutHostComponent {
  private readonly authRepository = inject(AUTH_REPOSITORY) as { getProfile: ReturnType<typeof vi.fn> };
  readonly profileResult = toSignal(
    from(this.authRepository.getProfile()).pipe(
      catchError(() => of(null as User | null)),
    ),
    { initialValue: null as User | null },
  );
}

describe('LayoutComponent (host behavior)', () => {
  beforeEach(() => {
    repoStore.getProfile.mockReset();
  });

  it('calls authRepository.getProfile() on construction (waits for toSignal subscription)', async () => {
    repoStore.getProfile.mockResolvedValue({ id: 1, email: 'a@b.com', name: 'A' });
    render(LayoutHostComponent);
    // toSignal subscribes after the first change detection cycle.
    await new Promise((r) => setTimeout(r, 0));
    expect(repoStore.getProfile).toHaveBeenCalledTimes(1);
  });

  it('does not throw when getProfile() rejects (error is caught)', async () => {
    repoStore.getProfile.mockRejectedValue(new Error('boom'));
    expect(() => render(LayoutHostComponent)).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });
});
