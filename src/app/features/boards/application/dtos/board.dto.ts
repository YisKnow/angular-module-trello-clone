import { Colors } from '@shared/models/colors.model';

import { UserDto } from '@features/auth/application/dtos/auth.dto';

export interface BoardDto {
  id: string;
  title: string;
  backgroundColor: Colors;
  members: UserDto[];
  lists: ListDto[];
  cards: CardDto[];
}

export interface ListDto {
  id: string;
  title: string;
  position: number;
  cards: CardDto[];
}

export interface CardDto {
  id: string;
  title: string;
  description?: string;
  position: number;
  list: ListDto;
}

export interface CreateBoardDto {
  title: string;
  backgroundColor: Colors;
}
