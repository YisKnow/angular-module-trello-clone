import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

import { checkToken } from '@core/interceptors/token.interceptor';

import { Card } from '../../domain/entities/card.entity';
import {
  CardRepository,
  CreateCardInput,
  UpdateCardInput,
} from '../../domain/repositories/card.repository';
import { CardMapper } from '../../application/mappers/board.mapper';
import { CardDto } from '../../application/dtos/board.dto';
import {
  CreateCardRequestDto,
  UpdateCardRequestDto,
} from '../../application/dtos/card.dto';

@Injectable({ providedIn: 'root' })
export class CardHttpRepository implements CardRepository {
  private readonly apiUrl = environment.API_URL;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  async create(input: CreateCardInput): Promise<Card> {
    const body: CreateCardRequestDto = {
      title: input.title,
      position: input.position,
      listId: input.listId,
      boardId: input.boardId,
    };
    const dto = await firstValueFrom(
      this.http.post<CardDto>(`${this.apiUrl}/api/v1/cards`, body, {
        context: checkToken(),
      }),
    );
    return CardMapper.toDomain(dto);
  }

  async update(id: Card['id'], change: UpdateCardInput): Promise<Card> {
    const body: UpdateCardRequestDto = {
      title: change.title,
      description: change.description,
      position: change.position,
      listId: change.listId,
      boardId: change.boardId,
    };
    const dto = await firstValueFrom(
      this.http.put<CardDto>(`${this.apiUrl}/api/v1/cards/${id}`, body, {
        context: checkToken(),
      }),
    );
    return CardMapper.toDomain(dto);
  }
}
