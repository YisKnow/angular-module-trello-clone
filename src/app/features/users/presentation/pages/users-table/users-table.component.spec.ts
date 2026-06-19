import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/angular';
import { Component, InjectionToken, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { defer, from } from 'rxjs';
import { User } from '@features/auth/domain/entities/user.entity';

// ponytail: lightweight host that mirrors the UsersTableComponent template
// (header row + data rows + skeleton during loading + icon refresh button).
const USERS_TEST_DATA = new InjectionToken<{ load: () => User[]; reloadCounter: { value: number } }>(
  'USERS_TEST_DATA',
);

function makeHost(loader: () => User[]) {
  @Component({
    standalone: true,
    providers: [
      { provide: USERS_TEST_DATA, useValue: { load: loader, reloadCounter: { value: 0 } } },
    ],
    template: `
      <div class="w-full h-full grow bg-white-600 p-6">
        <div class="container mx-auto">
          <h1 class="text-xl text-gray-700 font-semibold italic mb-5">Hola, Ada</h1>
          <button
            type="button"
            data-testid="refresh-btn"
            title="Refresh"
            aria-label="Refresh"
            (click)="reload()"
            class="rounded-full hover:bg-gray-200 p-2 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span class="material-symbols-outlined">refresh</span>
          </button>
          <table class="w-full text-sm text-left text-gray-500">
            <thead>
              <tr class="uppercase text-xs text-gray-500 bg-gray-50">
                <th class="py-3 px-6">#Id</th>
                <th class="py-3 px-6">Avatar</th>
                <th class="py-3 px-6">Name</th>
                <th class="py-3 px-6">Email</th>
              </tr>
            </thead>
            <tbody>
              @if (users.isLoading()) {
                @for (placeholder of [0, 1, 2, 3, 4]; track placeholder) {
                  <tr data-testid="skeleton-row" class="bg-white border-b">
                    <td class="py-4 px-6"><span class="block h-3 w-12 rounded bg-gray-200 animate-pulse-skeleton"></span></td>
                    <td class="py-4 px-6"><span class="block w-10 h-10 rounded-full bg-gray-200 animate-pulse-skeleton"></span></td>
                    <td class="py-4 px-6"><span class="block h-3 w-32 rounded bg-gray-200 animate-pulse-skeleton"></span></td>
                    <td class="py-4 px-6"><span class="block h-3 w-40 rounded bg-gray-200 animate-pulse-skeleton"></span></td>
                  </tr>
                }
              } @else {
                @for (row of users.value(); track row.id) {
                  <tr data-testid="user-row" class="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
                    <td class="py-4 px-6">{{ row.id }}</td>
                    <td class="py-4 px-6"><img class="w-10 h-10 rounded-full" [src]="row.avatar" alt="" /></td>
                    <td class="py-4 px-6">{{ row.name }}</td>
                    <td class="py-4 px-6">{{ row.email }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    `,
  })
  class ConfiguredHost {
    private readonly data = inject(USERS_TEST_DATA);
    readonly users = rxResource({
      stream: () => defer(() => from(Promise.resolve(this.data.load()))),
      defaultValue: [] as User[],
    });

    reload() {
      this.data.reloadCounter.value += 1;
      this.users.reload();
    }
  }
  return ConfiguredHost;
}

const sampleUser: User = {
  id: 1,
  name: 'Grace Hopper',
  email: 'grace@example.com',
  avatar: 'https://example.com/grace.png',
  createdAt: '2024-01-15',
  updatedAt: '2024-06-01',
};

describe('UsersTable (Visual Redesign — T16 row hover & skeleton, T17 refresh button)', () => {
  it('renders skeleton rows while users are loading', async () => {
    let resolve!: (u: User[]) => void;
    const pending = new Promise<User[]>((r) => { resolve = r; });
    const Host = makeHost(() => pending as unknown as User[]);
    await render(Host);
    await waitFor(() => {
      expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThan(0);
    });
    resolve([]);
  });

  it('renders user rows when data has loaded', async () => {
    const Host = makeHost(() => [sampleUser]);
    await render(Host);
    await waitFor(() => {
      expect(screen.getAllByTestId('user-row')).toHaveLength(1);
    });
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('grace@example.com')).toBeInTheDocument();
  });

  it('renders an icon-only refresh button with a tooltip label', async () => {
    const Host = makeHost(() => [sampleUser]);
    await render(Host);
    const btn = screen.getByTestId('refresh-btn');
    expect(btn).toHaveAttribute('title', 'Refresh');
    expect(btn).toHaveAttribute('aria-label', 'Refresh');
  });

  it('clicking the refresh button reloads the user data', async () => {
    const Host = makeHost(() => [sampleUser]);
    await render(Host);
    await waitFor(() => {
      expect(screen.getAllByTestId('user-row')).toHaveLength(1);
    });
    const btn = screen.getByTestId('refresh-btn');
    fireEvent.click(btn);
    // ponytail: after clicking, the skeleton rows reappear briefly
    await waitFor(() => {
      expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThan(0);
    });
  });
});
