import { describe, it, expect, beforeEach } from 'vitest';
import { TokenService } from '@core/auth/token.service';

// ponytail: no TestBed needed — TokenService has zero Angular DI deps
describe('TokenService', () => {
  const service = new TokenService();

  // Builds a JWT with the given exp claim. Signature is a placeholder;
  // jwt-decode only parses header + payload, so verification is not needed.
  const makeJwt = (payload: Record<string, unknown>): string => {
    const toB64Url = (input: string) =>
      btoa(input)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const header = toB64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = toB64Url(JSON.stringify(payload));
    return `${header}.${body}.sig`;
  };

  const now = Math.floor(Date.now() / 1000);
  const futureExp = now + 3600;
  const pastExp = now - 3600;

  beforeEach(() => {
    service.removeToken();
    service.removeRefreshToken();
  });

  it('isValidRefreshToken returns false when no token is stored', () => {
    expect(service.isValidRefreshToken()).toBe(false);
  });

  it('isValidToken returns false when no token is stored', () => {
    expect(service.isValidToken()).toBe(false);
  });

  it('isValidToken returns true for a token whose exp is in the future', () => {
    service.saveToken(makeJwt({ exp: futureExp }));
    expect(service.isValidToken()).toBe(true);
  });

  it('isValidRefreshToken returns true for a refresh token whose exp is in the future', () => {
    service.saveRefreshToken(makeJwt({ exp: futureExp }));
    expect(service.isValidRefreshToken()).toBe(true);
  });

  it('isValidToken returns false for a token whose exp is in the past', () => {
    service.saveToken(makeJwt({ exp: pastExp }));
    expect(service.isValidToken()).toBe(false);
  });

  it('isValidRefreshToken returns false for a refresh token whose exp is in the past', () => {
    service.saveRefreshToken(makeJwt({ exp: pastExp }));
    expect(service.isValidRefreshToken()).toBe(false);
  });

  it('isValidToken returns false for a token without an exp claim', () => {
    service.saveToken(makeJwt({ sub: 'user-1' }));
    expect(service.isValidToken()).toBe(false);
  });

  it('isValidRefreshToken returns false for a refresh token without an exp claim', () => {
    service.saveRefreshToken(makeJwt({ sub: 'user-1' }));
    expect(service.isValidRefreshToken()).toBe(false);
  });

  it('isValidToken returns false for a malformed token and does not throw', () => {
    service.saveToken('this-is-not-a-jwt');
    expect(() => service.isValidToken()).not.toThrow();
    expect(service.isValidToken()).toBe(false);
  });

  it('isValidRefreshToken returns false for a malformed refresh token and does not throw', () => {
    service.saveRefreshToken('garbage.value.here');
    expect(() => service.isValidRefreshToken()).not.toThrow();
    expect(service.isValidRefreshToken()).toBe(false);
  });

  it('isValidToken returns false for a token with a non-numeric exp', () => {
    service.saveToken(makeJwt({ exp: 'not-a-number' }));
    expect(service.isValidToken()).toBe(false);
  });

  it('removes a malformed token and returns false on subsequent validation', () => {
    service.saveToken('totally-broken');
    expect(service.isValidToken()).toBe(false);
    // The cookie is wiped, so getToken() should report absence.
    expect(service.getToken()).toBeFalsy();
  });
});
