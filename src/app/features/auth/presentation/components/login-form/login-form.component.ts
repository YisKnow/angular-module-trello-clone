import { Component, effect, inject, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  minLength,
  FormField,
  FormRoot,
} from '@angular/forms/signals';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

import { toAsyncSignal, errorMessageOf } from '@shared/utils/async-signal';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormField, FormRoot],
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacade);

  private readonly queryParamMap = toSignal(this.route.queryParamMap);
  private readonly loginSubject = new Subject<{ email: string; password: string }>();

  showPassword = false;
  errorMessage = '';
  status: 'init' | 'loading' | 'success' | 'failed' = 'init';

  readonly form = form(
    signal<{ email: string; password: string }>({ email: '', password: '' }),
    schema((path) => {
      required(path.email);
      email(path.email);
      required(path.password);
      minLength(path.password, 6);
    }),
    {
      submission: {
        action: async () => {
          this.errorMessage = '';
          this.status = 'loading';
          const { email, password } = this.form().value();
          this.loginSubject.next({ email, password });
        },
      },
    },
  );

  // ponytail: AsyncSignal pattern — see shared/utils/async-signal.ts.
  private readonly _loginAsync = toAsyncSignal<{ email: string; password: string }, unknown>({
    subject: this.loginSubject,
    action: ({ email, password }) => this.authFacade.login(email, password),
    onStart: () => { this.status = 'loading'; },
    onSuccess: () => {
      this.status = 'success';
      this.router.navigate(['/app']);
    },
    onError: (err) => {
      this.status = 'failed';
      this.errorMessage = errorMessageOf(err, 'Credentials are invalid. Please try again.');
    },
  });

  constructor() {
    // Apply pre-filled email from query params on first signal emission
    effect(() => {
      const email = this.queryParamMap()?.get('email');
      if (email) {
        this.form.email().value.set(email);
      }
    });
  }
}
