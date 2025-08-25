import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';

import { checkToken } from '@interceptors/token.interceptor';

import { Card, CreateCardDto, UpdateCardDTO } from '@models/card.model';

@Injectable({
  providedIn: 'root',
})
export class CardsService {
  apiUrl = environment.API_URL;

  constructor(private readonly http: HttpClient) {}

  create(dto: CreateCardDto) {
    return this.http.post<Card>(`${this.apiUrl}/api/v1/cards`, dto, {
      context: checkToken(),
    });
  }

  update(id: Card['id'], change: UpdateCardDTO) {
    return this.http.put<Card>(`${this.apiUrl}/api/v1/cards/${id}`, change, {
      context: checkToken(),
    });
  }
}
