import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Subject, of, throwError } from 'rxjs';

import { BoardComponent } from './board.component';
import { BoardsService } from '@services/boards.service';
import { CardsService } from '@services/cards.service';
import { ListService } from '@services/list.service';
import { Card } from '@models/card.model';
import { Board } from '@models/board.model';
import { List } from '@models/list.model';

// Stub for ButtonComponent: avoids templateUrl resolution in the test runner.
@Component({ selector: 'app-btn', standalone: true, template: '' })
class ButtonStubComponent {}

const BOARD_ID = 'b1';
const LIST_ID = 'l1';

const makeCard = (id: string, position = 1): Card => ({
  id,
  title: `card-${id}`,
  position,
  list: { id: LIST_ID, title: 'L', position: 1, cards: [] },
});

const makeList = (id: string, cards: Card[]): List => ({
  id,
  title: `list-${id}`,
  position: 1,
  cards,
});

const makeBoard = (lists: List[]): Board => ({
  id: BOARD_ID,
  title: 'Board',
  backgroundColor: 'sky',
  members: [],
  lists,
  cards: [],
});

const makeDropEvent = (
  previousContainer: { data: Card[]; id: string },
  container: { data: Card[]; id: string },
  previousIndex: number,
  currentIndex: number,
): CdkDragDrop<Card[]> =>
  ({
    previousContainer: previousContainer as never,
    container: container as never,
    previousIndex,
    currentIndex,
    item: {} as never,
    isPointerOverContainer: true,
    distance: { x: 0, y: 0 },
    dropPoint: { x: 0, y: 0 },
    event: {} as never,
  }) as CdkDragDrop<Card[]>;

describe('BoardComponent card movement', () => {
  let component: BoardComponent;
  let cardsService: { update: ReturnType<typeof vi.fn> };
  let boardsService: {
    getBoards: ReturnType<typeof vi.fn>;
    getPosition: ReturnType<typeof vi.fn>;
    setBackgroundColor: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    cardsService = { update: vi.fn() };
    boardsService = {
      getBoards: vi.fn(),
      getPosition: vi.fn().mockReturnValue(100),
      setBackgroundColor: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: CardsService, useValue: cardsService },
        { provide: BoardsService, useValue: boardsService },
        { provide: ListService, useValue: { create: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ boardId: BOARD_ID })),
          },
        },
      ],
    })
      .overrideComponent(BoardComponent, {
        set: {
          template: '<div></div>',
          imports: [ButtonStubComponent],
        },
      });
  });

  const setupBoard = (board: Board) => {
    boardsService.getBoards.mockReturnValue(of(board));
    const fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Let the effect that calls getBoards settle.
    return fixture;
  };

  it('persists two rapid card drops in order', async () => {
    const list1 = makeList('l1', [makeCard('c1', 100), makeCard('c2', 200)]);
    const list2 = makeList('l2', []);
    await setupBoard(makeBoard([list1, list2]));

    const updateSubjects: Subject<Card>[] = [];
    cardsService.update.mockImplementation(() => {
      const s = new Subject<Card>();
      updateSubjects.push(s);
      return s.asObservable();
    });

    const ev1 = makeDropEvent(
      { data: list1.cards, id: list1.id },
      { data: list2.cards, id: list2.id },
      0,
      0,
    );
    component.drop(ev1);

    // Allow the first emission to reach the inner observable.
    await Promise.resolve();
    expect(cardsService.update).toHaveBeenCalledTimes(1);
    expect(cardsService.update).toHaveBeenNthCalledWith(
      1,
      'c1',
      expect.objectContaining({ listId: list2.id, position: 100 }),
    );

    // Second drop while the first is still in flight. With concatMap
    // the second call must be QUEUED, not dropped.
    const ev2 = makeDropEvent(
      { data: list2.cards, id: list2.id },
      { data: list1.cards, id: list1.id },
      0,
      0,
    );
    component.drop(ev2);

    await Promise.resolve();
    // concatMap holds the second emission until the first completes.
    expect(cardsService.update).toHaveBeenCalledTimes(1);

    // Complete the first update; concatMap should now dispatch the
    // queued second call.
    updateSubjects[0].next(makeCard('c1', 100));
    updateSubjects[0].complete();
    await Promise.resolve();
    await Promise.resolve();

    expect(cardsService.update).toHaveBeenCalledTimes(2);
    expect(cardsService.update).toHaveBeenNthCalledWith(
      2,
      'c1',
      expect.objectContaining({ listId: list1.id, position: 100 }),
    );

    updateSubjects[1].next(makeCard('c1', 100));
    updateSubjects[1].complete();
  });

  it('reloads the board state when a card update is rejected', async () => {
    const list1 = makeList('l1', [makeCard('c1', 100)]);
    const refreshed = makeBoard([makeList('l1', [makeCard('c1', 200)])]);
    await setupBoard(makeBoard([list1]));

    // The initial getBoards was already consumed by setupBoard; the
    // error reload is the second call. Queue just the refresh result.
    boardsService.getBoards.mockReturnValueOnce(of(refreshed));

    cardsService.update.mockReturnValue(
      throwError(() => new Error('boom')),
    );

    const ev = makeDropEvent(
      { data: list1.cards, id: list1.id },
      { data: list1.cards, id: list1.id },
      0,
      0,
    );
    component.drop(ev);

    // Wait for the error to propagate and the reload observable to emit.
    await new Promise((r) => setTimeout(r, 0));
    await Promise.resolve();

    expect(cardsService.update).toHaveBeenCalled();
    expect(boardsService.getBoards).toHaveBeenCalledTimes(2);
    expect(component.board()).toEqual(refreshed);
  });
});
