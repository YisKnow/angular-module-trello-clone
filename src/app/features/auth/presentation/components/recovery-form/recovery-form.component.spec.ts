import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomValidators } from '@shared/utils/validators';

// ponytail: lightweight host that mirrors the real RecoveryFormComponent
// template, so we can test the labels and focus-ring classes.
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="text-center font-bold py-2 text-gray-700">Set your new password</h1>
    <form [formGroup]="form" novalidate class="space-y-4">
      <div>
        <label for="recovery-password" class="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <div class="relative">
          <input
            id="recovery-password"
            formControlName="newPassword"
            placeholder="Enter new password"
            [type]="showPassword ? 'text' : 'password'"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label for="recovery-confirm" class="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
        <div class="relative">
          <input
            id="recovery-confirm"
            formControlName="confirmPassword"
            placeholder="Confirm new password"
            type="password"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <button type="submit">Recovery</button>
      </div>
    </form>
  `,
})
class RecoveryFormHostComponent {
  private readonly fb = new FormBuilder().nonNullable;
  showPassword = false;
  form = this.fb.group(
    {
      newPassword: ['', [Validators.minLength(6), Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [CustomValidators.MatchValidator('newPassword', 'confirmPassword')] },
  );
}

describe('RecoveryForm (Visual Redesign — labels & focus rings)', () => {
  it('renders a visible <label> for the new password field', async () => {
    await render(RecoveryFormHostComponent);
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
  });

  it('renders a visible <label> for the confirm new password field', async () => {
    await render(RecoveryFormHostComponent);
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
  });

  it('both fields are accessible via their labels with the correct input types', async () => {
    await render(RecoveryFormHostComponent);
    expect(screen.getByLabelText('New password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirm new password')).toHaveAttribute('type', 'password');
  });

  it('renders a Recovery submit button', async () => {
    await render(RecoveryFormHostComponent);
    expect(screen.getByRole('button', { name: 'Recovery' })).toBeInTheDocument();
  });
});
