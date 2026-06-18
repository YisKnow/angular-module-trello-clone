import { Routes } from '@angular/router';

import { authGuard } from '@guards/auth.guard';
import { redirectGuard } from '@guards/redirect.guard';

export const appRoutes: Routes = [
  {
    path: '',
    canActivate: [redirectGuard],
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/layout/layout.routes').then((m) => m.LAYOUT_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
