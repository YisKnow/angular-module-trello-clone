import { inject, Injectable } from '@angular/core';

import { AUTH_REPOSITORY } from '../repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class RecoveryUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(email: string): Promise<void> {
    return this.authRepository.recovery(email);
  }
}
