import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { TokenService } from './token.service';

describe('TokenService (smoke)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('can be injected via TestBed', () => {
    const service = TestBed.inject(TokenService);
    expect(service).toBeInstanceOf(TokenService);
  });

  it('isValidRefreshToken returns false when no token is stored', () => {
    const service = TestBed.inject(TokenService);
    expect(service.isValidRefreshToken()).toBe(false);
  });
});
