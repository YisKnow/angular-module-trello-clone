// Mappers for the auth feature.
//
// Pure functions — no Angular, no HTTP. They translate wire DTOs
// (declared in infrastructure/dtos) into the domain entities declared
// in domain/entities.

import { User } from '../../domain/entities/user.entity';
import { AuthTokens } from '../../application/contracts/auth-contracts';
import {
  ChangePasswordRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  RecoveryRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
  UserDto,
} from '../dtos/auth.dto';

export const AuthMapper = {
  toTokens(dto: LoginResponseDto): AuthTokens {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
    };
  },

  toUser(dto: UserDto): User {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      avatar: dto.avatar,
      // API sends `creationAt` (typo); domain uses `createdAt`.
      createdAt: dto.creationAt,
      updatedAt: dto.updatedAt,
    };
  },

  toLoginRequest(email: string, password: string): LoginRequestDto {
    return { email, password };
  },

  toRegisterRequest(name: string, email: string, password: string): RegisterRequestDto {
    return { name, email, password };
  },

  toRefreshRequest(refreshToken: string): RefreshTokenRequestDto {
    return { refreshToken };
  },

  toRecoveryRequest(email: string): RecoveryRequestDto {
    return { email };
  },

  toChangePasswordRequest(token: string, newPassword: string): ChangePasswordRequestDto {
    return { token, newPassword };
  },
};
