import { Injectable, Signal, inject, signal } from '@angular/core';

import { User } from '@features/auth/domain/entities/user.entity';
import { UsersHttpRepository } from '../../infrastructure/repositories/users-http.repository';

@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private readonly _users = signal<User[]>([]);
  readonly users: Signal<User[]> = this._users.asReadonly();

  private readonly usersRepository = inject(UsersHttpRepository);

  async loadUsers(): Promise<User[]> {
    const users = await this.usersRepository.getUsers();
    this._users.set(users);
    return users;
  }
}
