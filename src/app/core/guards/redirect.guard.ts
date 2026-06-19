import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { TokenService } from '@core/auth/token.service';

export const redirectGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Already authenticated: send the user into the app, otherwise let
  // the auth route render (login / register).
  return tokenService.isValidRefreshToken()
    ? router.createUrlTree(['/app'])
    : true;
};
