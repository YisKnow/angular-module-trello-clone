import { Provider } from '@angular/core';

import {
  USERS_REPOSITORY,
} from './domain/repositories/users.repository';
import { UsersHttpRepository } from './infrastructure/repositories/users-http.repository';

export const USERS_PROVIDERS: Provider[] = [
  { provide: USERS_REPOSITORY, useExisting: UsersHttpRepository },
];
