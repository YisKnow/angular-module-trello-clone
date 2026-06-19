import { inject, Injectable } from '@angular/core';

import { Colors } from '@shared/models/colors.model';

import { Board } from '../entities/board.entity';
import { BOARD_REPOSITORY } from '../repositories/board.repository';

@Injectable({ providedIn: 'root' })
export class CreateBoardUseCase {
  private readonly boardRepository = inject(BOARD_REPOSITORY);

  execute(title: string, backgroundColor: Colors): Promise<Board> {
    return this.boardRepository.createBoard(title, backgroundColor);
  }
}
