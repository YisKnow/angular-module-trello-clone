import { Injectable, Signal, inject, signal } from '@angular/core';

import { TokenService } from '@core/auth/token.service';

import { User } from '../../domain/entities/user.entity';
import { AuthTokens, AUTH_REPOSITORY, AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly _user = signal<User | null>(null);
  readonly user: Signal<User | null> = this._user.asReadonly();

  private readonly authRepository = inject(AUTH_REPOSITORY, { optional: true });
  private refreshPromise?: Promise<AuthTokens>;

  constructor(
    private readonly tokenService: TokenService = inject(TokenService),
  ) {}

  login(email: string, password: string): Promise<AuthTokens> {
    return this.authRepos().login(email, password);
  }

  register(name: string, email: string, password: string): Promise<void> {
    return this.authRepos().register(name, email, password);
  }

  registerAndLogin(name: string, email: string, password: string): Promise<AuthTokens> {
    return this.authRepos().registerAndLogin(name, email, password);
  }

  isAvailable(email: string): Promise<boolean> {
    return this.authRepos().isAvailable(email);
  }

  recovery(email: string): Promise<void> {
    return this.authRepos().recovery(email);
  }

  changePassword(token: string, newPassword: string): Promise<void> {
    return this.authRepos().changePassword(token, newPassword);
  }

  getProfile(): Promise<User> {
    return this.authRepos().getProfile().then((user) => {
      this._user.set(user);
      return user;
    });
  }

  refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.authRepos().refreshToken(refreshToken);
  }

  refreshShare(): Promise<AuthTokens> {
    if (this.refreshPromise) return this.refreshPromise;
    if (!this.authRepository) return Promise.reject(new Error('No valid refresh token available'));
    this.refreshPromise = this.authRepository.refreshShare();
    this.refreshPromise.finally(() => { this.refreshPromise = undefined; });
    return this.refreshPromise;
  }

  logout(): void {
    this.authRepos().logout();
    this._user.set(null);
    this.refreshPromise = undefined;
  }

  getDataUser(): User | null {
    return this._user();
  }

  // ponytail: inlined use case wrappers — call the repository directly.
  private authRepos(): AuthRepository {
    if (!this.authRepository) throw new Error('Auth repository not available');
    return this.authRepository;
  }
}
