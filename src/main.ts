import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { tokenInterceptor } from './app/core/interceptors/token.interceptor';
import { provideAuth } from './app/features/auth/auth.providers';
import { BOARD_REPOSITORY } from './app/features/boards/domain/repositories/board.repository';
import { BoardHttpRepository } from './app/features/boards/infrastructure/repositories/board-http.repository';
import { CARD_REPOSITORY } from './app/features/boards/domain/repositories/card.repository';
import { CardHttpRepository } from './app/features/boards/infrastructure/repositories/card-http.repository';
import { LIST_REPOSITORY } from './app/features/boards/domain/repositories/list.repository';
import { ListHttpRepository } from './app/features/boards/infrastructure/repositories/list-http.repository';
import { ME_REPOSITORY } from './app/features/auth/domain/repositories/me.repository';
import { MeHttpRepository } from './app/features/auth/infrastructure/repositories/me-http.repository';
import { USERS_REPOSITORY } from './app/features/users/domain/repositories/users.repository';
import { UsersHttpRepository } from './app/features/users/infrastructure/repositories/users-http.repository';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideAuth(),
    { provide: BOARD_REPOSITORY, useExisting: BoardHttpRepository },
    { provide: CARD_REPOSITORY, useExisting: CardHttpRepository },
    { provide: LIST_REPOSITORY, useExisting: ListHttpRepository },
    { provide: ME_REPOSITORY, useExisting: MeHttpRepository },
    { provide: USERS_REPOSITORY, useExisting: UsersHttpRepository },
  ],
}).catch((err) => console.error(err));
