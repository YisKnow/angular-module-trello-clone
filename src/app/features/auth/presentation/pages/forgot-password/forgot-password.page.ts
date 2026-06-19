import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { ForgotPasswordFormComponent } from '@features/auth/presentation/components/forgot-password-form/forgot-password-form.component';
import { BackgroundComponent } from '@features/auth/presentation/components/background/background.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, ForgotPasswordFormComponent, BackgroundComponent],
  templateUrl: './forgot-password.page.html',
})
export class ForgotPasswordPage {}
