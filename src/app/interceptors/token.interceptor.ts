import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpContextToken,
  HttpContext
} from '@angular/common/http';

import { Observable, switchMap } from 'rxjs';

import { TokenService } from '@services/token.service';
import { AuthService } from '@services/auth.service';

const CHECK_TOKEN = new HttpContextToken<boolean>(() => false);

export function checkToken() {
  return new HttpContext().set(CHECK_TOKEN, true);
}

export const tokenInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  if (request.context.get(CHECK_TOKEN)) {
    const isValidToken = tokenService.isValidToken();
    if (isValidToken) {
      return addToken(request, next, tokenService);
    } else {
      return updateAccessTokenAndRefreshToken(request, next, tokenService, authService);
    }
  }
  return next(request);
};

function addToken(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService
): Observable<HttpEvent<unknown>> {
  const accessToken = tokenService.getToken();
  if (accessToken) {
    const authRequest = request.clone({
      headers: request.headers.set('Authorization', `Bearer ${accessToken}`)
    });
    return next(authRequest);
  }
  return next(request);
}

function updateAccessTokenAndRefreshToken(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
  authService: AuthService
): Observable<HttpEvent<unknown>> {
  const refreshToken = tokenService.getRefreshToken();
  const isValidRefreshToken = tokenService.isValidRefreshToken();
  if (refreshToken && isValidRefreshToken) {
    return authService.refreshToken(refreshToken).pipe(
      switchMap(() => addToken(request, next, tokenService))
    );
  }
  return next(request);
}
