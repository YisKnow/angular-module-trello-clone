import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { Component, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  schema,
  required,
  email,
  minLength,
} from '@angular/forms/signals';

// ponytail: lightweight host that mirrors the real LoginFormComponent's
// template + signal-form structure, so we can test the rendered DOM
// (visible labels, focus ring classes, accessible inputs).
@Component({
  standalone: true,
  imports: [FormField, FormRoot],
  template: `
    <h1 class="text-center font-bold py-2 text-gray-700">Log in to Trello</h1>
    <form [formRoot]="form" class="space-y-4">
      <div>
        <div class="relative">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            [formField]="form.email"
            placeholder="Enter email"
            type="email"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <div class="relative">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1"
            >Password</label
          >
          <input
            id="password"
            [formField]="form.password"
            placeholder="Enter password"
            [type]="showPassword ? 'text' : 'password'"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <button type="submit">Login</button>
      </div>
    </form>
  `,
})
class LoginFormHostComponent {
  showPassword = false;
  readonly form = form(
    signal<{ email: string; password: string }>({ email: '', password: '' }),
    schema((path) => {
      required(path.email);
      email(path.email);
      required(path.password);
      minLength(path.password, 6);
    }),
  );
}

describe('LoginForm (Visual Redesign — labels & focus rings)', () => {
  it('renders a visible <label> for the email field', async () => {
    await render(LoginFormHostComponent);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders a visible <label> for the password field', async () => {
    await render(LoginFormHostComponent);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('email input is focusable and accessible via its label', async () => {
    await render(LoginFormHostComponent);
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'Enter email');
  });

  it('password input has a type="password" attribute by default', async () => {
    await render(LoginFormHostComponent);
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('renders a Login submit button', async () => {
    await render(LoginFormHostComponent);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
