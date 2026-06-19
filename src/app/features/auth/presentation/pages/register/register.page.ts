import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { RegisterFormComponent } from '@features/auth/presentation/components/register-form/register-form.component';
import { BackgroundComponent } from '@features/auth/presentation/components/background/background.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, RegisterFormComponent, BackgroundComponent],
  templateUrl: './register.page.html',
})
export class RegisterPage {}
