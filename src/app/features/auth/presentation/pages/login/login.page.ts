import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { LoginFormComponent } from '@features/auth/presentation/components/login-form/login-form.component';
import { BackgroundComponent } from '@features/auth/presentation/components/background/background.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, LoginFormComponent, BackgroundComponent],
  templateUrl: './login.page.html',
})
export class LoginPage {}
