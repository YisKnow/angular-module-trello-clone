import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { tokenInterceptor, checkToken } from './token.interceptor';
import { TokenService } from '@services/token.service';
import { AuthService } from '@services/auth.service';

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

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    authService = TestBed.inject(AuthService);
    tokenService.removeToken();
    tokenService.removeRefreshToken();
  });

  it('passes a request through unchanged when no checkToken context is set', () => {
    firstValueFrom(http.get('/api/v1/ping'));
    const req = httpMock.expectOne('/api/v1/ping');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });
  });

  it('adds a single Authorization header for a protected request with a valid access token', async () => {
    tokenService.saveToken(makeJwt({ exp: now + 3600 }));

    firstValueFrom(
      http.get('/api/v1/auth/profile', { context: checkToken() }),
    );
    const req = httpMock.expectOne('/api/v1/auth/profile');
    expect(req.request.headers.get('Authorization')).toBe(
      `Bearer ${tokenService.getToken()}`,
    );
    // No refresh should have been issued
    httpMock.expectNone('/api/v1/auth/refresh-token');
    req.flush({ id: 1 });
  });

  it('shares a single refresh across two concurrent protected requests with an expired access token', async () => {
    tokenService.saveToken(makeJwt({ exp: now - 60 }));
    tokenService.saveRefreshToken(makeJwt({ exp: now + 3600 }));

    const p1 = firstValueFrom(
      http.get('/api/v1/a', { context: checkToken() }),
    );
    const p2 = firstValueFrom(
      http.get('/api/v1/b', { context: checkToken() }),
    );

    // First protected request triggers a refresh; second piggybacks.
    const refresh = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/refresh-token') && r.method === 'POST',
    );
    expect(refresh.request.body).toEqual({
      refreshToken: tokenService.getRefreshToken(),
    });
    refresh.flush({
      access_token: makeJwt({ exp: now + 7200 }),
      refresh_token: makeJwt({ exp: now + 7200 }),
    });

    const a = httpMock.expectOne('/api/v1/a');
    const b = httpMock.expectOne('/api/v1/b');
    expect(a.request.headers.get('Authorization')).toMatch(/^Bearer /);
    expect(b.request.headers.get('Authorization')).toMatch(/^Bearer /);
    a.flush({ ok: 'a' });
    b.flush({ ok: 'b' });

    await Promise.all([p1, p2]);
  });

  it('clears credentials and errors both requests when the refresh call fails', async () => {
    tokenService.saveToken(makeJwt({ exp: now - 60 }));
    tokenService.saveRefreshToken(makeJwt({ exp: now + 3600 }));

    const p1 = firstValueFrom(
      http.get('/api/v1/a', { context: checkToken() }),
    );
    const p2 = firstValueFrom(
      http.get('/api/v1/b', { context: checkToken() }),
    );

    const refresh = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/refresh-token') && r.method === 'POST',
    );
    refresh.flush(
      { message: 'nope' },
      { status: 401, statusText: 'Unauthorized' },
    );

    // No protected request should have been retried without a credential.
    httpMock.expectNone('/api/v1/a');
    httpMock.expectNone('/api/v1/b');

    await expect(p1).rejects.toBeDefined();
    await expect(p2).rejects.toBeDefined();

    expect(tokenService.getToken()).toBeFalsy();
    expect(tokenService.getRefreshToken()).toBeFalsy();
  });

  it('does not forward a protected request when the refresh token is missing or invalid', async () => {
    tokenService.saveToken(makeJwt({ exp: now - 60 }));
    // No refresh token saved at all
    const p1 = firstValueFrom(
      http.get('/api/v1/a', { context: checkToken() }),
    );
    // The interceptor fails closed: the protected request must NOT
    // reach the backend at all, and the caller must see a 401.
    httpMock.expectNone(
      (r) => r.url.endsWith('/api/v1/a') && r.method === 'GET',
    );
    await expect(p1).rejects.toBeDefined();
    await expect(p1).rejects.toMatchObject({ status: 401 });
  });
});
