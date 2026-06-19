import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import { MeHttpRepository } from '@features/auth/infrastructure/repositories/me-http.repository';

import {
  BOARD_REPOSITORY,
  BOARDS_MY_BOARDS_REPOSITORY,
  CARD_REPOSITORY,
  LIST_REPOSITORY,
} from './application/tokens/board-tokens';
import { BoardHttpRepository } from './infrastructure/repositories/board-http.repository';
import { CardHttpRepository } from './infrastructure/repositories/card-http.repository';
import { ListHttpRepository } from './infrastructure/repositories/list-http.repository';

// ponytail: BoardFacade (providedIn: 'root') is injected by the
// layout shell (navbar / board-form) under core/. That means the
// repository tokens it depends on must also be available globally —
// the layout renders before the boards feature route is activated.
// HTTP still stays inside the feature (only the boards page / facade
// ever touch it), and the application layer never imports them.
export const BOARDS_PROVIDERS: Provider[] = [
  BoardHttpRepository,
  CardHttpRepository,
  ListHttpRepository,
  { provide: BOARD_REPOSITORY, useExisting: BoardHttpRepository },
  { provide: CARD_REPOSITORY, useExisting: CardHttpRepository },
  { provide: LIST_REPOSITORY, useExisting: ListHttpRepository },
  {
    provide: BOARDS_MY_BOARDS_REPOSITORY,
    useFactory: (me: MeHttpRepository) => ({ getMyBoards: () => me.getMyBoards() }),
    deps: [MeHttpRepository],
  },
];

export function provideBoards(): EnvironmentProviders {
  return makeEnvironmentProviders(BOARDS_PROVIDERS);
}
