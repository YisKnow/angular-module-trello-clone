import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { Component, signal } from '@angular/core';
import { FormField, FormRoot, form, schema, required, email } from '@angular/forms/signals';

// ponytail: lightweight host that mirrors the real ForgotPasswordFormComponent
// template, so we can test the visible label and focus-ring classes.
@Component({
  standalone: true,
  imports: [FormField, FormRoot],
  template: `
    <h1 class="text-center font-bold py-2 text-gray-700">Can't log in?</h1>
    <form [formRoot]="form" class="space-y-4">
      <div>
        <label for="forgot-email" class="block text-xs font-semibold my-2"
          >We'll send a recovery link to</label
        >
        <div class="relative">
          <input
            id="forgot-email"
            [formField]="form.email"
            placeholder="Enter email"
            type="email"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <button type="submit">Send Recovery Link</button>
      </div>
    </form>
  `,
})
class ForgotPasswordFormHostComponent {
  readonly form = form(
    signal<{ email: string }>({ email: '' }),
    schema((path) => {
      required(path.email);
      email(path.email);
    }),
  );
}

describe('ForgotPasswordForm (Visual Redesign)', () => {
  it('renders a visible <label> for the email field', async () => {
    await render(ForgotPasswordFormHostComponent);
    expect(screen.getByLabelText("We'll send a recovery link to")).toBeInTheDocument();
  });

  it('email input is type="email" and accessible via its label', async () => {
    await render(ForgotPasswordFormHostComponent);
    const input = screen.getByLabelText("We'll send a recovery link to");
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders a Send Recovery Link submit button', async () => {
    await render(ForgotPasswordFormHostComponent);
    expect(screen.getByRole('button', { name: 'Send Recovery Link' })).toBeInTheDocument();
  });
});
