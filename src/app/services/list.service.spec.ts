import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ListService } from './list.service';

describe('ListService', () => {
  let service: ListService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    service = new ListService(http);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create makes POST request', () => {
    const dto = { title: 'New List', position: 65535, boardId: 'b1' };

    service.create(dto).subscribe((list) => {
      expect(list.title).toBe('New List');
    });

    const req = httpMock.expectOne(
      (r) => r.method === 'POST' && r.url.includes('/api/v1/lists'),
    );
    expect(req.request.body).toEqual(dto);
    req.flush({ id: 'l1', title: 'New List', position: 65535, cards: [] });
  });
});
