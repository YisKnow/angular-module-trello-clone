import { InjectionToken } from '@angular/core';

import { User } from '../entities/user.entity';
import { BoardSummary } from '@boards/domain/entities/board.entity';

export interface MeRepository {
  getMeProfile(): Promise<User>;
  getMeBoards(): Promise<BoardSummary[]>;
}

export const ME_REPOSITORY = new InjectionToken<MeRepository>('ME_REPOSITORY');
