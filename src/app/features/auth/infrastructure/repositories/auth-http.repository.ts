import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { Observable, firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

import { TokenService } from '@core/auth/token.service';
import { checkToken } from '@core/interceptors/token.interceptor';

import { User } from '../../domain/entities/user.entity';
import {
  AuthRepository,
  AuthTokens,
} from '../../domain/repositories/auth.repository';
import { AuthMapper } from '../../application/mappers/auth.mapper';
import {
  ChangePasswordRequestDto,
  IsAvailableRequestDto,
  IsAvailableResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RecoveryRequestDto,
  RegisterRequestDto,
  UserDto,
} from '../../application/dtos/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthHttpRepository implements AuthRepository {
  private readonly apiUrl = environment.API_URL;

  // Single-flight refresh slot. Concurrent callers receive the same
  // promise; once settled, the next call starts a fresh network call.
  private refreshPromise?: Promise<AuthTokens>;

  constructor(
    @Inject(HttpClient) private readonly http: HttpClient,
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  login(email: string, password: string): Promise<AuthTokens> {
    const body: LoginRequestDto = AuthMapper.toLoginRequest(email, password);
    return firstValueFrom(
      this.http
        .post<LoginResponseDto>(`${this.apiUrl}/api/v1/auth/login`, body)
        .pipe(this.persistTokens()),
    );
  }

  register(name: string, email: string, password: string): Promise<void> {
    const body: RegisterRequestDto = AuthMapper.toRegisterRequest(
      name,
      email,
      password,
    );
    return firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/api/v1/auth/register`, body),
    );
  }

  async registerAndLogin(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthTokens> {
    await this.register(name, email, password);
    return this.login(email, password);
  }

  async isAvailable(email: string): Promise<boolean> {
    const body: IsAvailableRequestDto = { email };
    const response = await firstValueFrom(
      this.http.post<IsAvailableResponseDto>(
        `${this.apiUrl}/api/v1/auth/is-available`,
        body,
      ),
    );
    return response.isAvailable;
  }

  recovery(email: string): Promise<void> {
    const body: RecoveryRequestDto = { email };
    return firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/api/v1/auth/recovery`, body),
    );
  }

  changePassword(token: string, newPassword: string): Promise<void> {
    const body: ChangePasswordRequestDto = { token, newPassword };
    return firstValueFrom(
      this.http.post<void>(
        `${this.apiUrl}/api/v1/auth/change-password`,
        body,
      ),
    );
  }

  async getProfile(): Promise<User> {
    const dto = await firstValueFrom(
      this.http
        .get<UserDto>(`${this.apiUrl}/api/v1/auth/profile`, {
          context: checkToken(),
        }),
    );
    return AuthMapper.toUser(dto);
  }

  refreshToken(refreshToken: string): Promise<AuthTokens> {
    const body = AuthMapper.toRefreshRequest(refreshToken);
    return firstValueFrom(
      this.http
        .post<LoginResponseDto>(`${this.apiUrl}/api/v1/auth/refresh-token`, body)
        .pipe(this.persistTokens()),
    );
  }

  // Single-flight refresh. Uses a Promise slot for single-flight
  // refresh — concurrent callers receive the same in-flight promise.
  // After the promise resolves, the slot is cleared so the next refresh
  // starts a fresh network call.
  refreshShare(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken || !this.tokenService.isValidRefreshToken()) {
      return Promise.reject(
        new Error('No valid refresh token available'),
      );
    }
    const body = AuthMapper.toRefreshRequest(refreshToken);
    this.refreshPromise = firstValueFrom(
      this.http
        .post<LoginResponseDto>(`${this.apiUrl}/api/v1/auth/refresh-token`, body)
        .pipe(this.persistTokens()),
    );
    // Always clear the slot once the in-flight request settles.
    this.refreshPromise.finally(() => {
      this.refreshPromise = undefined;
    });
    return this.refreshPromise;
  }

  logout(): void {
    this.tokenService.removeToken();
    this.tokenService.removeRefreshToken();
    this.refreshPromise = undefined;
  }

  // Operator that maps the wire DTO to AuthTokens and persists them
  // as a side effect. Kept private to avoid re-allocating per call.
  private persistTokens() {
    return (source: Observable<LoginResponseDto>) =>
      new Observable<AuthTokens>((subscriber) => {
        return source.subscribe({
          next: (dto) => {
            const tokens = AuthMapper.toTokens(dto);
            this.persistTokensToCookie(tokens);
            subscriber.next(tokens);
          },
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
  }

  private persistTokensToCookie(tokens: AuthTokens): void {
    this.tokenService.saveToken(tokens.accessToken);
    this.tokenService.saveRefreshToken(tokens.refreshToken);
  }
}
