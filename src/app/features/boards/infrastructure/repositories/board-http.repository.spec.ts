import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { BoardHttpRepository } from '@features/boards/infrastructure/repositories/board-http.repository';
import { BOARD_REPOSITORY } from '@features/boards/domain/repositories/board.repository';
import { BoardMapper } from '@features/boards/application/mappers/board.mapper';

describe('BoardMapper', () => {
  it('toDomain maps a wire BoardDto to a Board entity', () => {
    const dto = {
      id: 'b1',
      title: 'Test Board',
      backgroundColor: 'green' as const,
      members: [
        {
          id: 1,
          name: 'Alice',
          email: 'a@b.com',
          avatar: 'pic.png',
          creationAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      ],
      lists: [
        {
          id: 'l1',
          title: 'ToDo',
          position: 1,
          cards: [
            {
              id: 'c1',
              title: 'Card 1',
              position: 100,
              list: { id: 'l1', title: 'ToDo', position: 1, cards: [] },
            },
          ],
        },
      ],
      cards: [],
    };
    const board = BoardMapper.toDomain(dto);
    expect(board.id).toBe('b1');
    expect(board.backgroundColor).toBe('green');
    expect(board.members).toHaveLength(1);
    expect(board.members[0].createdAt).toBe('2024-01-01');
    expect(board.lists).toHaveLength(1);
    expect(board.lists[0].cards).toHaveLength(1);
  });

  it('toDomain handles empty lists and empty members', () => {
    const dto = {
      id: 'b2',
      title: 'Empty Board',
      backgroundColor: 'sky' as const,
      members: [],
      lists: [],
      cards: [],
    };
    const board = BoardMapper.toDomain(dto);
    expect(board.members).toEqual([]);
    expect(board.lists).toEqual([]);
  });
});

describe('BoardHttpRepository', () => {
  let repo: BoardHttpRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // BoardHttpRepository resolves from the BOARD_REPOSITORY token.
        { provide: BOARD_REPOSITORY, useExisting: BoardHttpRepository },
        BoardHttpRepository,
      ],
    });
    const http = TestBed.inject(HttpClient);
    repo = new BoardHttpRepository(http);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('resolves from the BOARD_REPOSITORY token to the HTTP repo', () => {
    // Sanity: same singleton by default (providedIn: 'root').
    expect(TestBed.inject(BOARD_REPOSITORY)).toBeInstanceOf(BoardHttpRepository);
  });

  it('getBoard makes GET request and returns a Board entity', async () => {
    const dto = {
      id: 'b1',
      title: 'Test',
      backgroundColor: 'green' as const,
      members: [],
      lists: [],
      cards: [],
    };
    const promise = repo.getBoard('b1');
    const req = httpMock.expectOne(
      (r) => r.method === 'GET' && r.url.includes('/api/v1/boards/b1'),
    );
    req.flush(dto);
    const board = await promise;
    expect(board.id).toBe('b1');
    expect(board.title).toBe('Test');
    expect(board.backgroundColor).toBe('green');
  });

  it('createBoard makes POST request and returns a Board entity', async () => {
    const dto = {
      id: 'b2',
      title: 'New Board',
      backgroundColor: 'violet' as const,
      members: [],
      lists: [],
      cards: [],
    };
    const promise = repo.createBoard('New Board', 'violet');
    const req = httpMock.expectOne(
      (r) => r.method === 'POST' && r.url.includes('/api/v1/boards'),
    );
    expect(req.request.body).toEqual({ title: 'New Board', backgroundColor: 'violet' });
    req.flush(dto);
    const board = await promise;
    expect(board.id).toBe('b2');
  });
});
