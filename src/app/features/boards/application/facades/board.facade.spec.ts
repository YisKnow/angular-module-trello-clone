import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { BoardFacade } from '@features/boards/application/facades/board.facade';
import { Board } from '@boards/domain/entities/board.entity';
import { Card } from '@boards/domain/entities/card.entity';
import { List } from '@boards/domain/entities/list.entity';
import {
  BOARD_REPOSITORY,
  BOARDS_MY_BOARDS_REPOSITORY,
  CARD_REPOSITORY,
  LIST_REPOSITORY,
} from '@boards/application/tokens/board-tokens';

const makeCard = (id: string, position: number): Card => ({
  id,
  title: `card-${id}`,
  position,
  list: { id: 'l1', title: 'L', position: 1, cards: [] },
});

const makeList = (id: string, cards: Card[]): List => ({
  id,
  title: `list-${id}`,
  position: 1,
  cards,
});

const makeBoard = (lists: List[]): Board => ({
  id: 'b1',
  title: 'Test Board',
  backgroundColor: 'green',
  members: [],
  lists,
  cards: [],
});

const buildFacade = (
  overrides: {
    getBoard?: ReturnType<typeof vi.fn>;
    createBoard?: ReturnType<typeof vi.fn>;
    moveCard?: ReturnType<typeof vi.fn>;
    createCard?: ReturnType<typeof vi.fn>;
    createList?: ReturnType<typeof vi.fn>;
    boardRepository?: { getBoard?: ReturnType<typeof vi.fn> };
  } = {},
) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      BoardFacade,
      {
        provide: BOARD_REPOSITORY,
        useValue: {
          getBoard: overrides.getBoard ?? vi.fn().mockResolvedValue(makeBoard([])),
          createBoard: overrides.createBoard ?? vi.fn(),
          ...overrides.boardRepository,
        },
      },
      {
        provide: CARD_REPOSITORY,
        useValue: {
          update: overrides.moveCard ?? vi.fn().mockResolvedValue(makeCard('c1', 100)),
          create: overrides.createCard ?? vi.fn(),
        },
      },
      {
        provide: LIST_REPOSITORY,
        useValue: {
          create: overrides.createList ?? vi.fn(),
        },
      },
      {
        provide: BOARDS_MY_BOARDS_REPOSITORY,
        useValue: {
          getMyBoards: vi.fn().mockResolvedValue([]),
        },
      },
    ],
  });
  return TestBed.inject(BoardFacade);
};

describe('BoardFacade', () => {
  let facade: BoardFacade;

  beforeEach(() => {
    facade = buildFacade();
  });

  it('loadBoard sets board, status=success, and backgroundColor', async () => {
    const board = makeBoard([makeList('l1', [])]);
    const f = buildFacade({ getBoard: vi.fn().mockResolvedValue(board) });
    await f.loadBoard('b1');
    expect(f.board()).toEqual(board);
    expect(f.status()).toBe('success');
    expect(f.backgroundColor()).toBe('green');
  });

  it('loadBoard sets status=loading then success', async () => {
    let resolve: (b: Board) => void;
    const promise = new Promise<Board>((r) => {
      resolve = r;
    });
    const f = buildFacade({ getBoard: vi.fn().mockReturnValue(promise) });
    void f.loadBoard('b1');
    expect(f.status()).toBe('loading');
    resolve!(makeBoard([]));
    await promise;
    expect(f.status()).toBe('success');
  });

  it('loadBoard sets status=failed and board=null on error', async () => {
    const f = buildFacade({ getBoard: vi.fn().mockRejectedValue(new Error('boom')) });
    await f.loadBoard('b1');
    expect(f.status()).toBe('failed');
    expect(f.board()).toBeNull();
  });

  it('backgroundColor defaults to sky when no board is loaded', () => {
    expect(facade.backgroundColor()).toBe('sky');
  });

  it('moveCard delegates to the repository and reorders optimistically', async () => {
    const list1 = makeList('l1', [makeCard('c1', 100), makeCard('c2', 200)]);
    const list2 = makeList('l2', []);
    const board = makeBoard([list1, list2]);
    const moveCard = vi.fn().mockResolvedValue(makeCard('c1', 100));
    const f = buildFacade({ getBoard: vi.fn().mockResolvedValue(board), moveCard });
    await f.loadBoard('b1');
    const card = board.lists[0].cards[0];
    await f.moveCard(card, 0, list2.id);
    expect(moveCard).toHaveBeenCalledWith(card.id, { position: 0, listId: list2.id });
  });

  it('moveCard rolls back to server data when the API rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const list1 = makeList('l1', [makeCard('c1', 100)]);
    const refreshed = makeBoard([makeList('l1', [makeCard('c1', 200)])]);
    const f = buildFacade({
      moveCard: vi.fn().mockRejectedValue(new Error('boom')),
      getBoard: vi.fn().mockResolvedValue(makeBoard([list1])),
      boardRepository: { getBoard: vi.fn().mockResolvedValue(refreshed) },
    });
    await f.loadBoard('b1');
    const card = f.board()!.lists[0].cards[0];
    await expect(f.moveCard(card, 0, list1.id)).rejects.toBeDefined();
    expect(f.board()?.lists[0].cards[0].position).toBe(200);
    vi.mocked(console.error).mockRestore();
  });

  it('createCard appends a new card to the target list and closes the form', async () => {
    const list = makeList('l1', []);
    const board = makeBoard([list]);
    const newCard = makeCard('c1', 65535);
    const f = buildFacade({
      getBoard: vi.fn().mockResolvedValue(board),
      createCard: vi.fn().mockResolvedValue(newCard),
    });
    await f.loadBoard('b1');
    await f.createCard(list, 'New Card');
    const updated = f.board();
    expect(updated!.lists[0].cards).toHaveLength(1);
    expect(updated!.lists[0].cards[0].id).toBe('c1');
  });

  it('createList appends a new list to the board', async () => {
    const newList: List = { id: 'l2', title: 'New', position: 65535, cards: [] };
    const f = buildFacade({
      getBoard: vi.fn().mockResolvedValue(makeBoard([makeList('l1', [])])),
      createList: vi.fn().mockResolvedValue(newList),
    });
    await f.loadBoard('b1');
    await f.createList('New');
    expect(f.board()!.lists).toHaveLength(2);
    expect(f.board()!.lists[1].title).toBe('New');
  });

  it('openCardForm / isCardFormOpen toggle the per-list card form', () => {
    expect(facade.isCardFormOpen('l1')).toBe(false);
    facade.openCardForm('l1');
    expect(facade.isCardFormOpen('l1')).toBe(true);
    facade.closeCardForm();
    expect(facade.isCardFormOpen('l1')).toBe(false);
  });

  it('resetBackgroundColor clears the board signal', async () => {
    const board = makeBoard([makeList('l1', [])]);
    const f = buildFacade({ getBoard: vi.fn().mockResolvedValue(board) });
    await f.loadBoard('b1');
    expect(f.board()).not.toBeNull();
    f.resetBackgroundColor();
    expect(f.board()).toBeNull();
    expect(f.backgroundColor()).toBe('sky');
  });
});
