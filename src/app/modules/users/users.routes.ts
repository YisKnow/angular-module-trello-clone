import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users-table/users-table.component').then(
        (m) => m.UsersTableComponent,
      ),
  },
];
