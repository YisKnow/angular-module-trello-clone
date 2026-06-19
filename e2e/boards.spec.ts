import { test, expect } from '@playwright/test';
import { mockApi } from './helpers';

async function login(page: import('@playwright/test').Page) {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/app\/boards/);
}

test.describe('Boards list', () => {
  test('renders the board cards with covers and titles', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: /your boards/i })).toBeVisible();
    await expect(page.getByText('My roadmap')).toBeVisible();
    await expect(page.getByText('Personal')).toBeVisible();
    await expect(page.getByText(/2 boards/i)).toBeVisible();
  });

  test('navigates to a board when clicking its card', async ({ page }) => {
    await login(page);
    await page.getByText('My roadmap').click();
    await expect(page).toHaveURL(/\/app\/boards\/b1/);
    await expect(page.getByRole('heading', { name: 'My roadmap' })).toBeVisible();
    await expect(page.getByText('Todo')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
    await expect(page.getByText('First card')).toBeVisible();
  });

  test('renders the create-board empty-state CTA when the user has zero boards', async ({ page }) => {
    // ponytail: re-mock with zero boards so the empty state renders.
    await page.route('**/api/v1/me/boards', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    // The default mockApi fixture still covers /auth/login + /me/profile.
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/me/boards')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      if (url.includes('/auth/login')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
              btoa(JSON.stringify({ sub: '1', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })) + '.sig',
            refresh_token: btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
              btoa(JSON.stringify({ sub: '1', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 })) + '.sig',
          }),
        });
      }
      if (url.includes('/me/profile')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1, name: 'Test User', email: 'test@example.com',
            avatar: '', creationAt: '2024-01-01', updatedAt: '2024-01-01',
          }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/app\/boards/);

    // Empty state CTA is visible (native HTML button, not a CDK overlay).
    await expect(page.getByRole('button', { name: /create your first board/i })).toBeVisible();
  });
});
