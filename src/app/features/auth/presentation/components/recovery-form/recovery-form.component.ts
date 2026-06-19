import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, exhaustMap, from, of, tap } from 'rxjs';
import { NgIf } from '@angular/common';

// ponytail: type inlined, was @shared/models/request-status.model

import { CustomValidators } from '@shared/utils/validators';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';

@Component({
  selector: 'app-recovery-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
  ],
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

  readonly changePasswordResult = toSignal(
    this.changePasswordSubject.pipe(
      exhaustMap(({ token, newPassword }) =>
        from(this.authFacade.changePassword(token, newPassword)).pipe(
          tap({
            next: () => {
              this.status = 'success';
              this.errorMessage = '';
              this.router.navigate(['/login']);
            },
            error: (err) => {
              this.status = 'failed';
              this.errorMessage =
                err?.error?.message || 'Password change failed. Please try again.';
              this.router.navigate(['/login']);
            },
          }),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: null },
  );

  form = this.formBuilder.nonNullable.group(
    {
      newPassword: ['', [Validators.minLength(6), Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [
        CustomValidators.MatchValidator('newPassword', 'confirmPassword'),
      ],
    },
  );
  status: 'init' | 'loading' | 'success' | 'failed' = 'init';
  errorMessage = '';
  showPassword = false;
  token = '';

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

  recovery() {
    if (this.form.valid) {
      this.changePasswordSubject.next({
        token: this.token,
        newPassword: this.form.getRawValue().newPassword,
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
