import { inject, Injectable } from '@angular/core';

import { AUTH_REPOSITORY } from '../repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class RegisterUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(name: string, email: string, password: string): Promise<void> {
    return this.authRepository.register(name, email, password);
  }
}
