import { inject, Injectable } from '@angular/core';

import { AuthRepository, AUTH_REPOSITORY, AuthTokens } from '../repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(email: string, password: string): Promise<AuthTokens> {
    return this.authRepository.login(email, password);
  }
}
