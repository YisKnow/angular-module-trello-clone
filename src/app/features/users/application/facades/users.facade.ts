import { Injectable, Signal, inject, signal } from '@angular/core';

import { User } from '@features/auth/domain/entities/user.entity';
import {
  USERS_REPOSITORY,
  UsersRepository,
} from '../../domain/repositories/users.repository';

@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private readonly _users = signal<User[]>([]);
  readonly users: Signal<User[]> = this._users.asReadonly();

  private readonly usersRepository = inject(USERS_REPOSITORY);

  async loadUsers(): Promise<User[]> {
    const users = await this.usersRepository.getUsers();
    this._users.set(users);
    return users;
  }
}
