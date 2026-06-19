// Repository contracts (interfaces) for the auth feature.
//
// Pure TypeScript — no Angular, no HTTP, no DTOs. The application layer
// talks to these contracts; the infrastructure layer provides the
// concrete implementations. Token persistence and single-flight
// refresh live in the AuthRepository contract so use cases don't
// have to know about TokenService directly.

import { User } from '../../domain/entities/user.entity';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthTokens>;
  register(name: string, email: string, password: string): Promise<void>;
  registerAndLogin(name: string, email: string, password: string): Promise<AuthTokens>;
  isAvailable(email: string): Promise<boolean>;
  recovery(email: string): Promise<void>;
  changePassword(token: string, newPassword: string): Promise<void>;
  getProfile(): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  refreshShare(): Promise<AuthTokens>;
  logout(): void;
}

export interface MeRepository {
  getMeProfile(): Promise<User>;
  getMyBoards(): Promise<BoardSummaryLike[]>;
}

// Lean shape used by "me/boards" — declared here to avoid forcing
// the auth feature to import from the boards feature's domain.
export interface BoardSummaryLike {
  id: string;
  title: string;
  backgroundColor: unknown;
}
