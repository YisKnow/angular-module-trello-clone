import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

import { checkToken } from '@core/interceptors/token.interceptor';

import { Board } from '../../domain/entities/board.entity';
import { BoardRepository } from '../../application/contracts/board-contracts';
import { BoardMapper } from '../mappers/board.mapper';
import { BoardDto, CreateBoardDto } from '../dtos/board.dto';

@Injectable()
export class BoardHttpRepository implements BoardRepository {
  private readonly apiUrl = environment.API_URL;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  async getBoard(id: Board['id']): Promise<Board> {
    const dto = await firstValueFrom(
      this.http.get<BoardDto>(`${this.apiUrl}/api/v1/boards/${id}`, {
        context: checkToken(),
      }),
    );
    return BoardMapper.toDomain(dto);
  }

  async createBoard(title: string, backgroundColor: Board['backgroundColor']): Promise<Board> {
    const body: CreateBoardDto = { title, backgroundColor };
    const dto = await firstValueFrom(
      this.http.post<BoardDto>(`${this.apiUrl}/api/v1/boards`, body, {
        context: checkToken(),
      }),
    );
    return BoardMapper.toDomain(dto);
  }

  async deleteBoard(id: Board['id']): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/api/v1/boards/${id}`, {
        context: checkToken(),
      }),
    );
  }
}
