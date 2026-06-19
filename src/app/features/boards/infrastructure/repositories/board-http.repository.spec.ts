import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BoardHttpRepository } from '@features/boards/infrastructure/repositories/board-http.repository';
import { BOARD_REPOSITORY } from '@boards/application/tokens/board-tokens';

describe('BoardHttpRepository', () => {
  let repo: BoardHttpRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BoardHttpRepository,
        { provide: BOARD_REPOSITORY, useExisting: BoardHttpRepository },
      ],
    });
    const http = TestBed.inject(HttpClient);
    repo = TestBed.inject(BoardHttpRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('resolves from the BOARD_REPOSITORY token to the HTTP repo', () => {
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
    const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/api/v1/boards'));
    expect(req.request.body).toEqual({ title: 'New Board', backgroundColor: 'violet' });
    req.flush(dto);
    const board = await promise;
    expect(board.id).toBe('b2');
  });
});
