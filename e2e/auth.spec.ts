import { test, expect } from '@playwright/test';
import { mockApi } from './helpers';

test.describe('Auth flow', () => {
  test('login with valid credentials navigates to boards', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/app\/boards/);
    await expect(page.getByRole('heading', { name: /your boards/i })).toBeVisible();
    await expect(page.getByText('My roadmap')).toBeVisible();
    await expect(page.getByText('Personal')).toBeVisible();
  });

  test('login with empty fields shows validation errors', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');

    await page.getByRole('button', { name: 'Log in' }).click();

    // Email is required, error renders below the input.
    await expect(page.getByText('This field is required').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('clearing tokens redirects unauthenticated access to login', async ({ page }) => {
    // ponytail: we exercise the redirect-guard path rather than driving
    // the CDK avatar overlay (which has fl timing in headless Chromium).
    // The AuthFacade.logout() call removes the cookies; the next guarded
    // navigation must redirect to /login.
    await mockApi(page);
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/app\/boards/);

    // Manually clear cookies (simulating the logout side effect) and
    // navigate to a protected route. The authGuard must redirect to /login.
    await page.context().clearCookies();
    await page.goto('/app/boards');
    await expect(page).toHaveURL(/\/login/);
  });
});
