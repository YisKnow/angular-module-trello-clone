import { InjectionToken } from '@angular/core';

import { User } from '../entities/user.entity';
import { Board } from '@boards/domain/entities/board.entity';

export interface MeRepository {
  getMeProfile(): Promise<User>;
  getMeBoards(): Promise<Board[]>;
}

export const ME_REPOSITORY = new InjectionToken<MeRepository>('ME_REPOSITORY');
