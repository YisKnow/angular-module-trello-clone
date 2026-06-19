import { Colors } from '@shared/models/colors.model';

import { Card } from './card.entity';
import { List } from './list.entity';
import { User } from '@features/auth/domain/entities/user.entity';

export interface Board {
  id: string;
  title: string;
  backgroundColor: Colors;
  members: User[];
  lists: List[];
  cards: Card[];
}

// ponytail: lean shape for list endpoints — full Board not needed there.
export interface BoardSummary {
  id: string;
  title: string;
  backgroundColor: Colors;
}
