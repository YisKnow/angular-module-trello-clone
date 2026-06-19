import { Injectable } from '@angular/core';

// ponytail: no typescript-cookie, no jwt-decode — using document.cookie
// and atob() directly. Both are available in every modern browser and
// jsdom. jwt-decode only runs atob() under the hood; typescript-cookie
// only wraps document.cookie. Two fewer deps, zero loss in functionality.

const ACCESS_COOKIE = 'token-trello';
const REFRESH_COOKIE = 'refresh-token-trello';

@Injectable({ providedIn: 'root' })
export class TokenService {

  saveToken(token: string) { setCookie(ACCESS_COOKIE, token); }
  getToken() { return getCookie(ACCESS_COOKIE); }
  removeToken() { removeCookie(ACCESS_COOKIE); }

  saveRefreshToken(token: string) { setCookie(REFRESH_COOKIE, token); }
  getRefreshToken() { return getCookie(REFRESH_COOKIE); }
  removeRefreshToken() { removeCookie(REFRESH_COOKIE); }

  isValidToken(): boolean {
    return isValidJwt(this.getToken(), ACCESS_COOKIE);
  }

  isValidRefreshToken(): boolean {
    return isValidJwt(this.getRefreshToken(), REFRESH_COOKIE);
  }
}

// -- native cookie helpers --

function getCookie(name: string): string | null {
  const match = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${365 * 86400}`;
}

function removeCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

// -- native JWT validation --

function isValidJwt(token: string | null | undefined, cookieName: string): boolean {
  if (!token) return false;
  let payload: { exp?: unknown };
  try {
    const body = token.split('.')[1];
    if (!body) { removeCookie(cookieName); return false; }
    payload = JSON.parse(atob(body));
  } catch {
    removeCookie(cookieName);
    return false;
  }
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    removeCookie(cookieName);
    return false;
  }
  return payload.exp > Date.now() / 1000;
}
