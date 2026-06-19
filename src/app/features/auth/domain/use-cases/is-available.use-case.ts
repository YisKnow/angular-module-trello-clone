import { inject, Injectable } from '@angular/core';

import { AUTH_REPOSITORY } from '../repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class IsAvailableUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(email: string): Promise<boolean> {
    return this.authRepository.isAvailable(email);
  }
}
