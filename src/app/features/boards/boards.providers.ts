import { Provider } from '@angular/core';

import {
  BOARD_REPOSITORY,
} from './domain/repositories/board.repository';
import { BoardHttpRepository } from './infrastructure/repositories/board-http.repository';
import {
  CARD_REPOSITORY,
} from './domain/repositories/card.repository';
import { CardHttpRepository } from './infrastructure/repositories/card-http.repository';
import {
  LIST_REPOSITORY,
} from './domain/repositories/list.repository';
import { ListHttpRepository } from './infrastructure/repositories/list-http.repository';

// Boards feature providers. Wire repository contracts to HTTP impls
// so use cases (and the BoardFacade) depend on the abstraction.
export const BOARDS_PROVIDERS: Provider[] = [
  { provide: BOARD_REPOSITORY, useExisting: BoardHttpRepository },
  { provide: CARD_REPOSITORY, useExisting: CardHttpRepository },
  { provide: LIST_REPOSITORY, useExisting: ListHttpRepository },
];
