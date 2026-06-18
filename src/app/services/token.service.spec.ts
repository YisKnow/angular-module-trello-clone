import { describe, it, expect } from 'vitest';
import { TokenService } from './token.service';

// ponytail: no TestBed needed — TokenService has zero Angular DI deps
describe('TokenService', () => {
  const service = new TokenService();

  it('isValidRefreshToken returns false when no token is stored', () => {
    expect(service.isValidRefreshToken()).toBe(false);
  });

  it('isValidToken returns false when no token is stored', () => {
    expect(service.isValidToken()).toBe(false);
  });
});
