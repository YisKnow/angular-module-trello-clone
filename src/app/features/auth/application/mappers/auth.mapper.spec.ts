import { describe, it, expect } from 'vitest';

import { AuthMapper } from '@features/auth/application/mappers/auth.mapper';

describe('AuthMapper', () => {
  it('toTokens maps snake_case wire format to camelCase tokens', () => {
    const result = AuthMapper.toTokens({
      access_token: 'a',
      refresh_token: 'r',
    });
    expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('toUser maps the UserDto wire format to the domain User (creationAt→createdAt)', () => {
    const result = AuthMapper.toUser({
      id: 1,
      name: 'Alice',
      email: 'a@b.com',
      avatar: 'pic.png',
      creationAt: '2024-01-01',
      updatedAt: '2024-01-02',
    });
    expect(result).toEqual({
      id: 1,
      name: 'Alice',
      email: 'a@b.com',
      avatar: 'pic.png',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
    });
  });

  it('toLoginRequest returns a plain object with email and password', () => {
    expect(AuthMapper.toLoginRequest('a@b.com', 'pw')).toEqual({
      email: 'a@b.com',
      password: 'pw',
    });
  });

  it('toRegisterRequest returns a plain object with name, email, password', () => {
    expect(AuthMapper.toRegisterRequest('A', 'a@b.com', 'pw')).toEqual({
      name: 'A',
      email: 'a@b.com',
      password: 'pw',
    });
  });

  it('toRefreshRequest returns a plain object with refreshToken', () => {
    expect(AuthMapper.toRefreshRequest('xyz')).toEqual({ refreshToken: 'xyz' });
  });
});
