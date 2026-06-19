import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { NgIf } from '@angular/common';

import { toAsyncSignal, errorMessageOf } from '@shared/utils/async-signal';
import { CustomValidators } from '@shared/utils/validators';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';

@Component({
  selector: 'app-recovery-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './recovery-form.component.html',
})
export class RecoveryFormComponent {
  private readonly activateRoute = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  private readonly queryParamMap = toSignal(this.activateRoute.queryParamMap);
  private readonly changePasswordSubject = new Subject<{
    token: string;
    newPassword: string;
  }>();

  form = this.formBuilder.nonNullable.group(
    {
      newPassword: ['', [Validators.minLength(8), Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [CustomValidators.MatchValidator('newPassword', 'confirmPassword')],
    },
  );
  errorMessage = '';
  showPassword = false;
  token = '';
  status: 'init' | 'loading' | 'success' | 'failed' = 'init';

  constructor() {
    // Apply token from query params on first signal emission
    queueMicrotask(() => {
      const token = this.queryParamMap()?.get('token');
      if (token) {
        this.token = token;
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // ponytail: AsyncSignal pattern — see shared/utils/async-signal.ts.
  private readonly _changePasswordAsync = toAsyncSignal<
    { token: string; newPassword: string },
    void
  >({
    subject: this.changePasswordSubject,
    action: ({ token, newPassword }) => this.authFacade.changePassword(token, newPassword),
    onStart: () => {
      this.status = 'loading';
    },
    onSuccess: () => {
      this.status = 'success';
      this.router.navigate(['/login']);
    },
    onError: (err) => {
      this.status = 'failed';
      this.errorMessage = errorMessageOf(err, 'Password change failed. Please try again.');
    },
  });

  recovery() {
    if (this.form.valid) {
      this.errorMessage = '';
      this.changePasswordSubject.next({
        token: this.token,
        newPassword: this.form.getRawValue().newPassword,
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
