import { List } from './list.entity';

export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  // ponytail: only top-level cards (board.cards) carry the list ref;
  // cards nested inside a list inherit the parent reference.
  list?: List;
}
