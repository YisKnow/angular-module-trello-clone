import { User } from '@features/auth/domain/entities/user.entity';
import { InjectionToken } from '@angular/core';

export interface UsersRepository {
  getUsers(): Promise<User[]>;
}

export const USERS_REPOSITORY = new InjectionToken<UsersRepository>(
  'USERS_REPOSITORY',
);
