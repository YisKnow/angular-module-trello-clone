import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '@features/auth/presentation/components/header/header.component';
import { FooterComponent } from '@features/auth/presentation/components/footer/footer.component';
import { ForgotPasswordFormComponent } from '@features/auth/presentation/components/forgot-password-form/forgot-password-form.component';
import { BackgroundComponent } from '@features/auth/presentation/components/background/background.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    FooterComponent,
    ForgotPasswordFormComponent,
    BackgroundComponent,
  ],
  templateUrl: './forgot-password.page.html',
})
export class ForgotPasswordPage {}
