import { Injectable, Signal, inject, signal } from '@angular/core';

import { TokenService } from '@core/auth/token.service';

import { User } from '../../domain/entities/user.entity';
import { AuthTokens, AUTH_REPOSITORY } from '../../domain/repositories/auth.repository';
import { ChangePasswordUseCase } from '../../domain/use-cases/change-password.use-case';
import { GetProfileUseCase } from '../../domain/use-cases/get-profile.use-case';
import { IsAvailableUseCase } from '../../domain/use-cases/is-available.use-case';
import { LoginUseCase } from '../../domain/use-cases/login.use-case';
import { LogoutUseCase } from '../../domain/use-cases/logout.use-case';
import { RecoveryUseCase } from '../../domain/use-cases/recovery.use-case';
import { RefreshTokenUseCase } from '../../domain/use-cases/refresh-token.use-case';
import { RegisterAndLoginUseCase } from '../../domain/use-cases/register-and-login.use-case';
import { RegisterUseCase } from '../../domain/use-cases/register.use-case';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  // Route-scoped: this facade is destroyed when the user leaves /app.
  // Login/register pages get a fresh facade, profile pages reuse it.
  private readonly _user = signal<User | null>(null);
  readonly user: Signal<User | null> = this._user.asReadonly();

  // Direct repository access for refresh: the token interceptor calls
  // this from outside the auth route, so it must NOT depend on a
  // route-scoped injection context. We grab the repository once at
  // construction and keep the reference.
  private readonly authRepository = inject(AUTH_REPOSITORY, {
    optional: true,
  });

  // Slot for the current in-flight refresh. Cleared after completion
  // so the next refresh starts a fresh network call.
  private refreshPromise?: Promise<AuthTokens>;

  constructor(
    private readonly tokenService: TokenService = inject(TokenService),
    private readonly loginUseCase: LoginUseCase = inject(LoginUseCase),
    private readonly registerUseCase: RegisterUseCase = inject(RegisterUseCase),
    private readonly registerAndLoginUseCase: RegisterAndLoginUseCase = inject(
      RegisterAndLoginUseCase,
    ),
    private readonly isAvailableUseCase: IsAvailableUseCase = inject(IsAvailableUseCase),
    private readonly recoveryUseCase: RecoveryUseCase = inject(RecoveryUseCase),
    private readonly changePasswordUseCase: ChangePasswordUseCase = inject(ChangePasswordUseCase),
    private readonly getProfileUseCase: GetProfileUseCase = inject(GetProfileUseCase),
    private readonly refreshTokenUseCase: RefreshTokenUseCase = inject(RefreshTokenUseCase),
    private readonly logoutUseCase: LogoutUseCase = inject(LogoutUseCase),
  ) {}

  login(email: string, password: string): Promise<AuthTokens> {
    return this.loginUseCase.execute(email, password);
  }

  register(name: string, email: string, password: string): Promise<void> {
    return this.registerUseCase.execute(name, email, password);
  }

  registerAndLogin(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthTokens> {
    return this.registerAndLoginUseCase.execute(name, email, password);
  }

  isAvailable(email: string): Promise<boolean> {
    return this.isAvailableUseCase.execute(email);
  }

  recovery(email: string): Promise<void> {
    return this.recoveryUseCase.execute(email);
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

  // Single-flight refresh shared by the token interceptor. Concurrent
  // callers receive the same promise; once settled, the next call
  // starts a fresh request.
  refreshShare(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    if (!this.authRepository) {
      return Promise.reject(
        new Error('No valid refresh token available'),
      );
    }
    this.refreshPromise = this.authRepository.refreshShare();
    this.refreshPromise.finally(() => {
      this.refreshPromise = undefined;
    });
    return this.refreshPromise;
  }

  logout(): void {
    this.logoutUseCase.execute();
    this._user.set(null);
    this.refreshPromise = undefined;
  }

  getDataUser(): User | null {
    return this._user();
  }
}
