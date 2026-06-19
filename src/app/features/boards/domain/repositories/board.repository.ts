import { InjectionToken } from '@angular/core';

import { Colors } from '@shared/models/colors.model';

import { Board } from '../entities/board.entity';

export interface BoardRepository {
  getBoard(id: Board['id']): Promise<Board>;
  createBoard(title: string, backgroundColor: Colors): Promise<Board>;
}

export const BOARD_REPOSITORY = new InjectionToken<BoardRepository>(
  'BOARD_REPOSITORY',
);
