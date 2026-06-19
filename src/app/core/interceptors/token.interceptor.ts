import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpContextToken,
  HttpContext,
  HttpErrorResponse,
} from '@angular/common/http';

import { Observable, catchError, from, switchMap, throwError } from 'rxjs';

import { TokenService } from '@core/auth/token.service';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';

const CHECK_TOKEN = new HttpContextToken<boolean>(() => false);

export function checkToken() {
  return new HttpContext().set(CHECK_TOKEN, true);
}

export const tokenInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const authFacade = inject(AuthFacade);

  if (!request.context.get(CHECK_TOKEN)) {
    return next(request);
  }

  if (tokenService.isValidToken()) {
    return addToken(request, next, tokenService);
  }

  return refreshAndRetry(request, next, tokenService, authFacade);
};

function addToken(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
): Observable<HttpEvent<unknown>> {
  const accessToken = tokenService.getToken();
  if (!accessToken) {
    // No credential to attach — fail closed rather than forwarding an
    // unauthenticated request to a protected endpoint.
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          error: { message: 'Missing access token' },
        }),
    );
  }
  const authRequest = request.clone({
    headers: request.headers.set('Authorization', `Bearer ${accessToken}`),
  });
  return next(authRequest).pipe(
    catchError((err) => {
      // Server rejected a token the client thought was valid
      // (revocation, clock skew, server-side expiry). Clear credentials
      // so the rest of the app treats the user as logged out, and
      // propagate the error so the caller can react.
      if (err instanceof HttpErrorResponse && err.status === 401) {
        tokenService.removeToken();
      }
      return throwError(() => err);
    }),
  );
}

function refreshAndRetry(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
  authFacade: AuthFacade,
): Observable<HttpEvent<unknown>> {
  if (
    !tokenService.getRefreshToken() ||
    !tokenService.isValidRefreshToken()
  ) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          error: { message: 'No valid refresh token' },
        }),
    );
  }

  return from(authFacade.refreshShare()).pipe(
    switchMap(() => addToken(request, next, tokenService)),
    catchError((err) => {
      // Refresh itself failed: clear credentials so the rest of the
      // app treats the user as logged out, and propagate the error.
      tokenService.removeToken();
      tokenService.removeRefreshToken();
      return throwError(() => err);
    }),
  );
}
