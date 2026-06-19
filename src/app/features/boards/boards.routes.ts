import { Routes } from '@angular/router';

import { BOARDS_PROVIDERS } from './boards.providers';

export const BOARDS_ROUTES: Routes = [
  {
    path: '',
    providers: [...BOARDS_PROVIDERS],
    loadComponent: () =>
      import('./presentation/pages/boards/boards.page').then(
        (m) => m.BoardsPage,
      ),
  },
  {
    path: ':boardId',
    providers: [...BOARDS_PROVIDERS],
    loadComponent: () =>
      import('./presentation/pages/board/board.page').then(
        (m) => m.BoardPage,
      ),
  },
];
