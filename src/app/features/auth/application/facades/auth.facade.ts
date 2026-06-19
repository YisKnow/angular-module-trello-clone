import { Injectable, Signal, inject, signal } from '@angular/core';

import { User } from '../../domain/entities/user.entity';
import { AuthTokens } from '../contracts/auth-contracts';
import { AUTH_REPOSITORY } from '../tokens/auth-tokens';
import {
  ChangePasswordUseCase,
  GetProfileUseCase,
  IsEmailAvailableUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshShareUseCase,
  RefreshTokenUseCase,
  RegisterAndLoginUseCase,
  RegisterUseCase,
  RequestRecoveryUseCase,
} from '../use-cases/auth.use-cases';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly _user = signal<User | null>(null);
  readonly user: Signal<User | null> = this._user.asReadonly();

  // Single-flight refresh slot. The interceptor + concurrent callers
  // share the same in-flight Promise; once settled, the slot clears.
  private refreshPromise?: Promise<AuthTokens>;

  // Use cases wired through repository contracts.
  private readonly loginUseCase = new LoginUseCase(inject(AUTH_REPOSITORY));
  private readonly registerUseCase = new RegisterUseCase(inject(AUTH_REPOSITORY));
  private readonly registerAndLoginUseCase = new RegisterAndLoginUseCase(inject(AUTH_REPOSITORY));
  private readonly isEmailAvailableUseCase = new IsEmailAvailableUseCase(inject(AUTH_REPOSITORY));
  private readonly requestRecoveryUseCase = new RequestRecoveryUseCase(inject(AUTH_REPOSITORY));
  private readonly changePasswordUseCase = new ChangePasswordUseCase(inject(AUTH_REPOSITORY));
  private readonly getProfileUseCase = new GetProfileUseCase(inject(AUTH_REPOSITORY));
  private readonly refreshTokenUseCase = new RefreshTokenUseCase(inject(AUTH_REPOSITORY));
  private readonly refreshShareUseCase = new RefreshShareUseCase(inject(AUTH_REPOSITORY));
  private readonly logoutUseCase = new LogoutUseCase(inject(AUTH_REPOSITORY));

  login(email: string, password: string): Promise<AuthTokens> {
    return this.loginUseCase.execute(email, password);
  }

  register(name: string, email: string, password: string): Promise<void> {
    return this.registerUseCase.execute(name, email, password);
  }

  registerAndLogin(name: string, email: string, password: string): Promise<AuthTokens> {
    return this.registerAndLoginUseCase.execute(name, email, password);
  }

  isAvailable(email: string): Promise<boolean> {
    return this.isEmailAvailableUseCase.execute(email);
  }

  recovery(email: string): Promise<void> {
    return this.requestRecoveryUseCase.execute(email);
  }

  changePassword(token: string, newPassword: string): Promise<void> {
    return this.changePasswordUseCase.execute(token, newPassword);
  }

  getProfile(): Promise<User> {
    return this.getProfileUseCase.execute().then((user) => {
      this._user.set(user);
      return user;
    });
  }

  refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.refreshTokenUseCase.execute(refreshToken);
  }

  refreshShare(): Promise<AuthTokens> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.refreshShareUseCase.execute();
    // Always clear the slot once the in-flight request settles.
    // The .catch() swallows the rejection on the cleanup chain only —
    // callers still receive the rejection via the returned promise.
    this.refreshPromise
      .finally(() => {
        this.refreshPromise = undefined;
      })
      .catch(() => {});
    return this.refreshPromise;
  }

  logout(): void {
    this.logoutUseCase.execute();
    this._user.set(null);
    this.refreshPromise = undefined;
  }
}
