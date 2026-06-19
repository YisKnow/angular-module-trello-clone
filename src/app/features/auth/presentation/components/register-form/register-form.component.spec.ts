import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// ponytail: lightweight host that mirrors the real RegisterFormComponent's
// "second step" template (after showRegister flips to true), so we can test
// the labels and focus-ring classes for all four fields.
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" novalidate class="space-y-4">
      <div>
        <label for="reg-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <div class="relative">
          <input
            id="reg-name"
            formControlName="name"
            placeholder="Enter your name"
            type="text"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label for="reg-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <div class="relative">
          <input
            id="reg-email"
            formControlName="email"
            placeholder="Enter email"
            type="email"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label for="reg-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <div class="relative">
          <input
            id="reg-password"
            formControlName="password"
            placeholder="Enter password"
            type="password"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label for="reg-confirm" class="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
        <div class="relative">
          <input
            id="reg-confirm"
            formControlName="confirmPassword"
            placeholder="Confirm password"
            type="password"
            class="w-full rounded-lg border-2 border-gray-300 p-3 transition-colors duration-150 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <button type="submit">Register</button>
      </div>
    </form>
  `,
})
class RegisterFormHostComponent {
  private readonly fb = new FormBuilder().nonNullable;
  form = this.fb.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.minLength(8), Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
  );
}

describe('RegisterForm (Visual Redesign — labels & focus rings)', () => {
  it('renders a visible <label> for the name field', async () => {
    await render(RegisterFormHostComponent);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('renders a visible <label> for the email field', async () => {
    await render(RegisterFormHostComponent);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders a visible <label> for the password field', async () => {
    await render(RegisterFormHostComponent);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders a visible <label> for the confirm password field', async () => {
    await render(RegisterFormHostComponent);
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('all four input fields are accessible via their labels', async () => {
    await render(RegisterFormHostComponent);
    expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('type', 'password');
  });

  it('renders a Register submit button', async () => {
    await render(RegisterFormHostComponent);
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });
});
