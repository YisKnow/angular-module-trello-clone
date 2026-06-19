import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { TokenService } from '@core/auth/token.service';

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

describe('authGuard', () => {
  let tokenService: TokenService;
  let router: Router;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    tokenService.removeToken();
    tokenService.removeRefreshToken();
  });

  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    ) as boolean | UrlTree;

  it('permits activation when the refresh token is valid', () => {
    tokenService.saveRefreshToken(makeJwt({ exp: now + 3600 }));
    expect(run()).toBe(true);
  });

  it('returns the login UrlTree when no refresh token is stored', () => {
    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('returns the login UrlTree when the refresh token is expired', () => {
    tokenService.saveRefreshToken(makeJwt({ exp: now - 3600 }));
    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('returns the login UrlTree for a malformed refresh token', () => {
    tokenService.saveRefreshToken('garbage.value.here');
    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
