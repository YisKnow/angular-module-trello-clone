import { inject, Injectable } from '@angular/core';

import { AUTH_REPOSITORY, AuthTokens } from '../repositories/auth.repository';

// Chains register → login atomically. Login only runs if register
// succeeds; register failure aborts the flow.
@Injectable({ providedIn: 'root' })
export class RegisterAndLoginUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthTokens> {
    return this.authRepository.registerAndLogin(name, email, password);
  }
}
