import { inject, Injectable } from '@angular/core';

import { AUTH_REPOSITORY, AuthTokens } from '../repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class RefreshTokenUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(refreshToken: string): Promise<AuthTokens> {
    return this.authRepository.refreshToken(refreshToken);
  }
}
