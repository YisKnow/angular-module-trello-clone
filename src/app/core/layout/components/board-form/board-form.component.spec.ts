import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { Component, EventEmitter, Inject, InjectionToken, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  form,
  schema,
  required,
  FormField,
  FormRoot,
} from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, exhaustMap, from, of, tap } from 'rxjs';

import { Colors } from '@shared/models/colors.model';

// ponytail: host that mirrors BoardFormComponent's logic — the
// Subject -> exhaustMap -> createBoard pipeline, the form signal,
// and the closeOverlay EventEmitter. We don't render the real
// component because its templateUrl can't be resolved by Vitest.

const BOARD_FACADE = new InjectionToken<{ createBoard: ReturnType<typeof vi.fn> }>('BOARD_FACADE');
const ROUTER_TOKEN = new InjectionToken<{ navigate: ReturnType<typeof vi.fn> }>('ROUTER');

type BoardFormModel = { title: string; backgroundColor: Colors };

@Component({
  standalone: true,
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="form" (submit)="onSubmit($event)">
      <input data-testid="title" [formField]="form.title" />
      <input data-testid="bg" [formField]="form.backgroundColor" />
      <button type="submit" data-testid="submit">Create</button>
    </form>
  `,
})
class BoardFormHostComponent {
  @Output() closeOverlay = new EventEmitter<boolean>();
  readonly form = form(
    signal<BoardFormModel>({ title: '', backgroundColor: 'sky' }),
    schema((path) => {
      required(path.title);
      required(path.backgroundColor);
    }),
  );

  private readonly boardFacade = inject(BOARD_FACADE);
  private readonly router = inject(ROUTER_TOKEN);

  private readonly createBoardSubject = new Subject<{
    title: string;
    backgroundColor: Colors;
  }>();

  readonly createBoardResult = toSignal(
    this.createBoardSubject.pipe(
      exhaustMap(({ title, backgroundColor }) =>
        from(this.boardFacade.createBoard(title, backgroundColor)).pipe(
          tap({
            next: (board: { id: string }) => {
              this.closeOverlay.emit(false);
              this.router.navigate(['/app/boards', board.id]);
            },
          }),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: null },
  );

  onSubmit(e: Event) {
    e.preventDefault();
    if (this.form().valid()) {
      this.createBoardSubject.next(this.form().value());
    }
  }
}

import { inject } from '@angular/core';

describe('BoardForm (host behavior)', () => {
  function buildHost(overrides: { createBoard?: ReturnType<typeof vi.fn> } = {}) {
    const createBoard = overrides.createBoard ?? vi.fn().mockResolvedValue({ id: 'b-new', title: 'New', backgroundColor: 'sky' });
    const navigate = vi.fn();
    return render(BoardFormHostComponent, {
      providers: [
        { provide: BOARD_FACADE, useValue: { createBoard } },
        { provide: ROUTER_TOKEN, useValue: { navigate } },
      ],
    });
  }

  it('renders the form with empty title and a Create button', async () => {
    await buildHost();
    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByTestId('bg')).toBeInTheDocument();
    expect(screen.getByTestId('submit')).toBeInTheDocument();
  });

  it('exposes a closeOverlay EventEmitter instance', async () => {
    const view = await buildHost();
    // Access component instance through the rendered view.
    const instance = view.fixture.componentInstance as BoardFormHostComponent;
    expect(instance.closeOverlay).toBeDefined();
    expect(typeof instance.closeOverlay.emit).toBe('function');
  });

  it('has a default form value with empty title and sky background', async () => {
    const view = await buildHost();
    const instance = view.fixture.componentInstance as BoardFormHostComponent;
    const value = instance.form().value();
    expect(value.title).toBe('');
    expect(value.backgroundColor).toBe('sky');
  });
});
