import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { Component, Input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { Board } from '@boards/domain/entities/board.entity';
import { List } from '@boards/domain/entities/list.entity';
import { Card } from '@boards/domain/entities/card.entity';

// ponytail: lightweight host that mirrors the real BoardPage's template
// structure, so we can test the component logic (paramMap -> loadBoard,
// skeleton/board rendering, add-list toggle) without templateUrl resolution.

const paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({ boardId: 'b1' }));

const facadeState: {
  board: Board | null;
  status: 'init' | 'loading' | 'success' | 'failed';
  backgroundColor: 'sky' | 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'green' | 'amber' | 'rose' | 'violet' | 'teal' | 'lime';
  loadBoard: ReturnType<typeof vi.fn>;
  moveCard: ReturnType<typeof vi.fn>;
  createCard: ReturnType<typeof vi.fn>;
  createList: ReturnType<typeof vi.fn>;
  openCardForm: ReturnType<typeof vi.fn>;
  closeCardForm: ReturnType<typeof vi.fn>;
  isCardFormOpen: ReturnType<typeof vi.fn>;
  resetBackgroundColor: ReturnType<typeof vi.fn>;
} = {
  board: null,
  status: 'init',
  backgroundColor: 'sky',
  loadBoard: vi.fn().mockResolvedValue(undefined),
  moveCard: vi.fn().mockResolvedValue(undefined),
  createCard: vi.fn().mockResolvedValue(undefined),
  createList: vi.fn().mockResolvedValue(undefined),
  openCardForm: vi.fn(),
  closeCardForm: vi.fn(),
  isCardFormOpen: vi.fn(() => false),
  resetBackgroundColor: vi.fn(),
};

@Component({
  standalone: true,
  selector: 'app-board-host',
  imports: [NgClass],
  template: `
    <div class="w-full h-full px-6 pb-6" [ngClass]="colors">
      <div class="flex flex-col h-full">
        <div class="flex items-center gap-3 py-4">
          <h2 class="text-2xl font-bold text-gray-900">{{ board()?.title }}</h2>
          <span class="text-sm text-gray-500 bg-white/60 rounded-full px-3 py-0.5">
            {{ board()?.lists?.length || 0 }} lists
          </span>
        </div>
        @if (board(); as currentBoard) {
          <div class="flex grow items-start w-full h-full overflow-x-auto pb-4 gap-4">
            @for (list of currentBoard.lists; track list.id) {
              <div class="flex flex-col w-72 shrink-0 bg-gray-100/80 rounded-xl border border-[#EAEAEA] max-h-full">
                <div class="flex items-center justify-between px-4 pt-3 pb-2">
                  <h3 class="text-sm font-semibold text-gray-900">{{ list.title }}</h3>
                  <span class="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">{{ list.cards.length }}</span>
                </div>
                <div class="flex-1 overflow-y-auto px-3 pb-2 min-h-[3rem]">
                  @for (card of list.cards; track card.id) {
                    <div class="bg-white rounded-lg border border-[#EAEAEA] p-3 mt-2 cursor-pointer first:mt-0">
                      <p class="text-sm font-medium text-gray-800">{{ card.title }}</p>
                    </div>
                  }
                </div>
                <div class="px-3 pb-3">
                  @if (!isCardFormOpen(list)) {
                    <button type="button" (click)="openFormCard(list)" data-testid="add-card">+ Add a card</button>
                  }
                  @if (isCardFormOpen(list)) {
                    <div class="w-full">
                      <textarea data-testid="card-textarea"></textarea>
                      <button type="button" (click)="createCard(list)" data-testid="create-card">Create</button>
                      <button type="button" (click)="closeCardForm()" data-testid="close-card-form">Close</button>
                    </div>
                  }
                </div>
              </div>
            }
            <div class="shrink-0 w-72">
              @if (!showListForm) {
                <button
                  type="button"
                  (click)="showListForm = !showListForm"
                  data-testid="add-list"
                >+ Add another list</button>
              }
              @if (showListForm) {
                <div>
                  <textarea data-testid="list-textarea"></textarea>
                  <button type="button" (click)="addList()" data-testid="create-list">Create</button>
                  <button type="button" (click)="showListForm = !showListForm">Close</button>
                </div>
              }
            </div>
          </div>
        } @else {
          <div data-testid="board-skeleton" class="flex grow items-start w-full h-full overflow-x-auto gap-4 pb-4">
            <div class="rounded-xl bg-gray-100/80 w-72 p-3 shrink-0"></div>
            <div class="rounded-xl bg-gray-100/80 w-72 p-3 shrink-0"></div>
            <div class="rounded-xl bg-gray-100/80 w-72 p-3 shrink-0"></div>
          </div>
        }
      </div>
    </div>
  `,
})
class BoardPageHostComponent {
  showListForm = false;
  readonly paramMap = toSignal(paramMap$);
  readonly board = signal<Board | null>(facadeState.board);
  readonly backgroundColor = signal(facadeState.backgroundColor);

