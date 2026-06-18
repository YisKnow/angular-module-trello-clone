import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '@auth/components/header/header.component';
import { FooterComponent } from '@auth/components/footer/footer.component';
import { LoginFormComponent } from '@auth/components/login-form/login-form.component';
import { BackgroundComponent } from '@auth/components/background/background.component';

// ponytail: no OnInit needed
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
  templateUrl: './login.component.html',
})
export class LoginComponent {}
