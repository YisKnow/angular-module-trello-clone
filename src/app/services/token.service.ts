import { Injectable } from '@angular/core';

import { getCookie, setCookie, removeCookie } from 'typescript-cookie';
import { jwtDecode, JwtPayload } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private static readonly ACCESS_COOKIE = 'token-trello';
  private static readonly REFRESH_COOKIE = 'refresh-token-trello';

  saveToken(token: string) {
    setCookie(TokenService.ACCESS_COOKIE, token, { expires: 365, path: '/' });
  }

  getToken() {
    return getCookie(TokenService.ACCESS_COOKIE);
  }

  removeToken() {
    removeCookie(TokenService.ACCESS_COOKIE);
  }

  saveRefreshToken(token: string) {
    setCookie(TokenService.REFRESH_COOKIE, token, { expires: 365, path: '/' });
  }

  getRefreshToken() {
    return getCookie(TokenService.REFRESH_COOKIE);
  }

  removeRefreshToken() {
    removeCookie(TokenService.REFRESH_COOKIE);
  }

  isValidToken() {
    return this.isValidJwt(this.getToken(), TokenService.ACCESS_COOKIE);
  }

  isValidRefreshToken() {
    return this.isValidJwt(
      this.getRefreshToken(),
      TokenService.REFRESH_COOKIE,
    );
  }

  // Centralized JWT validation. Returns false for any malformed or
  // expired token instead of throwing, and clears the offending cookie
  // so a corrupt value cannot keep breaking navigation.
  private isValidJwt(
    token: string | null | undefined,
    cookieName: string,
  ): boolean {
    if (!token) return false;

    let payload: JwtPayload;
    try {
      payload = jwtDecode<JwtPayload>(token);
    } catch {
      this.removeCookie(cookieName);
      return false;
    }

    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      this.removeCookie(cookieName);
      return false;
    }

    // exp is in epoch seconds; compare against current epoch seconds.
    return payload.exp > Date.now() / 1000;
  }

  private removeCookie(name: string) {
    removeCookie(name, { path: '/' });
  }
}
