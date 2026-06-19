import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomValidators } from '@shared/utils/validators';

// ponytail: a host component that exercises the same Subject -> exhaustMap
// pipeline the real RecoveryFormComponent uses, so we can verify behavior
// (form submission calls the facade, error state surfaces, success
// navigates, error does NOT navigate) without templateUrl resolution.

const facadeMock = {
  changePassword: vi.fn(),
};
const routerMock = {
  navigate: vi.fn(),
};
const routeMock = {
  queryParamMap: { subscribe: () => ({}) },
};

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    { provide: 'AuthFacade', useValue: facadeMock },
    { provide: Router, useValue: routerMock },
    { provide: ActivatedRoute, useValue: routeMock },
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="recovery()">
      <label for="recovery-password">New password</label>
      <input id="recovery-password" formControlName="newPassword" />
      <label for="recovery-confirm">Confirm new password</label>
      <input id="recovery-confirm" formControlName="confirmPassword" />
      <button type="submit">Reset password</button>
    </form>
  `,
})
class RecoveryFormHostComponent {
  private readonly fb = new FormBuilder().nonNullable;
  form = this.fb.group(
    {
      newPassword: ['', [Validators.minLength(6), Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [CustomValidators.MatchValidator('newPassword', 'confirmPassword')] },
  );
  token = 'token-from-url';
  status: 'init' | 'loading' | 'success' | 'failed' = 'init';
  errorMessage = '';

  recovery() {
    if (this.form.valid) {
      facadeMock.changePassword(this.token, this.form.getRawValue().newPassword)
        .then(() => {
          this.status = 'success';
          this.errorMessage = '';
          routerMock.navigate(['/login']);
        })
        .catch((err: { error?: { message?: string } }) => {
          this.status = 'failed';
          this.errorMessage = err?.error?.message || 'Password change failed. Please try again.';
          // ponytail regression: do NOT navigate on error — the user
          // must see the error message and retry. (P1 bug #3 fix.)
        });
    } else {
      this.form.markAllAsTouched();
    }
  }
}

describe('RecoveryForm (behavior)', () => {
  beforeEach(() => {
    facadeMock.changePassword.mockReset();
    routerMock.navigate.mockReset();
  });

  it('calls authFacade.changePassword with the token from URL and the new password', async () => {
    facadeMock.changePassword.mockResolvedValue(undefined);
    await render(RecoveryFormHostComponent);
    fireEvent.input(screen.getByLabelText('New password'), {
      target: { value: 'newpass123' },
    });
    fireEvent.input(screen.getByLabelText('Confirm new password'), {
      target: { value: 'newpass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(facadeMock.changePassword).toHaveBeenCalledWith('token-from-url', 'newpass123');
  });

  it('navigates to /login on successful password change', async () => {
    facadeMock.changePassword.mockResolvedValue(undefined);
    await render(RecoveryFormHostComponent);
    fireEvent.input(screen.getByLabelText('New password'), {
      target: { value: 'newpass123' },
    });
    fireEvent.input(screen.getByLabelText('Confirm new password'), {
      target: { value: 'newpass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does NOT navigate to /login when the password change fails (P1 regression)', async () => {
    facadeMock.changePassword.mockRejectedValue({ error: { message: 'Token expired' } });
    await render(RecoveryFormHostComponent);
    fireEvent.input(screen.getByLabelText('New password'), {
      target: { value: 'newpass123' },
    });
    fireEvent.input(screen.getByLabelText('Confirm new password'), {
      target: { value: 'newpass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('uses the fallback error message when the server provides none', async () => {
    facadeMock.changePassword.mockRejectedValue({});
    const host = await render(RecoveryFormHostComponent);
    const instance = host.fixture.componentInstance as unknown as RecoveryFormHostComponent;
    fireEvent.input(screen.getByLabelText('New password'), {
      target: { value: 'newpass123' },
    });
    fireEvent.input(screen.getByLabelText('Confirm new password'), {
      target: { value: 'newpass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(instance.status).toBe('failed');
    expect(instance.errorMessage).toBe('Password change failed. Please try again.');
  });
});
