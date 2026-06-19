import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '@features/auth/presentation/components/header/header.component';
import { FooterComponent } from '@features/auth/presentation/components/footer/footer.component';
import { LoginFormComponent } from '@features/auth/presentation/components/login-form/login-form.component';
import { BackgroundComponent } from '@features/auth/presentation/components/background/background.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    FooterComponent,
    LoginFormComponent,
    BackgroundComponent,
  ],
  templateUrl: './login.page.html',
})
export class LoginPage {}
