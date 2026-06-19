import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

import { checkToken } from '@core/interceptors/token.interceptor';

import { User } from '@features/auth/domain/entities/user.entity';
import { AuthMapper } from '@features/auth/application/mappers/auth.mapper';
import { UserDto } from '@features/auth/application/dtos/auth.dto';

@Injectable({ providedIn: 'root' })
export class UsersHttpRepository {
  private readonly apiUrl = environment.API_URL;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  async getUsers(): Promise<User[]> {
    const dtos = await firstValueFrom(
      this.http.get<UserDto[]>(`${this.apiUrl}/api/v1/users`, {
        context: checkToken(),
      }),
    );
    return dtos.map(AuthMapper.toUser);
  }
}
