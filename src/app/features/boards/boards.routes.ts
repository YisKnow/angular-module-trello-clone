import { Routes } from '@angular/router';

export const BOARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/boards/boards.page').then(
        (m) => m.BoardsPage,
      ),
  },
  {
    path: ':boardId',
    loadComponent: () =>
      import('./presentation/pages/board/board.page').then(
        (m) => m.BoardPage,
      ),
  },
];
