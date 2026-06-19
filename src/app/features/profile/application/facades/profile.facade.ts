import { Injectable, Signal, inject, signal } from '@angular/core';

import { User } from '@features/auth/domain/entities/user.entity';
import { MeRepository, ME_REPOSITORY } from '@features/auth/domain/repositories/me.repository';

@Injectable({ providedIn: 'root' })
export class ProfileFacade {
  private readonly _profile = signal<User | null>(null);
  readonly profile: Signal<User | null> = this._profile.asReadonly();

  private readonly meRepository = inject(ME_REPOSITORY);

  async loadProfile(): Promise<User | null> {
    try {
      const user = await this.meRepository.getMeProfile();
      this._profile.set(user);
      return user;
    } catch {
      return null;
    }
  }
}
