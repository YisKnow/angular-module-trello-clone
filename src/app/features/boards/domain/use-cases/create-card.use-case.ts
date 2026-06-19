import { inject, Injectable } from '@angular/core';

import { Card } from '../entities/card.entity';
import { CARD_REPOSITORY } from '../repositories/card.repository';

@Injectable({ providedIn: 'root' })
export class CreateCardUseCase {
  private readonly cardRepository = inject(CARD_REPOSITORY);

  execute(
    title: string,
    position: number,
    listId: string | number,
    boardId: string,
  ): Promise<Card> {
    return this.cardRepository.create({ title, position, listId, boardId });
  }
}
