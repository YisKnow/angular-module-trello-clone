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
import { Subject, catchError, exhaustMap, from, of, tap } from 'rxjs';

// ponytail: type inlined, was @shared/models/request-status.model

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

  readonly loginResult = toSignal(
    this.loginSubject.pipe(
      exhaustMap(({ email, password }) =>
        from(this.authFacade.login(email, password)).pipe(
          tap({
            next: () => {
              this.status = 'success';
              this.errorMessage = '';
              this.router.navigate(['/app']);
            },
            error: (err) => {
              this.status = 'failed';
              this.errorMessage =
                err?.error?.message || 'Credentials are invalid. Please try again.';
            },
          }),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: null },
  );

  showPassword = false;
  status: 'init' | 'loading' | 'success' | 'failed' = 'init';
  errorMessage = '';

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
          this.status = 'loading';
          const { email, password } = this.form().value();
          this.loginSubject.next({ email, password });
        },
      },
    },
  );

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
