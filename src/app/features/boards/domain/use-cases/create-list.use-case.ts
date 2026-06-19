import { inject, Injectable } from '@angular/core';

import { List } from '../entities/list.entity';
import { LIST_REPOSITORY } from '../repositories/list.repository';

@Injectable({ providedIn: 'root' })
export class CreateListUseCase {
  private readonly listRepository = inject(LIST_REPOSITORY);

  execute(
    title: string,
    position: number,
    boardId: string,
  ): Promise<List> {
    return this.listRepository.create({ title, position, boardId });
  }
}
