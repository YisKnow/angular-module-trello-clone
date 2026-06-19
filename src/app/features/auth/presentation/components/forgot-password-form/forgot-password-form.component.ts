import { Component, inject, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  FormField,
  FormRoot,
} from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, exhaustMap, from, of, tap } from 'rxjs';

// ponytail: type inlined, was @shared/models/request-status.model

import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';

@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [FormField, FormRoot, ButtonComponent],
  templateUrl: './forgot-password-form.component.html',
})
export class ForgotPasswordFormComponent {
  private readonly authFacade = inject(AuthFacade);

  private readonly recoverySubject = new Subject<{ email: string }>();

  readonly recoveryResult = toSignal(
    this.recoverySubject.pipe(
      exhaustMap(({ email }) =>
        from(this.authFacade.recovery(email)).pipe(
          tap({
            next: () => {
              this.status = 'success';
              this.errorMessage = '';
              this.emailSent = true;
            },
            error: (err) => {
              this.status = 'failed';
              this.errorMessage =
                err?.error?.message || 'Could not send recovery link. Please try again.';
            },
          }),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: null },
  );

  status: 'init' | 'loading' | 'success' | 'failed' = 'init';
  errorMessage = '';
  emailSent = false;

  readonly form = form(
    signal<{ email: string }>({ email: '' }),
    schema((path) => {
      required(path.email);
      email(path.email);
    }),
    {
      submission: {
        action: async () => {
          this.status = 'loading';
          this.recoverySubject.next({ email: this.form().value().email });
        },
      },
    },
  );
}
