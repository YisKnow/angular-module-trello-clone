import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '@features/auth/presentation/components/header/header.component';
import { FooterComponent } from '@features/auth/presentation/components/footer/footer.component';
import { RegisterFormComponent } from '@features/auth/presentation/components/register-form/register-form.component';
import { BackgroundComponent } from '@features/auth/presentation/components/background/background.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    FooterComponent,
    RegisterFormComponent,
    BackgroundComponent,
  ],
  templateUrl: './register.page.html',
})
export class RegisterPage {}
