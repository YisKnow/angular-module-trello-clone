import { Inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, finalize, shareReplay, switchMap, tap } from 'rxjs';

import { environment } from '@environments/environment';

import { checkToken } from '@interceptors/token.interceptor';
import { ResponseLogin } from '@models/auth.model';
import { User } from '@models/user.model';

import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiUrl = environment.API_URL;
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();

  // Slot for the current in-flight refresh. Cleared by finalize() so
  // the next refresh starts a fresh network call.
  private refresh$?: Observable<ResponseLogin>;

  constructor(
    @Inject(HttpClient) private readonly http: HttpClient,
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  getDataUser() {
    return this._user();
  }

  login(email: string, password: string) {
    return this.http
      .post<ResponseLogin>(`${this.apiUrl}/api/v1/auth/login`, { email, password })
      .pipe(tap((response) => this.persistTokens(response)));
  }

  // Public, low-level refresh used by tests and any caller that wants
  // to trigger a refresh without involving the shared slot.
  refreshToken(refreshToken: string) {
    return this.http
      .post<ResponseLogin>(`${this.apiUrl}/api/v1/auth/refresh-token`, {
        refreshToken,
      })
      .pipe(tap((response) => this.persistTokens(response)));
  }

  // Single-flight refresh. Concurrent callers receive the same
  // observable; shareReplay replays the result to late subscribers
  // and refCount: false keeps the source alive until completion so
  // the network call is never duplicated. finalize clears the slot
  // so the next refresh starts a new call.
  refreshShare(): Observable<ResponseLogin> {
    if (this.refresh$) {
      return this.refresh$;
    }
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken || !this.tokenService.isValidRefreshToken()) {
      throw new Error('No valid refresh token available');
    }
    this.refresh$ = this.http
      .post<ResponseLogin>(`${this.apiUrl}/api/v1/auth/refresh-token`, {
        refreshToken,
      })
      .pipe(
        tap((response) => this.persistTokens(response)),
        shareReplay({ bufferSize: 1, refCount: false }),
        finalize(() => {
          this.refresh$ = undefined;
        }),
      );
    return this.refresh$;
  }

  private persistTokens(response: ResponseLogin) {
    this.tokenService.saveToken(response.access_token);
    this.tokenService.saveRefreshToken(response.refresh_token);
  }

  register(name: string, email: string, password: string) {
    return this.http.post(`${this.apiUrl}/api/v1/auth/register`, {
      name,
      email,
      password,
    });
  }

  registerAndLogin(name: string, email: string, password: string) {
    return this.register(name, email, password).pipe(
      switchMap(() => this.login(email, password)),
    );
  }

  isAvailable(email: string) {
    return this.http.post<{ isAvailable: boolean }>(
      `${this.apiUrl}/api/v1/auth/is-available`,
      { email },
    );
  }

  recovery(email: string) {
    return this.http.post(`${this.apiUrl}/api/v1/auth/recovery`, { email });
  }

  changePassword(token: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/api/v1/auth/change-password`, {
      token,
      newPassword,
    });
  }

  getProfile() {
    return this.http
      .get<User>(`${this.apiUrl}/api/v1/auth/profile`, { context: checkToken() })
      .pipe(tap((user) => this._user.set(user)));
  }

  logout() {
    this.tokenService.removeToken();
    this.tokenService.removeRefreshToken();
    this._user.set(null);
    this.refresh$ = undefined;
  }
}
