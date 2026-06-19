import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { redirectGuard } from '@core/guards/redirect.guard';

export const appRoutes: Routes = [
  {
    path: '',
    canActivate: [redirectGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./core/layout/layout.routes').then((m) => m.LAYOUT_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
