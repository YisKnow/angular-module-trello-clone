import { InjectionToken } from '@angular/core';

import { List } from '../entities/list.entity';

export interface CreateListInput {
  title: string;
  position: number;
  boardId: string;
}

export interface ListRepository {
  create(input: CreateListInput): Promise<List>;
}

export const LIST_REPOSITORY = new InjectionToken<ListRepository>(
  'LIST_REPOSITORY',
);
