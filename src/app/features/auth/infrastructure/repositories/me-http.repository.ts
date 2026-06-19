import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

import { checkToken } from '@core/interceptors/token.interceptor';

import { User } from '../../domain/entities/user.entity';
import { MeRepository } from '../../application/contracts/auth-contracts';
import { AuthMapper } from '../mappers/auth.mapper';
import { UserDto as AuthUserDto } from '../dtos/auth.dto';
import { BoardMapper } from '@boards/infrastructure/mappers/board.mapper';
import { BoardSummaryDto } from '@boards/infrastructure/dtos/board.dto';

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

  async getMyBoards() {
    const dtos = await firstValueFrom(
      this.http.get<BoardSummaryDto[]>(`${this.apiUrl}/api/v1/me/boards`, {
        context: checkToken(),
      }),
    );
    return dtos.map(BoardMapper.toSummary);
  }
}
