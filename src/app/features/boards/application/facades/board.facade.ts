import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';

import { Colors } from '@shared/models/colors.model';

import { Board } from '../../domain/entities/board.entity';
import { Card } from '../../domain/entities/card.entity';
import { List } from '../../domain/entities/list.entity';
import { getCardPosition, getPositionForNewItem } from '../../domain/rules/position.rule';
import { BOARD_REPOSITORY, BoardRepository } from '../../domain/repositories/board.repository';
import { CARD_REPOSITORY, CardRepository } from '../../domain/repositories/card.repository';
import { LIST_REPOSITORY, ListRepository } from '../../domain/repositories/list.repository';

type RequestStatus = 'init' | 'loading' | 'success' | 'failed';
const DEFAULT_BG: Colors = 'sky';

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  private readonly _openCardFormListId = signal<string | null>(null);
  private readonly _board: WritableSignal<Board | null> = signal(null);
  private readonly _status: WritableSignal<RequestStatus> = signal('init');

  readonly board: Signal<Board | null> = this._board.asReadonly();
  readonly status: Signal<RequestStatus> = this._status.asReadonly();

  readonly backgroundColor: Signal<Colors> = computed<Colors>(
    () => this._board()?.backgroundColor ?? DEFAULT_BG,
  );

  // ponytail: inlined use case wrappers — call repositories directly.
  private readonly boardRepository = inject(BOARD_REPOSITORY, { optional: true });
  private readonly cardRepository = inject(CARD_REPOSITORY, { optional: true });
  private readonly listRepository = inject(LIST_REPOSITORY, { optional: true });

  async loadBoard(id: Board['id']): Promise<void> {
    this._status.set('loading');
    try {
      const board = await this.boardRepos().getBoard(id);
      this._board.set(board);
      this._status.set('success');
    } catch {
      this._board.set(null);
      this._status.set('failed');
    }
  }

  createBoard(title: string, backgroundColor: Colors): Promise<Board> {
    return this.boardRepos().createBoard(title, backgroundColor);
  }

  async moveCard(card: Card, position: number, listId: string | number): Promise<void> {
    const current = this._board();
    if (!current) return;

    const updated: Board = {
      ...current,
      lists: current.lists.map((list) => {
        if (list.id === listId) return { ...list, cards: list.cards };
        return { ...list, cards: list.cards.filter((c) => c.id !== card.id) };
      }),
    };

    const targetList = updated.lists.find((l) => l.id === listId);
    if (targetList) {
      const newCards: Card[] = [...targetList.cards];
      newCards.splice(position, 0, { ...card, position, list: targetList });
      targetList.cards = newCards.map((c, i) => ({
        ...c,
        position: getCardPosition(newCards, i),
      }));
    }

    this._board.set(updated);

    try {
      await this.cardRepos().update(card.id, { position, listId });
    } catch (err) {
      if (this.boardRepository) {
        const refreshed = await this.boardRepository.getBoard(current.id);
        this._board.set(refreshed);
      }
      throw err;
    }
  }

  async createCard(list: List, title: string): Promise<void> {
    const current = this._board();
    if (!current) return;
    const position = getPositionForNewItem(list.cards);
    const card = await this.cardRepos().create({ title, position, listId: list.id, boardId: current.id });
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

  async createList(title: string): Promise<void> {
    const current = this._board();
    if (!current) return;
    const position = getPositionForNewItem(current.lists);
    const list = await this.listRepos().create({ title, position, boardId: current.id });
    this._board.set({ ...current, lists: [...current.lists, { ...list, cards: [] }] });
  }

  openCardForm(listId: string): void { this._openCardFormListId.set(listId); }
  closeCardForm(): void { this._openCardFormListId.set(null); }
  isCardFormOpen(listId: string): boolean { return this._openCardFormListId() === listId; }

  resetBackgroundColor(): void { this._board.set(null); }

  private boardRepos(): BoardRepository { if (!this.boardRepository) throw new Error('Board repo not available'); return this.boardRepository; }
  private cardRepos(): CardRepository { if (!this.cardRepository) throw new Error('Card repo not available'); return this.cardRepository; }
  private listRepos(): ListRepository { if (!this.listRepository) throw new Error('List repo not available'); return this.listRepository; }
}
