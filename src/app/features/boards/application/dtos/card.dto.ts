export interface CreateCardRequestDto {
  title: string;
  position: number;
  listId: string | number;
  boardId: string;
}

export interface UpdateCardRequestDto {
  title?: string;
  description?: string;
  position?: number;
  listId?: string | number;
  boardId?: string;
}
