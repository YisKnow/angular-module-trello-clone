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
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
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

  // -----------------------------------------------------------------------
  // login
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // refreshToken
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // register
  // -----------------------------------------------------------------------

  it('register() makes POST request with name, email, password', () => {
    authService.register('Alice', 'a@b.com', 'secret').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/register') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ name: 'Alice', email: 'a@b.com', password: 'secret' });
    req.flush({});
  });

  // -----------------------------------------------------------------------
  // registerAndLogin
  // -----------------------------------------------------------------------

  it('registerAndLogin() chains register then login', () => {
    const access = makeJwt({ exp: 9999999999 });
    const refresh = makeJwt({ exp: 9999999999 });

    const sub = authService.registerAndLogin('Alice', 'a@b.com', 'secret').subscribe();

    // First: register POST
    const registerReq = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/register') && r.method === 'POST',
    );
    expect(registerReq.request.body).toEqual({ name: 'Alice', email: 'a@b.com', password: 'secret' });
    registerReq.flush({});

    // Then: login POST (switchMap)
    const loginReq = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/login') && r.method === 'POST',
    );
    expect(loginReq.request.body).toEqual({ email: 'a@b.com', password: 'secret' });
    loginReq.flush({ access_token: access, refresh_token: refresh });
    sub.unsubscribe();

    expect(tokenService.getToken()).toBe(access);
  });

  // -----------------------------------------------------------------------
  // isAvailable
  // -----------------------------------------------------------------------

  it('isAvailable() returns availability from the API', () => {
    let result: boolean | undefined;
    authService.isAvailable('a@b.com').subscribe((r) => (result = r.isAvailable));

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/is-available') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ email: 'a@b.com' });
    req.flush({ isAvailable: true });

    expect(result).toBe(true);
  });

  // -----------------------------------------------------------------------
  // recovery
  // -----------------------------------------------------------------------

  it('recovery() sends email to the API', () => {
    authService.recovery('a@b.com').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/recovery') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ email: 'a@b.com' });
    req.flush({});
  });

  // -----------------------------------------------------------------------
  // changePassword
  // -----------------------------------------------------------------------

  it('changePassword() sends token and new password', () => {
    authService.changePassword('tok123', 'new-pass').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/change-password') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ token: 'tok123', newPassword: 'new-pass' });
    req.flush({});
  });

  // -----------------------------------------------------------------------
  // getProfile
  // -----------------------------------------------------------------------

  it('getProfile() fetches user and updates the user signal', () => {
    const user = {
      id: 1, name: 'Alice', email: 'a@b.com', avatar: '', creationAt: '', updatedAt: '',
    };
    let emitted: typeof user | undefined;
    authService.getProfile().subscribe((u) => (emitted = u));

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/v1/auth/profile') && r.method === 'GET',
    );
    req.flush(user);

    expect(emitted).toEqual(user);
    expect(authService.user()).toEqual(user);
    expect(authService.getDataUser()).toEqual(user);
  });

  // -----------------------------------------------------------------------
  // logout
  // -----------------------------------------------------------------------

  it('logout() clears both cookies and the user signal', () => {
    tokenService.saveToken('x');
    tokenService.saveRefreshToken('y');
    authService.logout();
    expect(tokenService.getToken()).toBeFalsy();
    expect(tokenService.getRefreshToken()).toBeFalsy();
    expect(authService.getDataUser()).toBeNull();
  });

  // -----------------------------------------------------------------------
  // getDataUser
  // -----------------------------------------------------------------------

  it('getDataUser() returns the current user signal value', () => {
    expect(authService.getDataUser()).toBeNull();
    // After login + getProfile it should be set (tested in getProfile test)
  });

  // -----------------------------------------------------------------------
  // refreshShare
  // -----------------------------------------------------------------------

  it('refreshShare returns the same Observable for concurrent subscribers', () => {
    const refresh = makeJwt({ exp: 9999999999 });
    tokenService.saveRefreshToken(refresh);

    const a = authService.refreshShare();
    const b = authService.refreshShare();
    expect(a).toBe(b);
  });

  it('refreshShare throws when no valid refresh token is stored', () => {
    expect(() => authService.refreshShare()).toThrow();
  });
});
