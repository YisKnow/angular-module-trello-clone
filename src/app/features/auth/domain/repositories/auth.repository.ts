import { InjectionToken } from '@angular/core';

import { User } from '../entities/user.entity';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthTokens>;
  register(name: string, email: string, password: string): Promise<void>;
  registerAndLogin(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthTokens>;
  isAvailable(email: string): Promise<boolean>;
  recovery(email: string): Promise<void>;
  changePassword(token: string, newPassword: string): Promise<void>;
  getProfile(): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  refreshShare(): Promise<AuthTokens>;
  logout(): void;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>(
  'AUTH_REPOSITORY',
);
