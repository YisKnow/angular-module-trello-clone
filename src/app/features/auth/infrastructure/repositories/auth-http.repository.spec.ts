import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { tokenInterceptor, checkToken } from '@core/interceptors/token.interceptor';
import { TokenService } from '@core/auth/token.service';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { AuthHttpRepository } from '@features/auth/infrastructure/repositories/auth-http.repository';
import { AUTH_REPOSITORY } from '@features/auth/domain/repositories/auth.repository';
import { provideAuth } from '@features/auth/auth.providers';

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

describe('AuthHttpRepository + AuthFacade', () => {
  let facade: AuthFacade;
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
        provideAuth(),
      ],
    });
    facade = TestBed.inject(AuthFacade);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    // The provider above also registered AuthHttpRepository as
    // providedIn: 'root' — verify the token resolves to the same class.
    const repo = TestBed.inject(AUTH_REPOSITORY);
    expect(repo).toBeInstanceOf(AuthHttpRepository);
    tokenService.removeToken();
    tokenService.removeRefreshToken();
  });

  // -----------------------------------------------------------------------
  // login
  // -----------------------------------------------------------------------

  it('login() persists the access and refresh tokens returned by the API', async () => {
    const access = makeJwt({ exp: 9999999999 });
    const refresh = makeJwt({ exp: 9999999999 });

    const promise = facade.login('a@b.com', 'pw');
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/login') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'pw' });
    req.flush({ access_token: access, refresh_token: refresh });

    const result = await promise;
    expect(result.accessToken).toBe(access);
    expect(result.refreshToken).toBe(refresh);
    expect(tokenService.getToken()).toBe(access);
    expect(tokenService.getRefreshToken()).toBe(refresh);
  });

  // -----------------------------------------------------------------------
  // refreshToken
  // -----------------------------------------------------------------------

  it('refreshToken() persists the rotated tokens returned by the API', async () => {
    const access = makeJwt({ exp: 9999999999 });
    const refresh = makeJwt({ exp: 9999999999 });

    const promise = facade.refreshToken('old-refresh');
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/refresh-token') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
    req.flush({ access_token: access, refresh_token: refresh });

    const result = await promise;
    expect(result.accessToken).toBe(access);
    expect(result.refreshToken).toBe(refresh);
    expect(tokenService.getToken()).toBe(access);
    expect(tokenService.getRefreshToken()).toBe(refresh);
  });

  // -----------------------------------------------------------------------
  // register
  // -----------------------------------------------------------------------

  it('register() makes POST request with name, email, password', async () => {
    const promise = facade.register('Alice', 'a@b.com', 'secret');
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/register') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ name: 'Alice', email: 'a@b.com', password: 'secret' });
    req.flush({});
    await promise;
  });

  // -----------------------------------------------------------------------
  // registerAndLogin
  // -----------------------------------------------------------------------

  it('registerAndLogin() chains register then login and persists tokens', async () => {
    const access = makeJwt({ exp: 9999999999 });
    const refresh = makeJwt({ exp: 9999999999 });

    const promise = facade.registerAndLogin('Alice', 'a@b.com', 'secret');

    const registerReq = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/register') && r.method === 'POST',
    );
    expect(registerReq.request.body).toEqual({ name: 'Alice', email: 'a@b.com', password: 'secret' });
    registerReq.flush({});

    // Let the await chain advance to the login call.
    await Promise.resolve();
    await Promise.resolve();

    const loginReq = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/login') && r.method === 'POST',
    );
    expect(loginReq.request.body).toEqual({ email: 'a@b.com', password: 'secret' });
    loginReq.flush({ access_token: access, refresh_token: refresh });

    const result = await promise;
    expect(result.accessToken).toBe(access);
    expect(tokenService.getToken()).toBe(access);
  });

  // -----------------------------------------------------------------------
  // isAvailable
  // -----------------------------------------------------------------------

  it('isAvailable() returns the boolean availability from the API', async () => {
    const promise = facade.isAvailable('a@b.com');
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/is-available') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ email: 'a@b.com' });
    req.flush({ isAvailable: true });

    expect(await promise).toBe(true);
  });

  // -----------------------------------------------------------------------
  // recovery
  // -----------------------------------------------------------------------

  it('recovery() sends email to the API', async () => {
    const promise = facade.recovery('a@b.com');
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/recovery') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ email: 'a@b.com' });
    req.flush({});
    await promise;
  });

  // -----------------------------------------------------------------------
  // changePassword
  // -----------------------------------------------------------------------

  it('changePassword() sends token and new password', async () => {
    const promise = facade.changePassword('tok123', 'new-pass');
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/change-password') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ token: 'tok123', newPassword: 'new-pass' });
    req.flush({});
    await promise;
  });

  // -----------------------------------------------------------------------
  // getProfile
  // -----------------------------------------------------------------------

  it('getProfile() fetches user, updates the user signal, and renames creationAt→createdAt', async () => {
    // The token interceptor requires a valid access token when the
    // request uses the `checkToken()` context. Seed the cookie first.
    const future = Math.floor(Date.now() / 1000) + 3600;
    const headerB64 = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify({ sub: '1', exp: future }))
      .replace(/=/g, '');
    const validJwt = `${headerB64}.${payloadB64}.sig`;
    tokenService.saveToken(validJwt);
    tokenService.saveRefreshToken(validJwt);

    const promise = facade.getProfile();
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/profile') && r.method === 'GET',
    );
    expect(req.request.headers.get('Authorization')).toBe(
      `Bearer ${validJwt}`,
    );
    req.flush({
      id: 1, name: 'Alice', email: 'a@b.com', avatar: '',
      creationAt: '2024-01-01', updatedAt: '2024-01-02',
    });

    const user = await promise;
    expect(user.id).toBe(1);
    expect(user.createdAt).toBe('2024-01-01');
    expect(user.updatedAt).toBe('2024-01-02');
    expect(facade.user()).toEqual(user);
    expect(facade.getDataUser()).toEqual(user);
  });

  // -----------------------------------------------------------------------
  // logout
  // -----------------------------------------------------------------------

  it('logout() clears both cookies and the user signal', () => {
    tokenService.saveToken('x');
    tokenService.saveRefreshToken('y');
    facade.logout();
    expect(tokenService.getToken()).toBeFalsy();
    expect(tokenService.getRefreshToken()).toBeFalsy();
    expect(facade.getDataUser()).toBeNull();
  });

  // -----------------------------------------------------------------------
  // refreshShare
  // -----------------------------------------------------------------------

  it('refreshShare returns the same Promise for concurrent callers', () => {
    const refresh = makeJwt({ exp: 9999999999 });
    tokenService.saveRefreshToken(refresh);

    // Kick off the first refresh, but don't await it yet — we just need
    // the cached promise slot.
    const p1 = facade.refreshShare();
    const p2 = facade.refreshShare();
    expect(p1).toBe(p2);
  });

  it('refreshShare rejects when no valid refresh token is stored', async () => {
    await expect(facade.refreshShare()).rejects.toThrow();
  });
});
