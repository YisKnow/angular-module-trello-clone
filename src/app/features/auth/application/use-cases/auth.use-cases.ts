// Use cases for the auth feature.
//
// Each use case is a plain class with constructor injection. The
// facade orchestrates them and exposes signals. The application layer
// depends only on repository contracts (no HTTP, no DTOs, no cookies).

import { User } from '../../domain/entities/user.entity';
import { AuthRepository, AuthTokens } from '../contracts/auth-contracts';

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(email: string, password: string): Promise<AuthTokens> {
    return this.authRepository.login(email, password);
  }
}

export class RegisterUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(name: string, email: string, password: string): Promise<void> {
    return this.authRepository.register(name, email, password);
  }
}

export class RegisterAndLoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(name: string, email: string, password: string): Promise<AuthTokens> {
    return this.authRepository.registerAndLogin(name, email, password);
  }
}

export class IsEmailAvailableUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(email: string): Promise<boolean> {
    return this.authRepository.isAvailable(email);
  }
}

export class RequestRecoveryUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(email: string): Promise<void> {
    return this.authRepository.recovery(email);
  }
}

export class ChangePasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(token: string, newPassword: string): Promise<void> {
    return this.authRepository.changePassword(token, newPassword);
  }
}

export class GetProfileUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<User> {
    return this.authRepository.getProfile();
  }
}

export class RefreshTokenUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(refreshToken: string): Promise<AuthTokens> {
    return this.authRepository.refreshToken(refreshToken);
  }
}

export class RefreshShareUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<AuthTokens> {
    return this.authRepository.refreshShare();
  }
}

export class LogoutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): void {
    this.authRepository.logout();
  }
}
