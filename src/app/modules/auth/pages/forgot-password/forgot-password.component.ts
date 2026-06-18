import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '@auth/components/header/header.component';
import { FooterComponent } from '@auth/components/footer/footer.component';
import { ForgotPasswordFormComponent } from '@auth/components/forgot-password-form/forgot-password-form.component';
import { BackgroundComponent } from '@auth/components/background/background.component';

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
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  constructor() {}
}
