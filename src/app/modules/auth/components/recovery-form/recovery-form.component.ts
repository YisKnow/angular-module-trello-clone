import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, exhaustMap, of, tap } from 'rxjs';
import { NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { RequestStatus } from '@models/request-status.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService } from '@services/auth.service';

import { CustomValidators } from '@utils/validators';

@Component({
  selector: 'app-recovery-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FontAwesomeModule,
    NgIf,
    ButtonComponent,
  ],
  templateUrl: './recovery-form.component.html',
})
export class RecoveryFormComponent {
  private readonly activateRoute = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly queryParamMap = toSignal(this.activateRoute.queryParamMap);
  private readonly changePasswordSubject = new Subject<{
    token: string;
    newPassword: string;
  }>();

  readonly changePasswordResult = toSignal(
    this.changePasswordSubject.pipe(
      exhaustMap(({ token, newPassword }) =>
        this.authService.changePassword(token, newPassword).pipe(
          tap({
            next: () => {
              this.status = 'success';
              this.router.navigate(['/login']);
            },
            error: () => {
              this.status = 'failed';
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
  status: RequestStatus = 'init';
  faEye = faEye;
  faEyeSlash = faEyeSlash;
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
