import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

import { checkToken } from '@core/interceptors/token.interceptor';

import { User } from '../../domain/entities/user.entity';
import { MeRepository } from '../../domain/repositories/me.repository';
import { Board } from '@boards/domain/entities/board.entity';
import { AuthMapper } from '../../application/mappers/auth.mapper';
import { BoardMapper } from '@boards/application/mappers/board.mapper';
import { BoardDto } from '@boards/application/dtos/board.dto';
import { UserDto as AuthUserDto } from '../../application/dtos/auth.dto';

@Injectable({ providedIn: 'root' })
export class MeHttpRepository implements MeRepository {
  private readonly apiUrl = environment.API_URL;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  async getMeProfile(): Promise<User> {
    const dto = await firstValueFrom(
      this.http.get<AuthUserDto>(`${this.apiUrl}/api/v1/me/profile`, {
        context: checkToken(),
      }),
    );
    return AuthMapper.toUser(dto);
  }

  async getMeBoards(): Promise<Board[]> {
    const dtos = await firstValueFrom(
      this.http.get<BoardDto[]>(`${this.apiUrl}/api/v1/me/boards`, {
        context: checkToken(),
      }),
    );
    return dtos.map(BoardMapper.toDomain);
  }
}
