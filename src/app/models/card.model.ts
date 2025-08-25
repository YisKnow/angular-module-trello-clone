import { List } from "./list.model";

export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  list: List;
}

/* export interface CreateCardDto {
  title: string;
  position: number;
  descripcion?: string;
  listId: string | number;
  boardId: string;
} */

export interface CreateCardDto extends Omit<Card, 'id' | 'list'> {
  listId: string | number;
  boardId: string;
}

export interface UpdateCardDTO {
  title?: string;
  description?: string;
  position?: number;
  listId?: string | number;
  boardId?: string;
}
