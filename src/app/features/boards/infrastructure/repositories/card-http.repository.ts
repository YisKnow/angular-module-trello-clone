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
} from '../../application/contracts/board-contracts';
import { CardMapper } from '../mappers/board.mapper';
import { CardDto } from '../dtos/board.dto';

@Injectable()
export class CardHttpRepository implements CardRepository {
  private readonly apiUrl = environment.API_URL;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  async create(input: CreateCardInput): Promise<Card> {
    const dto = await firstValueFrom(
      this.http.post<CardDto>(`${this.apiUrl}/api/v1/cards`, input, {
        context: checkToken(),
      }),
    );
    return CardMapper.toDomain(dto);
  }

  async update(id: Card['id'], change: UpdateCardInput): Promise<Card> {
    const dto = await firstValueFrom(
      this.http.put<CardDto>(`${this.apiUrl}/api/v1/cards/${id}`, change, {
        context: checkToken(),
      }),
    );
    return CardMapper.toDomain(dto);
  }
}
