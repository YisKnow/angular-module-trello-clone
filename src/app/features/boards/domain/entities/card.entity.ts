import { List } from './list.entity';

export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  list: List;
}
