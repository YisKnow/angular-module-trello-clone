import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CardHttpRepository } from '@features/boards/infrastructure/repositories/card-http.repository';
import { ListHttpRepository } from '@features/boards/infrastructure/repositories/list-http.repository';

describe('CardHttpRepository', () => {
  let repo: CardHttpRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    repo = new CardHttpRepository(http);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create makes POST request with the right body', async () => {
    const dto = {
      title: 'New Card',
      position: 65535,
      listId: 'l1',
      boardId: 'b1',
    };
    const promise = repo.create(dto);
    const req = httpMock.expectOne(
      (r) => r.method === 'POST' && r.url.includes('/api/v1/cards'),
    );
    expect(req.request.body).toEqual(dto);
    req.flush({
      id: 'c1',
      title: 'New Card',
      position: 65535,
      list: { id: 'l1', title: 'L', position: 1, cards: [] },
    });
    const card = await promise;
    expect(card.id).toBe('c1');
  });

  it('update makes PUT request with the change payload', async () => {
    const promise = repo.update('c1', { title: 'Updated' });
    const req = httpMock.expectOne(
      (r) => r.method === 'PUT' && r.url.includes('/api/v1/cards/c1'),
    );
    expect(req.request.body).toEqual({ title: 'Updated' });
    req.flush({
      id: 'c1',
      title: 'Updated',
      position: 100,
      list: { id: 'l1', title: 'L', position: 1, cards: [] },
    });
    const card = await promise;
    expect(card.title).toBe('Updated');
  });
});

describe('ListHttpRepository', () => {
  let repo: ListHttpRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    repo = new ListHttpRepository(http);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create makes POST request with the right body', async () => {
    const dto = { title: 'New List', position: 65535, boardId: 'b1' };
    const promise = repo.create(dto);
    const req = httpMock.expectOne(
      (r) => r.method === 'POST' && r.url.includes('/api/v1/lists'),
    );
    expect(req.request.body).toEqual(dto);
    req.flush({ id: 'l1', title: 'New List', position: 65535, cards: [] });
    const list = await promise;
    expect(list.id).toBe('l1');
  });
});
