import { inject, Injectable } from '@angular/core';

import { Board } from '../entities/board.entity';
import { BOARD_REPOSITORY } from '../repositories/board.repository';

@Injectable({ providedIn: 'root' })
export class GetBoardUseCase {
  private readonly boardRepository = inject(BOARD_REPOSITORY);

  execute(id: Board['id']): Promise<Board> {
    return this.boardRepository.getBoard(id);
  }
}
