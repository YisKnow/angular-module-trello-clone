import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { tokenInterceptor } from './app/core/interceptors/token.interceptor';
import { provideAuth } from './app/features/auth/auth.providers';
import { provideBoards } from './app/features/boards/boards.providers';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    // Auth and Boards feature providers stay global because the
    // layout shell (core/) injects AuthFacade and BoardFacade
    // before the feature routes activate. AuthFacade is needed by
    // the token interceptor; BoardFacade is needed by the navbar
    // and the board-form in core/layout.
    provideAuth(),
    provideBoards(),
  ],
}).catch((err) => console.error(err));
