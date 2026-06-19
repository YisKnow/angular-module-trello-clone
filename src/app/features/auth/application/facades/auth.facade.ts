import { Injectable, Signal, inject, signal } from '@angular/core';

import { TokenService } from '@core/auth/token.service';

import { User } from '../../domain/entities/user.entity';
import { AuthTokens, AUTH_REPOSITORY } from '../../domain/repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly _user = signal<User | null>(null);
  readonly user: Signal<User | null> = this._user.asReadonly();

  private readonly authRepository = inject(AUTH_REPOSITORY);
  private refreshPromise?: Promise<AuthTokens>;

  constructor(
    private readonly tokenService: TokenService = inject(TokenService),
  ) {}

  login(email: string, password: string): Promise<AuthTokens> {
    return this.authRepository.login(email, password);
  }

  register(name: string, email: string, password: string): Promise<void> {
    return this.authRepository.register(name, email, password);
  }

  registerAndLogin(name: string, email: string, password: string): Promise<AuthTokens> {
    return this.authRepository.registerAndLogin(name, email, password);
  }

  isAvailable(email: string): Promise<boolean> {
    return this.authRepository.isAvailable(email);
  }

  recovery(email: string): Promise<void> {
    return this.authRepository.recovery(email);
  }

  changePassword(token: string, newPassword: string): Promise<void> {
    return this.authRepository.changePassword(token, newPassword);
  }

  getProfile(): Promise<User> {
    return this.authRepository.getProfile().then((user) => {
      this._user.set(user);
      return user;
    });
  }

  refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.authRepository.refreshToken(refreshToken);
  }

  refreshShare(): Promise<AuthTokens> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.authRepository.refreshShare();
    this.refreshPromise
      .finally(() => { this.refreshPromise = undefined; })
      .catch(() => { /* cleanup chain — callers handle the real rejection */ });
    return this.refreshPromise;
  }

  logout(): void {
    this.authRepository.logout();
    this._user.set(null);
    this.refreshPromise = undefined;
  }
}
