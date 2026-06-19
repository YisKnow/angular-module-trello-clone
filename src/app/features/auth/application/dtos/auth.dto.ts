// Backend DTOs — wire format. Domain entities are the trusted internal
// model. Mappers convert DTO ↔ entity so the rest of the app never
// sees backend field names directly.
export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
}

export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface IsAvailableRequestDto {
  email: string;
}

export interface IsAvailableResponseDto {
  isAvailable: boolean;
}

export interface RecoveryRequestDto {
  email: string;
}

export interface ChangePasswordRequestDto {
  token: string;
  newPassword: string;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  avatar: string;
  creationAt: string;
  updatedAt: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}
