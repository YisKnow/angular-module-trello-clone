import { test, expect } from '@playwright/test';
import { mockApi } from './helpers';

async function openBoardDetail(page: import('@playwright/test').Page) {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/app\/boards/);
  await page.getByText('My roadmap').click();
  await expect(page).toHaveURL(/\/app\/boards\/b1/);
  await expect(page.getByText('First card')).toBeVisible();
}

test.describe('Card detail (TodoDialogComponent)', () => {
  test('opens dialog with description and renders a Save control on edit', async ({ page }) => {
    await openBoardDetail(page);

    // The card title lives inside a clickable card on the board page.
    await page.getByText('First card').click();

    // The dialog opens with the description shown as a clickable button.
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Card description' })).toBeVisible();

    // Clicking the description enters edit mode (textarea + Save).
    await page.getByTestId('open-description-edit').click();
    const textarea = page.getByTestId('description-textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue('Card description');
  });

  test('saving description sends a PUT with the new value', async ({ page }) => {
    let putRequest: { url: string; body: unknown } | null = null;
    const putReceived = new Promise<void>((resolve) => {
      // Capture the PUT request as soon as it fires.
      page.on('request', (req) => {
        if (req.url().includes('/cards/c1') && req.method() === 'PUT') {
          putRequest = { url: req.url(), body: JSON.parse(req.postData() ?? '{}') };
          resolve();
        }
      });
    });

    await mockApi(page);
    await page.route('**/api/v1/cards/c1', async (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'c1',
            title: 'First card',
            description: 'Updated description',
            position: 65535,
            list: { id: 'l1', title: 'Todo', position: 65535, cards: [] },
          }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await openBoardDetail(page);
    await page.getByText('First card').click();
    await page.getByTestId('open-description-edit').click();

    const textarea = page.getByTestId('description-textarea');
    await textarea.fill('Updated description');
    await page.getByTestId('save-description').click();

    // Wait for the PUT request to actually fire (or fail after 5s).
    await putReceived;

    expect(putRequest).not.toBeNull();
    expect(putRequest!.body).toMatchObject({ description: 'Updated description' });
  });
});

test.describe('Delete board', () => {
  test('delete button on a board card calls the API and removes it from the list', async ({ page }) => {
    let deleteCalled = false;
    await mockApi(page);
    await page.route('**/api/v1/boards/b2', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/app\/boards/);

    // The "Personal" card has id b2 — hover to reveal the delete button.
    await page.locator('a[href="/app/boards/b2"]').hover();
    await page.locator('a[href="/app/boards/b2"]').locator('..').getByTestId('delete-board').click();

    expect(deleteCalled).toBe(true);
  });
});

test.describe('Confirm dialog (delete card / list)', () => {
  test('confirming a card delete removes the card locally', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/app\/boards/);

    await page.getByText('My roadmap').click();
    await expect(page).toHaveURL(/\/app\/boards\/b1/);
    await expect(page.getByText('First card')).toBeVisible();

    await page.getByTestId('delete-card-c1').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/delete card\?/i)).toBeVisible();
    await page.getByTestId('confirm-ok').click();

    await expect(page.getByText('First card')).not.toBeVisible();
  });

  test('cancelling a card delete keeps the card', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/app\/boards/);

    await page.getByText('My roadmap').click();
    await expect(page).toHaveURL(/\/app\/boards\/b1/);

    await page.getByTestId('delete-card-c1').click();
    await page.getByTestId('confirm-cancel').click();

    await expect(page.getByText('First card')).toBeVisible();
  });

  test('confirming a list delete removes the list and its cards', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/app\/boards/);

    await page.getByText('My roadmap').click();
    await expect(page).toHaveURL(/\/app\/boards\/b1/);

    await page.getByTestId('delete-list-l2').click();
    await expect(page.getByText(/delete list\?/i)).toBeVisible();
    await page.getByTestId('confirm-ok').click();

    await expect(page.getByText('Done')).not.toBeVisible();
    // The "Todo" list should still be there.
    await expect(page.getByText('Todo')).toBeVisible();
  });
});
