import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { BoardsService } from './boards.service';
import { Card } from '@models/card.model';
import { List } from '@models/list.model';

const makeCard = (id: string, position: number): Card => ({
  id,
  title: `card-${id}`,
  position,
  list: { id: 'l1', title: 'L', position: 1, cards: [] },
});

const makeList = (id: string, position: number): List => ({
  id,
  title: `list-${id}`,
  position,
  cards: [],
});

describe('BoardsService', () => {
  let service: BoardsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    // Create service manually with DI-resolved HttpClient
    const http = TestBed.inject(HttpClient);
    service = new BoardsService(http);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // -----------------------------------------------------------------------
  // getPosition — 5 branches
  // -----------------------------------------------------------------------

  it('getPosition: single card returns bufferSpace', () => {
    const cards = [makeCard('c1', 100)];
    expect(service.getPosition(cards, 0)).toBe(65535);
  });

  it('getPosition: first card of many returns half of next position', () => {
    const cards = [makeCard('c1', 100), makeCard('c2', 200)];
    expect(service.getPosition(cards, 0)).toBe(100);
  });

  it('getPosition: middle card returns average of neighbours', () => {
    const cards = [
      makeCard('c1', 100),
      makeCard('c2', 200),
      makeCard('c3', 300),
    ];
    // (prevPosition + nextPosition) / 2 = (100 + 300) / 2 = 200
    expect(service.getPosition(cards, 1)).toBe(200);
  });

  it('getPosition: last card returns prev + bufferSpace', () => {
    const cards = [
      makeCard('c1', 100),
      makeCard('c2', 200),
      makeCard('c3', 300),
    ];
    expect(service.getPosition(cards, 2)).toBe(200 + 65535);
  });

  it('getPosition: fallback returns 0 for empty array', () => {
    const cards: Card[] = [];
    expect(service.getPosition(cards, 0)).toBe(0);
  });

  // -----------------------------------------------------------------------
  // getPositionNewItem — 2 branches
  // -----------------------------------------------------------------------

  it('getPositionNewItem: empty array returns bufferSpace', () => {
    expect(service.getPositionNewItem([])).toBe(65535);
  });

  it('getPositionNewItem: non-empty array returns last position + bufferSpace', () => {
    const cards = [makeCard('c1', 100), makeCard('c2', 200)];
    expect(service.getPositionNewItem(cards)).toBe(200 + 65535);
  });

  it('getPositionNewItem: works with List[] as well', () => {
    const lists = [makeList('l1', 1000)];
    expect(service.getPositionNewItem(lists)).toBe(1000 + 65535);
  });

  // -----------------------------------------------------------------------
  // backgroundColor signal
  // -----------------------------------------------------------------------

  it('setBackgroundColor updates the backgroundColor signal', () => {
    expect(service.backgroundColor()).toBe('sky');
    service.setBackgroundColor('red');
    expect(service.backgroundColor()).toBe('red');
  });

  // -----------------------------------------------------------------------
  // getBoards HTTP call
  // -----------------------------------------------------------------------

  it('getBoards makes GET request and sets background color', () => {
    const board = {
      id: 'b1',
      title: 'Test',
      backgroundColor: 'green' as const,
      members: [],
      lists: [],
      cards: [],
    };

    service.getBoards('b1').subscribe((b) => {
      expect(b.title).toBe('Test');
    });

    const req = httpMock.expectOne(
      (r) => r.method === 'GET' && r.url.includes('/api/v1/boards/b1'),
    );
    req.flush(board);

    expect(service.backgroundColor()).toBe('green');
  });

  // -----------------------------------------------------------------------
  // createBoard HTTP call
  // -----------------------------------------------------------------------

  it('createBoard makes POST request', () => {
    service.createBoard('New Board', 'violet').subscribe();

    const req = httpMock.expectOne(
      (r) => r.method === 'POST' && r.url.includes('/api/v1/boards'),
    );
    expect(req.request.body).toEqual({
      title: 'New Board',
      backgroundColor: 'violet',
    });
    req.flush({ id: 'b2' });
  });
});
