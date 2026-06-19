import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/angular';
import { Component, InjectionToken, Input, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { defer, from } from 'rxjs';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { BoardSummary } from '@boards/domain/entities/board.entity';

// ponytail: inline stub for CardColorComponent (avoids the real component's
// templateUrl which would need resolveComponentResources).
@Component({
  standalone: true,
  selector: 'app-card-color',
  template: `<div data-testid="card-color">{{ title() }}</div>`,
})
class CardColorStubComponent {
  @Input() color: string = 'sky';
  title = () => '';
}

const BOARDS_TEST_DATA = new InjectionToken<{ load: () => BoardSummary[] }>('BOARDS_TEST_DATA');

function makeHost(loader: () => BoardSummary[]) {
  @Component({
    standalone: true,
    imports: [CardColorStubComponent, SkeletonComponent],
    providers: [{ provide: BOARDS_TEST_DATA, useValue: { load: loader } }],
    template: `
      <div class="container mx-auto flex mt-10">
        <div class="w-1/5 mr-4">
          <ul class="flex flex-col font-medium text-gray-700 mb-5">
            <li><a class="block py-1 px-3">Boards</a></li>
          </ul>
        </div>
        <div class="w-full">
          <h1>Recently viewed</h1>
          @if (boards.isLoading()) {
            <div
              data-testid="boards-skeleton"
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              <app-skeleton variant="card" height="6rem"></app-skeleton>
              <app-skeleton variant="card" height="6rem"></app-skeleton>
              <app-skeleton variant="card" height="6rem"></app-skeleton>
              <app-skeleton variant="card" height="6rem"></app-skeleton>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              @for (board of boards.value(); track board.id) {
                <app-card-color [color]="board.backgroundColor" [title]="'test'">{{
                  board.title
                }}</app-card-color>
              } @empty {
                <div
                  data-testid="empty-state"
                  class="col-span-full flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed border-gray-300"
                >
                  <span class="material-symbols-outlined text-5xl text-gray-400">view_kanban</span>
                  <h2 class="mt-4 text-lg font-bold text-gray-700">No boards yet</h2>
                  <p class="mt-1 text-sm text-gray-500">Create your first board to get started.</p>
                  <button
                    type="button"
                    class="mt-6 rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 font-medium focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
                  >
                    Create your first board
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    `,
  })
  class ConfiguredHost {
    private readonly data = inject(BOARDS_TEST_DATA);
    readonly boards = rxResource({
      stream: () => defer(() => from(Promise.resolve(this.data.load()))),
      defaultValue: [] as BoardSummary[],
    });
  }
  return ConfiguredHost;
}

describe('BoardsPage (Visual Redesign — T12 skeleton & empty state)', () => {
  it('shows the skeleton grid while data is loading', async () => {
    let resolve!: (boards: BoardSummary[]) => void;
    const pending = new Promise<BoardSummary[]>((r) => {
      resolve = r;
    });
    const Host = makeHost(() => pending as unknown as BoardSummary[]);
    await render(Host);
    expect(screen.getByTestId('boards-skeleton')).toBeInTheDocument();
  });

  it('shows the empty state CTA when the user has zero boards', async () => {
    const Host = makeHost(() => []);
    await render(Host);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText('No boards yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first board to get started.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create your first board' })).toBeInTheDocument();
  });

  it('does NOT show the empty state when there are boards', async () => {
    const boards: BoardSummary[] = [
      { id: '1', title: 'My roadmap', backgroundColor: 'primary' },
      { id: '2', title: 'Personal', backgroundColor: 'success' },
    ];
    const Host = makeHost(() => boards);
    await render(Host);
    await waitFor(() => {
      expect(screen.queryByTestId('empty-state')).toBeNull();
    });
  });
});
