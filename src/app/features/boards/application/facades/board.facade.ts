import { Inject, Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';

import { Colors } from '@shared/models/colors.model';
import { RequestStatus } from '@shared/models/request-status.model';

import { Board } from '../../domain/entities/board.entity';
import { Card } from '../../domain/entities/card.entity';
import { List } from '../../domain/entities/list.entity';
import { getCardPosition, getPositionForNewItem } from '../../domain/rules/position.rule';
import { BOARD_REPOSITORY, BoardRepository } from '../../domain/repositories/board.repository';
import { CreateBoardUseCase } from '../../domain/use-cases/create-board.use-case';
import { CreateCardUseCase } from '../../domain/use-cases/create-card.use-case';
import { CreateListUseCase } from '../../domain/use-cases/create-list.use-case';
import { GetBoardUseCase } from '../../domain/use-cases/get-board.use-case';
import { MoveCardUseCase } from '../../domain/use-cases/move-card.use-case';

const DEFAULT_BG: Colors = 'sky';

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  // UI state — showCardForm per list. This used to live on the List
  // entity but it's a presentation concern; it belongs in the facade.
  private readonly _openCardFormListId = signal<string | null>(null);

  private readonly _board: WritableSignal<Board | null> = signal(null);
  private readonly _status: WritableSignal<RequestStatus> = signal('init');

  readonly board: Signal<Board | null> = this._board.asReadonly();
  readonly status: Signal<RequestStatus> = this._status.asReadonly();

  // Computed background color, defaults to 'sky' when no board loaded.
  readonly backgroundColor: Signal<Colors> = computed<Colors>(
    () => this._board()?.backgroundColor ?? DEFAULT_BG,
  );

  // Repository used for rollback after a failed move. Optional so
  // the facade can be constructed without it (e.g. in tests that
  // don't exercise the rollback path). When running in production
  // with `providedIn: 'root'`, Angular's DI injects the bound
  // BOARD_REPOSITORY token automatically.
  private readonly boardRepository: BoardRepository | null;

  constructor(
    private readonly getBoardUseCase: GetBoardUseCase = inject(GetBoardUseCase),
    private readonly createBoardUseCase: CreateBoardUseCase = inject(CreateBoardUseCase),
    private readonly moveCardUseCase: MoveCardUseCase = inject(MoveCardUseCase),
    private readonly createCardUseCase: CreateCardUseCase = inject(CreateCardUseCase),
    private readonly createListUseCase: CreateListUseCase = inject(CreateListUseCase),
    // Tests pass a mock repository (or null) as the 7th argument.
    @Inject(BOARD_REPOSITORY)
    boardRepository: BoardRepository | null,
  ) {
    this.boardRepository = boardRepository;
  }

  async loadBoard(id: Board['id']): Promise<void> {
    this._status.set('loading');
    try {
      const board = await this.getBoardUseCase.execute(id);
      this._board.set(board);
      this._status.set('success');
    } catch {
      this._board.set(null);
      this._status.set('failed');
    }
  }

  createBoard(title: string, backgroundColor: Colors): Promise<Board> {
    return this.createBoardUseCase.execute(title, backgroundColor);
  }

  // Optimistic move: reorders local state immediately, then persists.
  // On failure, reloads the full board to reconcile against the
  // server's source of truth.
  async moveCard(
    card: Card,
    position: number,
    listId: string | number,
  ): Promise<void> {
    const current = this._board();
    if (!current) return;

    const updated: Board = {
      ...current,
      lists: current.lists.map((list) => {
        if (list.id === listId) {
          return { ...list, cards: list.cards };
        }
        return { ...list, cards: list.cards.filter((c) => c.id !== card.id) };
      }),
    };

    // Re-insert the card at the new position within target list.
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
      await this.moveCardUseCase.execute(card.id, position, listId);
    } catch (err) {
      // Reload the board from the server so the UI reconciles.
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
    const card = await this.createCardUseCase.execute(
      title,
      position,
      list.id,
      current.id,
    );
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
    const list = await this.createListUseCase.execute(
      title,
      position,
      current.id,
    );
    this._board.set({
      ...current,
      lists: [...current.lists, { ...list, cards: [] }],
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
    // No-op for now: background color is computed from the loaded
    // board; the next loadBoard(null) will clear the board signal
    // and the computed falls back to DEFAULT_BG.
    this._board.set(null);
  }
}
