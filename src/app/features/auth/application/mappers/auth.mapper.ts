import { User } from '../../domain/entities/user.entity';
import {
  AuthTokens,
} from '../../domain/repositories/auth.repository';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  UserDto,
  RefreshTokenRequestDto,
} from '../dtos/auth.dto';

// Pure mapper functions. No Angular, no HttpClient — easy to test
// in isolation, easy to swap when the API contract changes.
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

  toRegisterRequest(
    name: string,
    email: string,
    password: string,
  ): RegisterRequestDto {
    return { name, email, password };
  },

  toRefreshRequest(refreshToken: string): RefreshTokenRequestDto {
    return { refreshToken };
  },
};
