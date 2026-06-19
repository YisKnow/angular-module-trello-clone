import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';

import { AUTH_REPOSITORY } from './domain/repositories/auth.repository';
import { AuthHttpRepository } from './infrastructure/repositories/auth-http.repository';

// Auth feature providers. AUTH_REPOSITORY is provided as a token so
// use cases (and the token interceptor) depend on the contract, not
// the concrete implementation. Registered globally because the
// token interceptor in core/ needs to resolve the repository
// before any auth route is active.
export const AUTH_PROVIDERS: Provider[] = [
  { provide: AUTH_REPOSITORY, useExisting: AuthHttpRepository },
];

export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders(AUTH_PROVIDERS);
}
