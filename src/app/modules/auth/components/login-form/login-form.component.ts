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
import { Subject, catchError, exhaustMap, of, tap } from 'rxjs';

import { RequestStatus } from '@models/request-status.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormField, FormRoot, ButtonComponent],
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly queryParamMap = toSignal(this.route.queryParamMap);
  private readonly loginSubject = new Subject<{ email: string; password: string }>();

  readonly loginResult = toSignal(
    this.loginSubject.pipe(
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
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
  status: RequestStatus = 'init';
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
