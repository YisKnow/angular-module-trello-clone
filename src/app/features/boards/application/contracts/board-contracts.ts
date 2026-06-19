// Repository contracts (interfaces) for the boards feature.
//
// Pure TypeScript — no Angular, no HTTP, no DTOs. The application layer
// talks to these contracts; the infrastructure layer provides the
// concrete implementations. Mappers live in infrastructure next to the
// DTOs so domain stays free of wire-format details.

import { Colors } from '@shared/models/colors.model';

import { Board, BoardSummary } from '../../domain/entities/board.entity';
import { Card } from '../../domain/entities/card.entity';
import { List } from '../../domain/entities/list.entity';

export interface BoardRepository {
  getBoard(id: Board['id']): Promise<Board>;
  createBoard(title: string, backgroundColor: Colors): Promise<Board>;
  deleteBoard(id: Board['id']): Promise<void>;
}

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

export interface CreateListInput {
  title: string;
  position: number;
  boardId: string;
}

export interface ListRepository {
  create(input: CreateListInput): Promise<List>;
}

export interface MeBoardSummary {
  getMyBoards(): Promise<BoardSummary[]>;
}

export interface MeBoardSummaryRepository extends MeBoardSummary {}
