import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

import { checkToken } from '@core/interceptors/token.interceptor';

import { List } from '../../domain/entities/list.entity';
import {
  CreateListInput,
  ListRepository,
} from '../../domain/repositories/list.repository';
import { ListMapper } from '../../application/mappers/board.mapper';
import { ListDto } from '../../application/dtos/board.dto';
import {
  CreateListRequestDto,
} from '../../application/dtos/list.dto';

@Injectable({ providedIn: 'root' })
export class ListHttpRepository implements ListRepository {
  private readonly apiUrl = environment.API_URL;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  async create(input: CreateListInput): Promise<List> {
    const body: CreateListRequestDto = {
      title: input.title,
      position: input.position,
      boardId: input.boardId,
    };
    const dto = await firstValueFrom(
      this.http.post<ListDto>(`${this.apiUrl}/api/v1/lists`, body, {
        context: checkToken(),
      }),
    );
    return ListMapper.toDomain(dto);
  }
}
