import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LoginFormComponent } from '@features/auth/presentation/components/login-form/login-form.component';
import { BackgroundComponent } from '@features/auth/presentation/components/background/background.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    LoginFormComponent,
    BackgroundComponent,
  ],
  templateUrl: './login.page.html',
})
export class LoginPage {}
