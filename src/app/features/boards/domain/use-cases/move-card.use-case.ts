import { inject, Injectable } from '@angular/core';

import { Card } from '../entities/card.entity';
import { CARD_REPOSITORY } from '../repositories/card.repository';

@Injectable({ providedIn: 'root' })
export class MoveCardUseCase {
  private readonly cardRepository = inject(CARD_REPOSITORY);

  execute(
    id: Card['id'],
    position: number,
    listId: string | number,
  ): Promise<Card> {
    return this.cardRepository.update(id, { position, listId });
  }
}
