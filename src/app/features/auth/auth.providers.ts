import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';

import { AuthFacade } from './application/facades/auth.facade';
import { AUTH_REPOSITORY, ME_REPOSITORY } from './application/tokens/auth-tokens';
import { AuthHttpRepository } from './infrastructure/repositories/auth-http.repository';
import { MeHttpRepository } from './infrastructure/repositories/me-http.repository';

// Auth feature providers. AUTH_REPOSITORY and ME_REPOSITORY are
// provided as tokens so the application layer (and the token
// interceptor) depend on the contract, not the concrete HTTP
// implementation. Registered globally because the token interceptor
// in core/ needs to resolve AuthFacade.refreshShare() before any
// auth route is active.
export const AUTH_PROVIDERS: Provider[] = [
  AuthHttpRepository,
  MeHttpRepository,
  AuthFacade,
  { provide: AUTH_REPOSITORY, useExisting: AuthHttpRepository },
  { provide: ME_REPOSITORY, useExisting: MeHttpRepository },
];

export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders(AUTH_PROVIDERS);
}
