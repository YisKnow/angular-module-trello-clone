import { InjectionToken } from '@angular/core';

import { Card } from '../entities/card.entity';

export interface CreateCardInput {
  title: string;
  position: number;
  listId: string | number;
  boardId: string;
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  position?: number;
  listId?: string | number;
  boardId?: string;
}

export interface CardRepository {
  create(input: CreateCardInput): Promise<Card>;
  update(id: Card['id'], change: UpdateCardInput): Promise<Card>;
}

export const CARD_REPOSITORY = new InjectionToken<CardRepository>(
  'CARD_REPOSITORY',
);
