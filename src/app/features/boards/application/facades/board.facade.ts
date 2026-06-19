import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';

import { Colors } from '@shared/models/colors.model';

import { Board } from '../../domain/entities/board.entity';
import { Card } from '../../domain/entities/card.entity';
import { List } from '../../domain/entities/list.entity';
import {
  BOARD_REPOSITORY,
  BOARDS_MY_BOARDS_REPOSITORY,
  CARD_REPOSITORY,
  LIST_REPOSITORY,
} from '../tokens/board-tokens';
import {
  CreateCardUseCase,
  CreateBoardUseCase,
  CreateListUseCase,
  DeleteBoardUseCase,
  LoadBoardUseCase,
  LoadMyBoardsUseCase,
  MoveCardUseCase,
  UpdateCardDescriptionUseCase,
} from '../use-cases/board.use-cases';

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

  // Use cases wired through repository contracts. The facade stays the
  // public API for presentation; presentation should not see use cases
  // or repositories directly.
  private readonly loadBoardUseCase = new LoadBoardUseCase(inject(BOARD_REPOSITORY));
  private readonly createBoardUseCase = new CreateBoardUseCase(inject(BOARD_REPOSITORY));
  private readonly deleteBoardUseCase = new DeleteBoardUseCase(inject(BOARD_REPOSITORY));
  private readonly loadMyBoardsUseCase = new LoadMyBoardsUseCase(
    inject(BOARDS_MY_BOARDS_REPOSITORY),
  );
  private readonly moveCardUseCase = new MoveCardUseCase(
    inject(CARD_REPOSITORY),
    inject(BOARD_REPOSITORY),
  );
  private readonly updateCardDescriptionUseCase = new UpdateCardDescriptionUseCase(
    inject(CARD_REPOSITORY),
  );
  private readonly createCardUseCase = new CreateCardUseCase(inject(CARD_REPOSITORY));
  private readonly createListUseCase = new CreateListUseCase(inject(LIST_REPOSITORY));

  async loadBoard(id: Board['id']): Promise<void> {
    this._status.set('loading');
    try {
      const board = await this.loadBoardUseCase.execute(id);
      this._board.set(board);
      this._status.set('success');
    } catch {
      this._board.set(null);
      this._status.set('failed');
    }
  }

  getMyBoards() {
    return this.loadMyBoardsUseCase.execute();
  }

  async createBoard(title: string, backgroundColor: Colors): Promise<Board> {
    const board = await this.createBoardUseCase.execute(title, backgroundColor);
    this._boardsVersion.update((v) => v + 1);
    return board;
  }

  async deleteBoard(id: Board['id']): Promise<void> {
    await this.deleteBoardUseCase.execute(id);
    this._boardsVersion.update((v) => v + 1);
  }

  async moveCard(card: Card, position: number, listId: string | number): Promise<void> {
    const current = this._board();
    if (!current) return;

    try {
      const { next } = await this.moveCardUseCase.execute(current, card, position, listId);
      this._board.set(next);
    } catch (err) {
      const refreshed = (err as { __board?: Board }).__board;
      if (refreshed) {
        this._board.set(refreshed);
      }
      throw err;
    }
  }

  async createCard(list: List, title: string): Promise<void> {
    const current = this._board();
    if (!current) return;
    const { card } = await this.createCardUseCase.execute(list, title, current.id);
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
    const updated = await this.updateCardDescriptionUseCase.execute(cardId, description);
    this._board.set({
      ...current,
      lists: current.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) =>
          c.id === updated.id ? { ...c, description: updated.description } : c,
        ),
      })),
    });
  }

  async createList(title: string): Promise<void> {
    const current = this._board();
    if (!current) return;
    const { list } = await this.createListUseCase.execute(title, current.id, current.lists);
    this._board.set({ ...current, lists: [...current.lists, { ...list, cards: [] }] });
  }

  // ponytail: local-only deletion (no API). Used by the board page's
  // confirm dialog flow. The next time the board is fetched from the
  // server, the deleted items will reappear — that's acceptable for
  // this scope (the fake Trello API has no delete endpoints).
  deleteCardLocally(cardId: Card['id']): void {
    const current = this._board();
    if (!current) return;
    this._board.set({
      ...current,
      lists: current.lists.map((l) => ({
        ...l,
        cards: l.cards.filter((c) => c.id !== cardId),
      })),
    });
  }

  deleteListLocally(listId: string): void {
    const current = this._board();
    if (!current) return;
    this._board.set({
      ...current,
      lists: current.lists.filter((l) => l.id !== listId),
    });
  }

  openCardForm(listId: string): void {
    this._openCardFormListId.set(listId);
  }
  closeCardForm(): void {
    this._openCardFormListId.set(null);
  }
  isCardFormOpen(listId: string): boolean {
    return this._openCardFormListId() === listId;
  }

  resetBackgroundColor(): void {
    this._board.set(null);
  }
}
