// Injection tokens for the auth feature's repository contracts.
//
// Tokens live in the application layer, not the domain, so the domain
// stays free of Angular imports.

import { InjectionToken } from '@angular/core';

import { AuthRepository, MeRepository } from '../contracts/auth-contracts';

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');

export const ME_REPOSITORY = new InjectionToken<MeRepository>('ME_REPOSITORY');
