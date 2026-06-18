import { Routes } from '@angular/router';

export const BOARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/boards/boards.component').then((m) => m.BoardsComponent),
  },
  {
    path: ':boardId',
    loadComponent: () =>
      import('./pages/board/board.component').then((m) => m.BoardComponent),
  },
];
