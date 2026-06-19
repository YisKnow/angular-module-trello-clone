import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NgIf } from '@angular/common';

import { toAsyncSignal, errorMessageOf } from '@shared/utils/async-signal';
import { CustomValidators } from '@shared/utils/validators';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './register-form.component.html',
})
export class RegisterFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  private readonly registerSubject = new Subject<{
    name: string;
    email: string;
    password: string;
  }>();
  private readonly validateSubject = new Subject<{ email: string }>();

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
      validators: [CustomValidators.MatchValidator('password', 'confirmPassword')],
    },
  );
  errorMessage = '';
  showPassword = false;
  showRegister = false;
  status: 'init' | 'loading' | 'success' | 'failed' = 'init';
  statusUser: 'init' | 'loading' | 'success' | 'failed' = 'init';

  // ponytail: AsyncSignal pattern — see shared/utils/async-signal.ts.
  private readonly _registerAsync = toAsyncSignal<
    { name: string; email: string; password: string },
    unknown
  >({
    subject: this.registerSubject,
    action: ({ name, email, password }) => this.authFacade.registerAndLogin(name, email, password),
    onStart: () => {
      this.status = 'loading';
    },
    onSuccess: () => {
      this.status = 'success';
      this.router.navigate(['/app/boards']);
    },
    onError: (err) => {
      this.status = 'failed';
      this.errorMessage = errorMessageOf(err, 'Registration failed. Please try again.');
    },
  });

  // ponytail: status for the email-availability probe; not surfaced as a
  // signal because the only signal effect is `showRegister` / navigation.
  private readonly _validateAsync = toAsyncSignal<{ email: string }, boolean>({
    subject: this.validateSubject,
    action: ({ email }) => this.authFacade.isAvailable(email),
    onStart: () => {
      this.statusUser = 'loading';
    },
    onSuccess: (isAvailable, { email }) => {
      this.statusUser = 'success';
      if (isAvailable) {
        this.showRegister = true;
        this.form.controls.email.setValue(email);
      } else {
        this.router.navigate(['/login'], { queryParams: { email } });
      }
    },
    onError: () => {
      this.statusUser = 'failed';
    },
  });

  register() {
    if (this.form.valid) {
      this.errorMessage = '';
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
      this.validateSubject.next({ email: this.formUser.getRawValue().email });
    } else {
      this.formUser.markAllAsTouched();
    }
  }
}
