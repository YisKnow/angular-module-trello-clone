import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';

import { Colors } from '@shared/models/colors.model';

import { Board, BoardSummary } from '../../domain/entities/board.entity';
import { Card } from '../../domain/entities/card.entity';
import { List } from '../../domain/entities/list.entity';
import { getCardPosition, getPositionForNewItem } from '../../domain/rules/position.rule';
import { BOARD_REPOSITORY } from '../../domain/repositories/board.repository';
import { CARD_REPOSITORY } from '../../domain/repositories/card.repository';
import { LIST_REPOSITORY } from '../../domain/repositories/list.repository';
import { ME_REPOSITORY } from '@features/auth/domain/repositories/me.repository';

type RequestStatus = 'init' | 'loading' | 'success' | 'failed';
const DEFAULT_BG: Colors = 'sky';

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  private readonly _openCardFormListId = signal<string | null>(null);
  private readonly _board: WritableSignal<Board | null> = signal(null);
  private readonly _status: WritableSignal<RequestStatus> = signal('init');
  // Bumped whenever the boards list changes (create/delete) so any
  // rxResource watching it can refetch.
  private readonly _boardsVersion = signal(0);

  readonly board: Signal<Board | null> = this._board.asReadonly();
  readonly status: Signal<RequestStatus> = this._status.asReadonly();
  readonly boardsVersion: Signal<number> = this._boardsVersion.asReadonly();

  readonly backgroundColor: Signal<Colors> = computed<Colors>(
    () => this._board()?.backgroundColor ?? DEFAULT_BG,
  );

  // ponytail: inlined use case wrappers — call repositories directly.
  private readonly boardRepository = inject(BOARD_REPOSITORY);
  private readonly cardRepository = inject(CARD_REPOSITORY);
  private readonly listRepository = inject(LIST_REPOSITORY);
  private readonly meRepository = inject(ME_REPOSITORY);

  async loadBoard(id: Board['id']): Promise<void> {
    this._status.set('loading');
    try {
      const board = await this.boardRepository.getBoard(id);
      this._board.set(board);
      this._status.set('success');
    } catch {
      this._board.set(null);
      this._status.set('failed');
    }
  }

  getMyBoards(): Promise<BoardSummary[]> {
    return this.meRepository.getMeBoards();
  }

  async createBoard(title: string, backgroundColor: Colors): Promise<Board> {
    const board = await this.boardRepository.createBoard(title, backgroundColor);
    this._boardsVersion.update((v) => v + 1);
    return board;
  }

  async deleteBoard(id: Board['id']): Promise<void> {
    await this.boardRepository.deleteBoard(id);
    this._boardsVersion.update((v) => v + 1);
  }

  async moveCard(card: Card, position: number, listId: string | number): Promise<void> {
    const current = this._board();
    if (!current) return;

    // CDK's moveItemInArray/transferArrayItem already mutated the target
    // list's cards array in place. We must NOT splice the card back in —
    // doing so creates a duplicate. We only need to:
    //   1. Remove the card from any other list (cross-list cleanup)
    //   2. Recompute buffer-space positions on the already-moved array
    const updated: Board = {
      ...current,
      lists: current.lists.map((list) => {
        if (list.id === listId) {
          const newCards = list.cards.map((c, i) => ({
            ...c,
            position: getCardPosition(list.cards, i),
          }));
          return { ...list, cards: newCards };
        }
        return { ...list, cards: list.cards.filter((c) => c.id !== card.id) };
      }),
    };

    this._board.set(updated);

    const targetList = updated.lists.find((l) => l.id === listId);
    const bufferPosition = targetList
      ? getCardPosition(targetList.cards, position)
      : position;

    try {
      await this.cardRepository.update(card.id, { position: bufferPosition, listId });
    } catch (err) {
      const refreshed = await this.boardRepository.getBoard(current.id);
      this._board.set(refreshed);
      throw err;
    }
  }

  async createCard(list: List, title: string): Promise<void> {
    const current = this._board();
    if (!current) return;
    const position = getPositionForNewItem(list.cards);
    const card = await this.cardRepository.create({ title, position, listId: list.id, boardId: current.id });
    const updated: Board = {
      ...current,
      lists: current.lists.map((l) => {
        if (l.id !== list.id) return l;
        return { ...l, cards: [...l.cards, { ...card, list: l }] };
      }),
    };
    this._board.set(updated);
    this._openCardFormListId.set(null);
  }

  async updateCardDescription(cardId: Card['id'], description: string): Promise<void> {
    const current = this._board();
    if (!current) return;
    const updated = await this.cardRepository.update(cardId, { description });
    this._board.set({
      ...current,
      lists: current.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) => (c.id === updated.id ? { ...c, description: updated.description } : c)),
      })),
    });
  }

  async createList(title: string): Promise<void> {
    const current = this._board();
    if (!current) return;
    const position = getPositionForNewItem(current.lists);
    const list = await this.listRepository.create({ title, position, boardId: current.id });
    this._board.set({ ...current, lists: [...current.lists, { ...list, cards: [] }] });
  }

  openCardForm(listId: string): void { this._openCardFormListId.set(listId); }
  closeCardForm(): void { this._openCardFormListId.set(null); }
  isCardFormOpen(listId: string): boolean { return this._openCardFormListId() === listId; }

  resetBackgroundColor(): void { this._board.set(null); }
}
