import { inject, Injectable } from '@angular/core';

import { AUTH_REPOSITORY } from '../repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class LogoutUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(): void {
    this.authRepository.logout();
  }
}
