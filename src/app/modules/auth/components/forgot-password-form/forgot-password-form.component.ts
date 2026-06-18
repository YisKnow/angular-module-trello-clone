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
import { Subject, catchError, exhaustMap, of, tap } from 'rxjs';

import { RequestStatus } from '@models/request-status.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [FormField, FormRoot, ButtonComponent],
  templateUrl: './forgot-password-form.component.html',
})
export class ForgotPasswordFormComponent {
  private readonly authService = inject(AuthService);

  private readonly recoverySubject = new Subject<{ email: string }>();

  readonly recoveryResult = toSignal(
    this.recoverySubject.pipe(
      exhaustMap(({ email }) =>
        this.authService.recovery(email).pipe(
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

  status: RequestStatus = 'init';
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
