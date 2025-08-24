import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { TokenService } from '@services/token.service';

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService, private readonly router: Router) {}

  canActivate() {
    const isValidToken = this.tokenService.isValidRefreshToken();
    if (isValidToken) {
      this.router.navigate(['/app']);
    }
    return true;
  }
}

/* export const redirectGuard: CanActivateFn = () => {
  const token = inject(TokenService).getToken();
  const router = inject(Router);

  if (token) {
    router.navigate(['/app']);
  }
  return true;
}; */