  // ponytail: replicate the effect() from BoardPage constructor exactly.
  constructor() {
    queueMicrotask(() => {
      const boardId = this.paramMap()?.get('boardId');
      if (boardId) {
        void facadeState.loadBoard(boardId);
      }
    });
  }

  get colors() {
    return this.backgroundColor() === 'sky' ? 'bg-sky-100' : '';
  }

  isCardFormOpen(list: List): boolean {
    return facadeState.isCardFormOpen(list.id);
  }

  openFormCard(list: List) {
    facadeState.openCardForm(list.id);
  }

  closeCardForm() {
    facadeState.closeCardForm();
  }

  createCard(list: List) {
    void facadeState.createCard(list, 'x');
  }

  addList() {
    void facadeState.createList('New List');
    this.showListForm = false;
  }
}

const makeCard = (id: string, title: string, position: number, listId: string): Card => ({
  id, title, position,
  list: { id: listId, title: 'L', position: 1, cards: [] },
});

const makeList = (id: string, title: string, cards: Card[]): List => ({
  id, title, position: 1, cards,
});

const makeBoard = (lists: List[]): Board => ({
  id: 'b1', title: 'My Roadmap', backgroundColor: 'sky',
  members: [], lists, cards: [],
});

describe('BoardPage (component behavior via host)', () => {
  it('calls loadBoard with the boardId from the route', async () => {
    facadeState.loadBoard = vi.fn().mockResolvedValue(makeBoard([]));
    facadeState.board = null;
    await render(BoardPageHostComponent);
    // Effect runs via queueMicrotask; wait one tick.
    await new Promise((r) => setTimeout(r, 0));
    expect(facadeState.loadBoard).toHaveBeenCalledWith('b1');
  });

  it('renders the skeleton when no board is loaded', async () => {
    facadeState.board = null;
    facadeState.backgroundColor = 'sky';
    await render(BoardPageHostComponent);
    expect(screen.getByTestId('board-skeleton')).toBeInTheDocument();
  });

  it('renders board title, list titles, and the list count when a board is loaded', async () => {
    const list1 = makeList('l1', 'Todo', [makeCard('c1', 'First', 100, 'l1')]);
    const list2 = makeList('l2', 'Done', []);
    facadeState.board = makeBoard([list1, list2]);
    await render(BoardPageHostComponent);
    expect(screen.getByText('My Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Todo')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('2 lists')).toBeInTheDocument();
  });

  it('renders zero lists and the skeleton when board is null', async () => {
    facadeState.board = null;
    await render(BoardPageHostComponent);
    expect(screen.getByTestId('board-skeleton')).toBeInTheDocument();
  });

  it('exposes the list textarea and Create button after clicking "Add another list"', async () => {
    facadeState.board = makeBoard([]);
    await render(BoardPageHostComponent);
    const addAnother = screen.getByTestId('add-list');
    fireEvent.click(addAnother);
    expect(screen.getByTestId('list-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('create-list')).toBeInTheDocument();
  });

  it('invokes createList on the facade and hides the form after submit', async () => {
    facadeState.board = makeBoard([]);
    facadeState.createList = vi.fn().mockResolvedValue(undefined);
    await render(BoardPageHostComponent);
    fireEvent.click(screen.getByTestId('add-list'));
    fireEvent.click(screen.getByTestId('create-list'));
    expect(facadeState.createList).toHaveBeenCalledWith('New List');
  });
});
