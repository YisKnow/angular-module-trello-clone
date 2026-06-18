import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CardsService } from './cards.service';

describe('CardsService', () => {
  let service: CardsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    service = new CardsService(http);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create makes POST request', () => {
    const dto = {
      title: 'New Card',
      position: 65535,
      listId: 'l1',
      boardId: 'b1',
    };

    service.create(dto).subscribe((card) => {
      expect(card.title).toBe('New Card');
    });

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
  });

  it('update makes PUT request', () => {
    const change = { title: 'Updated' };

    service.update('c1', change).subscribe((card) => {
      expect(card.title).toBe('Updated');
    });

    const req = httpMock.expectOne(
      (r) => r.method === 'PUT' && r.url.includes('/api/v1/cards/c1'),
    );
    expect(req.request.body).toEqual(change);
    req.flush({
      id: 'c1',
      title: 'Updated',
      position: 100,
      list: { id: 'l1', title: 'L', position: 1, cards: [] },
    });
  });
});
