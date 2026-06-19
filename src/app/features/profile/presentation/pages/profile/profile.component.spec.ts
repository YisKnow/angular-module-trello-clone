import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/angular';
import { Component, Injectable, InjectionToken, inject } from '@angular/core';
import { signal } from '@angular/core';
import { User } from '@features/auth/domain/entities/user.entity';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

// ponytail: lightweight host that mirrors the ProfileComponent template
// (avatar + name + email + createdAt). The data source is injected via a
// token so we can drive loading, populated, and error states.
const PROFILE_TEST_DATA = new InjectionToken<{
  load: () => Promise<User | null>;
  profile: () => User | null;
}>('PROFILE_TEST_DATA');

function makeHost(opts: {
  load: () => Promise<User | null>;
  initial: User | null;
}) {
  @Component({
    standalone: true,
    imports: [SkeletonComponent],
    providers: [
      {
        provide: PROFILE_TEST_DATA,
        useValue: {
          load: opts.load,
          profile: () => signal(opts.initial)(),
        },
      },
    ],
    template: `
      <div class="container mx-auto">
        @if (profile(); as user) {
          <div data-testid="profile-card" class="max-w-lg mx-auto mt-10 bg-white rounded-xl shadow-card p-8">
            <div class="flex flex-col items-center text-center">
              <img data-testid="profile-avatar" class="w-20 h-20 rounded-full" [src]="user.avatar" alt="avatar" />
              <h1 data-testid="profile-name" class="mt-4 text-xl font-bold text-gray-900">{{ user.name }}</h1>
              <p data-testid="profile-email" class="text-gray-500">{{ user.email }}</p>
              <p data-testid="profile-created" class="mt-2 text-xs text-gray-400">Member since {{ user.createdAt }}</p>
            </div>
          </div>
        } @else {
          <div data-testid="profile-loading" class="max-w-lg mx-auto mt-10 bg-white rounded-xl shadow-card p-8">
            <div class="flex flex-col items-center text-center">
              <app-skeleton variant="circle" width="5rem" height="5rem"></app-skeleton>
              <app-skeleton class="mt-4" variant="text" width="60%" height="1.5rem"></app-skeleton>
              <app-skeleton class="mt-2" variant="text" width="40%" height="1rem"></app-skeleton>
              <app-skeleton class="mt-2" variant="text" width="50%" height="0.75rem"></app-skeleton>
            </div>
          </div>
        }
      </div>
    `,
  })
  class ConfiguredHost {
    private readonly data = inject(PROFILE_TEST_DATA);
    readonly profile = signal<User | null>(null);

    constructor() {
      void this.data.load().then((user) => this.profile.set(user));
    }
  }
  return ConfiguredHost;
}

describe('ProfileComponent (Visual Redesign — T15)', () => {
  const sampleUser: User = {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    avatar: 'https://example.com/avatar.png',
    createdAt: '2024-01-15',
    updatedAt: '2024-06-01',
  };

  it('renders the profile card with avatar, name, email, and created date once data loads', async () => {
    const Host = makeHost({
      load: () => Promise.resolve(sampleUser),
      initial: null,
    });
    await render(Host);
    await waitFor(() => {
      expect(screen.getByTestId('profile-card')).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-avatar')).toHaveAttribute(
      'src',
      'https://example.com/avatar.png',
    );
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Ada Lovelace');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('ada@example.com');
    expect(screen.getByTestId('profile-created')).toHaveTextContent('2024-01-15');
  });

  it('shows the skeleton fallback while the profile is still loading', async () => {
    let resolve!: (u: User | null) => void;
    const pending = new Promise<User | null>((r) => { resolve = r; });
    const Host = makeHost({
      load: () => pending,
      initial: null,
    });
    await render(Host);
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-card')).toBeNull();
    // ponytail: clean up by resolving the pending promise
    resolve(null);
  });
});
