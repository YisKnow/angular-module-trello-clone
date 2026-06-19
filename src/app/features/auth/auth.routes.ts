import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./presentation/pages/login/login.page').then((m) => m.LoginPage),
    title: 'Login',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./presentation/pages/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPage,
      ),
    title: 'Forgot Password',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./presentation/pages/register/register.page').then((m) => m.RegisterPage),
    title: 'Register',
  },
  {
    path: 'recovery',
    loadComponent: () =>
      import('./presentation/pages/recovery/recovery.page').then((m) => m.RecoveryPage),
    title: 'Recovery',
  },
];
