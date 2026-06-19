import { inject, Injectable } from '@angular/core';

import { AUTH_REPOSITORY } from '../repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class ChangePasswordUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(token: string, newPassword: string): Promise<void> {
    return this.authRepository.changePassword(token, newPassword);
  }
}
