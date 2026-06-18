import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';

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

describe('AuthService', () => {
  let authService: AuthService;
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // No token interceptor here: the auth service spec exercises
        // the service contract in isolation. The interceptor spec
        // covers the end-to-end flow.
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    authService = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    tokenService.removeToken();
    tokenService.removeRefreshToken();
  });

  it('login() persists the access and refresh tokens returned by the API', async () => {
    const access = makeJwt({ exp: 9999999999 });
    const refresh = makeJwt({ exp: 9999999999 });

    const sub = authService.login('a@b.com', 'pw').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/login') && r.method === 'POST',
    );
    req.flush({ access_token: access, refresh_token: refresh });
    sub.unsubscribe();

    expect(tokenService.getToken()).toBe(access);
    expect(tokenService.getRefreshToken()).toBe(refresh);
  });

  it('refreshToken() persists the rotated tokens returned by the API', () => {
    const access = makeJwt({ exp: 9999999999 });
    const refresh = makeJwt({ exp: 9999999999 });

    authService.refreshToken('old-refresh').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/refresh-token') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
    req.flush({ access_token: access, refresh_token: refresh });

    expect(tokenService.getToken()).toBe(access);
    expect(tokenService.getRefreshToken()).toBe(refresh);
  });

  it('logout() clears both cookies and the user signal', () => {
    tokenService.saveToken('x');
    tokenService.saveRefreshToken('y');
    authService.logout();
    expect(tokenService.getToken()).toBeFalsy();
    expect(tokenService.getRefreshToken()).toBeFalsy();
    expect(authService.getDataUser()).toBeNull();
  });

  it('refreshShare returns the same Observable for concurrent subscribers', () => {
    // Set a valid refresh token so refreshShare can build its slot.
    const refresh = makeJwt({ exp: 9999999999 });
    tokenService.saveRefreshToken(refresh);

    // refreshShare() is the building block the interceptor uses for
    // single-flight refresh; the interceptor spec exercises the
    // end-to-end behavior. Here we just check the contract.
    const a = authService.refreshShare();
    const b = authService.refreshShare();
    // Same identity, so subscribers see the same multicast.
    expect(a).toBe(b);
  });

  it('refreshShare throws when no valid refresh token is stored', () => {
    expect(() => authService.refreshShare()).toThrow();
  });
});
