import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, exhaustMap, of, tap } from 'rxjs';
import { NgIf } from '@angular/common';

import { RequestStatus } from '@models/request-status.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService } from '@services/auth.service';

import { CustomValidators } from '@utils/validators';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    ButtonComponent,
  ],
  templateUrl: './register-form.component.html',
})
export class RegisterFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly registerSubject = new Subject<{
    name: string;
    email: string;
    password: string;
  }>();
  private readonly validateSubject = new Subject<{ email: string }>();

  readonly registerResult = toSignal(
    this.registerSubject.pipe(
      exhaustMap(({ name, email, password }) =>
        this.authService.registerAndLogin(name, email, password).pipe(
          tap({
            next: () => {
              this.status = 'success';
              this.errorMessage = '';
              this.router.navigate(['/app/boards']);
            },
            error: (err) => {
              this.status = 'failed';
              this.errorMessage =
                err?.error?.message || 'Registration failed. Please try again.';
            },
          }),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: null },
  );

  readonly validateResult = toSignal(
    this.validateSubject.pipe(
      exhaustMap(({ email }) =>
        this.authService.isAvailable(email).pipe(
          tap({
            next: (rta) => {
              this.statusUser = 'success';
              if (rta.isAvailable) {
                this.showRegister = true;
                this.form.controls.email.setValue(email);
              } else {
                this.router.navigate(['/login'], {
                  queryParams: { email },
                });
              }
            },
            error: () => {
              this.statusUser = 'failed';
            },
          }),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: null },
  );

  formUser = this.formBuilder.nonNullable.group({
    email: ['', [Validators.email, Validators.required]],
  });

  form = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.minLength(8), Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [
        CustomValidators.MatchValidator('password', 'confirmPassword'),
      ],
    },
  );
  status: RequestStatus = 'init';
  statusUser: RequestStatus = 'init';
  errorMessage = '';
  showPassword = false;
  showRegister = false;

  register() {
    if (this.form.valid) {
      this.status = 'loading';
      const { name, email, password } = this.form.getRawValue();
      this.registerSubject.next({ name, email, password });
    } else {
      this.form.markAllAsTouched();
    }
  }

  validateUser() {
    if (this.formUser.valid) {
      this.statusUser = 'loading';
      const { email } = this.formUser.getRawValue();
      this.validateSubject.next({ email });
    } else {
      this.formUser.markAllAsTouched();
    }
  }
}
