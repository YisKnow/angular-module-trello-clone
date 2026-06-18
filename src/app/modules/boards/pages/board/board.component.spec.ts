import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Subject, of, throwError } from 'rxjs';
import { Component } from '@angular/core';

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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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
  title: 'Test Board',
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

// ---------------------------------------------------------------------------
// ATL DOM integration test — renders a component via ATL render()
// ---------------------------------------------------------------------------

describe('ATL integration', () => {
  // ATL's render() + screen queries — proof that the ATL + Vitest
  // pipeline works end-to-end.
  it('renders inline template with ATL render()', async () => {
    await render(
      '<p data-testid="atl-works">Angular Testing Library ready</p>',
      {},
    );
    expect(screen.getByTestId('atl-works')).toHaveTextContent(
      'Angular Testing Library ready',
    );
  });

  // WARNING: ATL render() with a component that has templateUrl requires
  // the template to be pre-resolved (via resolveComponentResources or
  // TestBed.overrideComponent with identical imports). For new component
  // tests, prefer writing components with inline template or using
  // overrideComponent + TestBed.createComponent() for service-level tests.
  //
  // https://testing-library.com/docs/angular-testing-library/intro
});

// ---------------------------------------------------------------------------
// Service-level tests — test component LOGIC without pulling in full DOM
// ---------------------------------------------------------------------------

describe('BoardComponent card movement', () => {
  let component: BoardComponent;
  let cardsService: { update: ReturnType<typeof vi.fn> };
  let boardsService: {
    getBoards: ReturnType<typeof vi.fn>;
    getPosition: ReturnType<typeof vi.fn>;
    getPositionNewItem: ReturnType<typeof vi.fn>;
    setBackgroundColor: ReturnType<typeof vi.fn>;
    bufferSpace: number;
    backgroundColor: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    cardsService = { update: vi.fn() };
    boardsService = {
      getBoards: vi.fn(),
      getPosition: vi.fn().mockReturnValue(100),
      getPositionNewItem: vi.fn().mockReturnValue(65535),
      setBackgroundColor: vi.fn(),
      bufferSpace: 65535,
      backgroundColor: vi.fn() as never,
    };

    TestBed.resetTestingModule();
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
    setupBoard(makeBoard([list1, list2]));

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

    await Promise.resolve();
    expect(cardsService.update).toHaveBeenCalledTimes(1);
    expect(cardsService.update).toHaveBeenNthCalledWith(
      1,
      'c1',
      expect.objectContaining({ listId: list2.id, position: 100 }),
    );

    const ev2 = makeDropEvent(
      { data: list2.cards, id: list2.id },
      { data: list1.cards, id: list1.id },
      0,
      0,
    );
    component.drop(ev2);

    await Promise.resolve();
    expect(cardsService.update).toHaveBeenCalledTimes(1);

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
    // Suppress the expected console.error from the catchError handler
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const list1 = makeList('l1', [makeCard('c1', 100)]);
    const refreshed = makeBoard([makeList('l1', [makeCard('c1', 200)])]);
    setupBoard(makeBoard([list1]));

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

    await new Promise((r) => setTimeout(r, 0));
    await Promise.resolve();

    expect(cardsService.update).toHaveBeenCalled();
    expect(boardsService.getBoards).toHaveBeenCalledTimes(2);
    expect(component.board()).toEqual(refreshed);

    vi.mocked(console.error).mockRestore();
  });
});
