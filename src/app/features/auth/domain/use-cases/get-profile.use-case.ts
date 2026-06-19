import { inject, Injectable } from '@angular/core';

import { User } from '../entities/user.entity';
import { AUTH_REPOSITORY } from '../repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class GetProfileUseCase {
  private readonly authRepository = inject(AUTH_REPOSITORY);

  execute(): Promise<User> {
    return this.authRepository.getProfile();
  }
}
