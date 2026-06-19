import { Component, inject, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  FormField,
  FormRoot,
} from '@angular/forms/signals';
import { Subject } from 'rxjs';

import { toAsyncSignal, errorMessageOf } from '@shared/utils/async-signal';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';

@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [FormField, FormRoot],
  templateUrl: './forgot-password-form.component.html',
})
export class ForgotPasswordFormComponent {
  private readonly authFacade = inject(AuthFacade);

  private readonly recoverySubject = new Subject<{ email: string }>();

  errorMessage = '';
  emailSent = false;
  status: 'init' | 'loading' | 'success' | 'failed' = 'init';

  readonly form = form(
    signal<{ email: string }>({ email: '' }),
    schema((path) => {
      required(path.email);
      email(path.email);
    }),
    {
      submission: {
        action: async () => {
          this.errorMessage = '';
          this.status = 'loading';
          this.recoverySubject.next({ email: this.form().value().email });
        },
      },
    },
  );

  // ponytail: AsyncSignal pattern — see shared/utils/async-signal.ts.
  private readonly recoveryAsync = toAsyncSignal<{ email: string }, void>({
    subject: this.recoverySubject,
    action: ({ email }) => this.authFacade.recovery(email),
    onStart: () => { this.status = 'loading'; },
    onSuccess: () => {
      this.status = 'success';
      this.emailSent = true;
    },
    onError: (err) => {
      this.status = 'failed';
      this.errorMessage = errorMessageOf(err, 'Could not send recovery link. Please try again.');
    },
  });
}
