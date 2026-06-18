import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '@auth/components/header/header.component';
import { FooterComponent } from '@auth/components/footer/footer.component';
import { RegisterFormComponent } from '@auth/components/register-form/register-form.component';
import { BackgroundComponent } from '@auth/components/background/background.component';

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
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  constructor() {}
}
